"""
Pydantic схемы для API
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from .models import PostStatus, PostPlatform


# ═══════════════════════════════════════════════════
# POST SCHEMAS
# ═══════════════════════════════════════════════════

class PostBase(BaseModel):
    """Базовые поля поста"""
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    platform: str = "linkedin"
    author: str = "Кристина Жукова"


class PostCreate(PostBase):
    """Создание поста"""
    pass


class PostUpdate(BaseModel):
    """Обновление поста"""
    title: Optional[str] = None
    content: Optional[str] = None
    platform: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class PostResponse(PostBase):
    """Ответ с данными поста"""
    id: int
    status: str
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    ai_prompt: Optional[str] = None
    ai_model: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostList(BaseModel):
    """Список постов с пагинацией"""
    items: List[PostResponse]
    total: int
    limit: int
    offset: int


# ═══════════════════════════════════════════════════
# GENERATE SCHEMAS
# ═══════════════════════════════════════════════════

class GenerateTextRequest(BaseModel):
    """Запрос на генерацию текста"""
    topic: str = Field(..., min_length=1)
    platform: str = "linkedin"
    author: str = "Кристина Жукова"


class GenerateTextResponse(BaseModel):
    """Ответ с сгенерированным текстом"""
    text: str
    model: str
    prompt: str


class GenerateImageRequest(BaseModel):
    """Запрос на генерацию картинки"""
    topic: str = Field(..., min_length=1)


class GenerateImageResponse(BaseModel):
    """Ответ с URL картинки"""
    image_url: str
    prompt: str


# ═══════════════════════════════════════════════════
# METRICS SCHEMAS
# ═══════════════════════════════════════════════════

class HealthMetrics(BaseModel):
    """Метрики здоровья контент-плана"""
    plan_completion: float = Field(..., ge=0, le=1, description="Выполнение плана (0-1)")
    buffer_days: int = Field(..., ge=0, description="Буфер готового контента в днях")
    empty_slots_week: int = Field(..., ge=0, description="Пустых слотов на неделе")
    posts_by_status: dict = Field(default_factory=dict)
    posts_by_platform: dict = Field(default_factory=dict)


# ═══════════════════════════════════════════════════
# CALENDAR SCHEMAS
# ═══════════════════════════════════════════════════

class CalendarSlot(BaseModel):
    """Слот в календаре"""
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    platform: str
    post: Optional[PostResponse] = None


class CalendarWeek(BaseModel):
    """Календарь на неделю"""
    start_date: str
    end_date: str
    slots: List[CalendarSlot]


# ═══════════════════════════════════════════════════
# FEEDBACK & LEARNING SCHEMAS
# ═══════════════════════════════════════════════════

class FeedbackCreate(BaseModel):
    """Создание feedback на контент"""
    feedback_type: str = Field(..., description="approved, rejected, edited")
    confidence_before: Optional[str] = None
    original_content: Optional[str] = None
    edited_content: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejection_details: Optional[str] = None
    user_id: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Ответ с данными feedback"""
    id: int
    post_id: int
    feedback_type: str
    confidence_before: Optional[str] = None
    original_content: Optional[str] = None
    edited_content: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejection_details: Optional[str] = None
    user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackList(BaseModel):
    """Список feedback с пагинацией"""
    items: List[FeedbackResponse]
    total: int


class AgentDecisionCreate(BaseModel):
    """Создание записи о решении агента"""
    decision_type: str = Field(..., description="generate, publish, modify_prompt, rollback")
    autonomy_level: int = 2
    confidence: Optional[str] = None
    action_taken: bool = False
    reason: Optional[str] = None
    outcome: Optional[str] = None
    outcome_details: Optional[str] = None


class AgentDecisionResponse(BaseModel):
    """Ответ с данными решения агента"""
    id: int
    decision_type: str
    autonomy_level: int
    confidence: Optional[str] = None
    action_taken: int
    reason: Optional[str] = None
    outcome: Optional[str] = None
    outcome_details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LearningInsights(BaseModel):
    """Insights от Reflexion анализа"""
    approval_rate: float = Field(..., ge=0, le=1)
    total_feedback: int
    common_rejection_reasons: dict = Field(default_factory=dict)
    successful_patterns: List[str] = Field(default_factory=list)
    improvement_suggestions: List[str] = Field(default_factory=list)
    prompt_version: str


class AgentStatus(BaseModel):
    """Статус агента"""
    autonomy_level: int
    autonomy_name: str
    circuit_breaker_state: str
    prompt_version: str
    generations_since_reflexion: int
    approval_rate_7d: float
    last_action: Optional[str] = None
