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
