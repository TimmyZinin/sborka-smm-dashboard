"""
API эндпоинты для агента
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import (
    Post, PostStatus, Feedback, AgentDecision,
    LearningEvent, PromptVersion
)
from ..schemas import (
    LearningInsights, AgentStatus,
    FeedbackResponse, FeedbackList
)

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.get("/status", response_model=AgentStatus)
def get_agent_status(db: Session = Depends(get_db)):
    """
    Получить текущий статус агента.
    Читает из БД последние данные о состоянии.
    """
    # Получаем последнее решение агента
    last_decision = db.query(AgentDecision).order_by(
        AgentDecision.created_at.desc()
    ).first()

    # Получаем текущую версию промпта
    active_prompt = db.query(PromptVersion).filter(
        PromptVersion.is_active == 1
    ).first()

    # Считаем approval rate за 7 дней
    cutoff = datetime.utcnow() - timedelta(days=7)
    feedbacks_7d = db.query(Feedback).filter(
        Feedback.created_at >= cutoff
    ).all()

    total_7d = len(feedbacks_7d)
    if total_7d > 0:
        approved_7d = sum(
            1 for f in feedbacks_7d
            if f.feedback_type in ("approved", "edited")
        )
        approval_rate_7d = approved_7d / total_7d
    else:
        approval_rate_7d = 0.0

    # Считаем генерации с последнего reflexion
    last_reflexion = db.query(LearningEvent).filter(
        LearningEvent.event_type == "reflexion"
    ).order_by(LearningEvent.created_at.desc()).first()

    if last_reflexion:
        gens_since = db.query(AgentDecision).filter(
            AgentDecision.decision_type == "generate",
            AgentDecision.created_at > last_reflexion.created_at
        ).count()
    else:
        gens_since = db.query(AgentDecision).filter(
            AgentDecision.decision_type == "generate"
        ).count()

    # Определяем circuit breaker state по последним 10 решениям
    recent_decisions = db.query(AgentDecision).order_by(
        AgentDecision.created_at.desc()
    ).limit(10).all()

    failures = sum(1 for d in recent_decisions if d.outcome == "failure")
    cb_state = "open" if failures >= 3 else "closed"

    return AgentStatus(
        autonomy_level=last_decision.autonomy_level if last_decision else 2,
        autonomy_name=_level_name(last_decision.autonomy_level if last_decision else 2),
        circuit_breaker_state=cb_state,
        prompt_version=active_prompt.version if active_prompt else "v1.0.0",
        generations_since_reflexion=gens_since,
        approval_rate_7d=round(approval_rate_7d, 3),
        last_action=last_decision.decision_type if last_decision else None
    )


def _level_name(level: int) -> str:
    """Конвертация уровня автономии в название"""
    names = {1: "SHADOW", 2: "DRAFT", 3: "BOUNDED", 4: "AUTONOMOUS"}
    return names.get(level, "UNKNOWN")


@router.get("/learning/insights", response_model=LearningInsights)
def get_learning_insights(
    days: int = Query(default=7, le=90),
    db: Session = Depends(get_db)
):
    """
    Получить insights от анализа feedback.
    Используется для Reflexion.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    feedbacks = db.query(Feedback).filter(
        Feedback.created_at >= cutoff
    ).all()

    total = len(feedbacks)
    if total == 0:
        active_prompt = db.query(PromptVersion).filter(
            PromptVersion.is_active == 1
        ).first()
        return LearningInsights(
            approval_rate=0.0,
            total_feedback=0,
            common_rejection_reasons={},
            successful_patterns=[],
            improvement_suggestions=["Недостаточно данных для анализа"],
            prompt_version=active_prompt.version if active_prompt else "v1.0.0"
        )

    # Считаем approval rate
    approved = sum(
        1 for f in feedbacks
        if f.feedback_type in ("approved", "edited")
    )
    approval_rate = approved / total

    # Анализируем причины отклонений
    rejection_reasons = {}
    for f in feedbacks:
        if f.feedback_type == "rejected" and f.rejection_reason:
            reason = f.rejection_reason
            rejection_reasons[reason] = rejection_reasons.get(reason, 0) + 1

    # Формируем suggestions на основе rejection reasons
    suggestions = []
    if "tone" in rejection_reasons:
        suggestions.append("Пересмотреть тон контента — частые отклонения из-за тона")
    if "too_long" in rejection_reasons:
        suggestions.append("Сократить длину контента — часто отклоняется как слишком длинный")
    if "off_topic" in rejection_reasons:
        suggestions.append("Улучшить релевантность темы")
    if approval_rate < 0.5:
        suggestions.append("CRITICAL: Approval rate ниже 50% — требуется review промпта")

    # Получаем текущую версию промпта
    active_prompt = db.query(PromptVersion).filter(
        PromptVersion.is_active == 1
    ).first()

    return LearningInsights(
        approval_rate=round(approval_rate, 3),
        total_feedback=total,
        common_rejection_reasons=rejection_reasons,
        successful_patterns=[],  # TODO: анализ успешных паттернов
        improvement_suggestions=suggestions if suggestions else ["Продолжать в том же духе"],
        prompt_version=active_prompt.version if active_prompt else "v1.0.0"
    )


