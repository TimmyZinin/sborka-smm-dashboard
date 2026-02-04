"""
API эндпоинты для постов
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Post, PostStatus
from ..schemas import PostCreate, PostUpdate, PostResponse, PostList

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
