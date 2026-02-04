"""
API эндпоинты для постов
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Post, PostStatus, Feedback, AgentDecision
from ..schemas import (
    PostCreate, PostUpdate, PostResponse, PostList,
    FeedbackCreate, FeedbackResponse, FeedbackList,
    AgentDecisionCreate, AgentDecisionResponse
)

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("", response_model=PostList)
def list_posts(
    status: Optional[str] = None,
    platform: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    """Получить список постов с фильтрами"""
    query = db.query(Post)

    if status:
        query = query.filter(Post.status == status)
    if platform:
        query = query.filter(Post.platform == platform)

    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()

    return PostList(
        items=[PostResponse.model_validate(p) for p in posts],
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Получить пост по ID"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return PostResponse.model_validate(post)


@router.post("", response_model=PostResponse, status_code=201)
def create_post(post_data: PostCreate, db: Session = Depends(get_db)):
    """Создать новый пост"""
    post = Post(
        title=post_data.title,
        content=post_data.content,
        platform=post_data.platform,
        author=post_data.author,
        status=PostStatus.IDEA.value
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)


@router.patch("/{post_id}", response_model=PostResponse)
def update_post(post_id: int, post_data: PostUpdate, db: Session = Depends(get_db)):
    """Обновить пост"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    update_data = post_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Удалить пост"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()
    return None


@router.post("/{post_id}/approve", response_model=PostResponse)
def approve_post(post_id: int, db: Session = Depends(get_db)):
    """Одобрить пост (review -> scheduled)"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.status != PostStatus.REVIEW.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve post with status '{post.status}'. Must be 'review'"
        )

    post.status = PostStatus.SCHEDULED.value
    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)


@router.post("/{post_id}/reject", response_model=PostResponse)
def reject_post(post_id: int, db: Session = Depends(get_db)):
    """Отклонить пост"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.status = PostStatus.REJECTED.value
    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)


@router.get("/stats/by-status")
def get_stats_by_status(db: Session = Depends(get_db)):
    """Статистика постов по статусам"""
    result = db.query(
        Post.status,
        func.count(Post.id).label("count")
    ).group_by(Post.status).all()

    return {row.status: row.count for row in result}


@router.get("/stats/by-platform")
def get_stats_by_platform(db: Session = Depends(get_db)):
    """Статистика постов по платформам"""
    result = db.query(
        Post.platform,
        func.count(Post.id).label("count")
    ).group_by(Post.platform).all()

    return {row.platform: row.count for row in result}


# ═══════════════════════════════════════════════════
# FEEDBACK ENDPOINTS (для обучения агента)
# ═══════════════════════════════════════════════════

@router.post("/{post_id}/feedback", response_model=FeedbackResponse, status_code=201)
def record_feedback(
    post_id: int,
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Записать feedback на сгенерированный контент.
    Используется агентом для обучения на основе человеческих решений.

    feedback_type: approved | rejected | edited
    """
    # Проверяем что пост существует
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Создаём запись feedback
    feedback = Feedback(
        post_id=post_id,
        feedback_type=feedback_data.feedback_type,
        confidence_before=feedback_data.confidence_before,
        original_content=feedback_data.original_content,
        edited_content=feedback_data.edited_content,
        rejection_reason=feedback_data.rejection_reason,
        rejection_details=feedback_data.rejection_details,
        user_id=feedback_data.user_id
    )

    db.add(feedback)

    # Обновляем статус поста в зависимости от типа feedback
    if feedback_data.feedback_type == "approved":
        post.status = PostStatus.SCHEDULED.value
    elif feedback_data.feedback_type == "rejected":
        post.status = PostStatus.REJECTED.value
    elif feedback_data.feedback_type == "edited":
        # При редактировании обновляем контент и статус
        if feedback_data.edited_content:
            post.content = feedback_data.edited_content
        post.status = PostStatus.SCHEDULED.value

    db.commit()
    db.refresh(feedback)

    return FeedbackResponse.model_validate(feedback)


@router.get("/{post_id}/feedback", response_model=FeedbackList)
def get_post_feedback(post_id: int, db: Session = Depends(get_db)):
    """Получить все feedback для поста"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    feedbacks = db.query(Feedback).filter(
        Feedback.post_id == post_id
    ).order_by(Feedback.created_at.desc()).all()

    return FeedbackList(
        items=[FeedbackResponse.model_validate(f) for f in feedbacks],
        total=len(feedbacks)
    )


@router.get("/feedback/recent", response_model=FeedbackList)
def get_recent_feedback(
    limit: int = Query(default=50, le=200),
    feedback_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Получить последние feedback записи.
    Используется для Reflexion анализа.
    """
    query = db.query(Feedback)

    if feedback_type:
        query = query.filter(Feedback.feedback_type == feedback_type)

    feedbacks = query.order_by(Feedback.created_at.desc()).limit(limit).all()
    total = query.count()

    return FeedbackList(
        items=[FeedbackResponse.model_validate(f) for f in feedbacks],
        total=total
    )


@router.get("/feedback/stats")
def get_feedback_stats(
    days: int = Query(default=7, le=90),
    db: Session = Depends(get_db)
):
    """
    Статистика feedback за период.
    Возвращает approval rate и распределение по типам.
    """
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(days=days)

    feedbacks = db.query(Feedback).filter(
        Feedback.created_at >= cutoff
    ).all()

    total = len(feedbacks)
    if total == 0:
        return {
            "period_days": days,
            "total": 0,
            "approval_rate": 0.0,
            "by_type": {}
        }

    by_type = {}
    for f in feedbacks:
        by_type[f.feedback_type] = by_type.get(f.feedback_type, 0) + 1

    approved = by_type.get("approved", 0) + by_type.get("edited", 0)
    approval_rate = approved / total

    return {
        "period_days": days,
        "total": total,
        "approval_rate": round(approval_rate, 3),
        "by_type": by_type
    }


# ═══════════════════════════════════════════════════
# AGENT DECISIONS ENDPOINTS (для аудита)
# ═══════════════════════════════════════════════════

@router.post("/agent/decision", response_model=AgentDecisionResponse, status_code=201)
def record_agent_decision(
    decision_data: AgentDecisionCreate,
    db: Session = Depends(get_db)
):
    """
    Записать решение агента для аудита.

    decision_type: generate | publish | modify_prompt | rollback
    """
    decision = AgentDecision(
        decision_type=decision_data.decision_type,
        autonomy_level=decision_data.autonomy_level,
        confidence=decision_data.confidence,
        action_taken=1 if decision_data.action_taken else 0,
        reason=decision_data.reason,
        outcome=decision_data.outcome,
        outcome_details=decision_data.outcome_details
    )

    db.add(decision)
    db.commit()
    db.refresh(decision)

    return AgentDecisionResponse.model_validate(decision)