@router.post("/rollback")
def trigger_rollback(
    level: int = Query(..., ge=1, le=4, description="Уровень отката: 1=prompt, 2=rules, 3=autonomy, 4=full"),
    reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Инициировать откат агента.

    Уровни:
    1 - Откат промпта к предыдущей версии
    2 - Сброс learned rules
    3 - Понижение уровня автономии
    4 - Полный reset к baseline
    """
    # Записываем событие отката
    event = LearningEvent(
        event_type="rollback",
        input_data=f'{{"level": {level}, "reason": "{reason}"}}',
        insights=f"Инициирован откат уровня {level}",
        actions=f"rollback_level_{level}"
    )
    db.add(event)

    # Записываем решение
    decision = AgentDecision(
        decision_type="rollback",
        autonomy_level=2,  # При откате возвращаемся на уровень 2
        confidence=None,
        action_taken=1,
        reason=reason,
        outcome="pending"
    )
    db.add(decision)

    db.commit()

    return {
        "status": "rollback_initiated",
        "level": level,
        "reason": reason,
        "message": f"Rollback level {level} инициирован. Агент должен применить изменения."
    }


@router.get("/decisions/recent")
def get_recent_decisions(
    limit: int = Query(default=20, le=100),
    decision_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить последние решения агента"""
    query = db.query(AgentDecision)

    if decision_type:
        query = query.filter(AgentDecision.decision_type == decision_type)

    decisions = query.order_by(
        AgentDecision.created_at.desc()
    ).limit(limit).all()

    return {
        "decisions": [
            {
                "id": d.id,
                "type": d.decision_type,
                "autonomy_level": d.autonomy_level,
                "confidence": d.confidence,
                "action_taken": bool(d.action_taken),
                "outcome": d.outcome,
                "reason": d.reason,
                "created_at": d.created_at.isoformat()
            }
            for d in decisions
        ]
    }


@router.get("/prompt/versions")
def get_prompt_versions(db: Session = Depends(get_db)):
    """Получить историю версий промптов"""
    versions = db.query(PromptVersion).order_by(
        PromptVersion.created_at.desc()
    ).all()

    return {
        "versions": [
            {
                "id": v.id,
                "version": v.version,
                "is_active": bool(v.is_active),
                "author": v.author,
                "reason": v.reason,
                "approval_rate_before": v.approval_rate_before,
                "approval_rate_after": v.approval_rate_after,
                "created_at": v.created_at.isoformat()
            }
            for v in versions
        ]
    }


@router.post("/prompt/create")
def create_prompt_version(
    version: str = Query(..., description="Version string like v1.0.0"),
    reason: str = Query(default="Initial version"),
    author: str = Query(default="system"),
    activate: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """Создать новую версию промпта"""
    import hashlib

    # Проверяем что версия не существует
    existing = db.query(PromptVersion).filter(
        PromptVersion.version == version
    ).first()

    if existing:
        return {"status": "exists", "version": version}

    # Деактивируем другие если нужно активировать новую
    if activate:
        db.query(PromptVersion).update({"is_active": 0})

    # Создаём новую версию
    prompt = PromptVersion(
        version=version,
        content_hash=hashlib.sha256(version.encode()).hexdigest(),
        reason=reason,
        author=author,
        is_active=1 if activate else 0
    )

    db.add(prompt)
    db.commit()
    db.refresh(prompt)

    return {
        "status": "created",
        "version": version,
        "is_active": bool(prompt.is_active)
    }


@router.post("/prompt/activate/{version}")
def activate_prompt_version(version: str, db: Session = Depends(get_db)):
    """Активировать определённую версию промпта"""
    # Находим версию
    prompt = db.query(PromptVersion).filter(
        PromptVersion.version == version
    ).first()

    if not prompt:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")

    # Деактивируем все остальные
    db.query(PromptVersion).update({"is_active": 0})

    # Активируем нужную
    prompt.is_active = 1
    db.commit()

    return {
        "status": "activated",
        "version": version,
        "message": f"Промпт версии {version} активирован"
    }


@router.get("/health")
def get_agent_health(db: Session = Depends(get_db)):
    """
    Traffic Light статус агента.
    GREEN - всё хорошо
    YELLOW - требует внимания
    RED - критические проблемы
    """
    # Получаем метрики
    cutoff_7d = datetime.utcnow() - timedelta(days=7)
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)

    # Feedback за 7 дней
    feedbacks_7d = db.query(Feedback).filter(
        Feedback.created_at >= cutoff_7d
    ).all()

    total_7d = len(feedbacks_7d)
    if total_7d >= 5:
        approved_7d = sum(
            1 for f in feedbacks_7d
            if f.feedback_type in ("approved", "edited")
        )
        approval_rate = approved_7d / total_7d
    else:
        approval_rate = None  # Недостаточно данных

    # Circuit breaker проверка
    recent_decisions = db.query(AgentDecision).order_by(
        AgentDecision.created_at.desc()
    ).limit(10).all()

    failures = sum(1 for d in recent_decisions if d.outcome == "failure")
    failure_rate = failures / len(recent_decisions) if recent_decisions else 0

    # Определяем статус
    issues = []

    if approval_rate is not None and approval_rate < 0.5:
        issues.append(f"LOW_APPROVAL_RATE: {approval_rate:.1%}")
    if failure_rate >= 0.3:
        issues.append(f"HIGH_FAILURE_RATE: {failure_rate:.1%}")

    # Проверяем активный промпт
    active_prompt = db.query(PromptVersion).filter(
        PromptVersion.is_active == 1
    ).first()
    if not active_prompt:
        issues.append("NO_ACTIVE_PROMPT")

    # Определяем цвет
    if len(issues) == 0:
        status = "GREEN"
        message = "Agent operating normally"
    elif any("CRITICAL" in i or approval_rate is not None and approval_rate < 0.3 for i in issues):
        status = "RED"
        message = "Critical issues detected"
    else:
        status = "YELLOW"
        message = "Agent needs attention"

    return {
        "status": status,
        "message": message,
        "metrics": {
            "approval_rate_7d": round(approval_rate, 3) if approval_rate else None,
            "failure_rate_10": round(failure_rate, 3),
            "total_feedback_7d": total_7d,
            "active_prompt": active_prompt.version if active_prompt else None
        },
        "issues": issues
    }
