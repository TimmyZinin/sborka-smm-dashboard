"""
SQLAlchemy модели
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
import enum

from .database import Base


class PostStatus(str, enum.Enum):
    """Статусы публикации"""
    IDEA = "idea"           # Идея/тема
    DRAFT = "draft"         # Черновик (AI сгенерировал)
    REVIEW = "review"       # На ревью (STOP - ждём человека)
    SCHEDULED = "scheduled" # Запланирован
    PUBLISHED = "published" # Опубликован
    REJECTED = "rejected"   # Отклонён


class PostPlatform(str, enum.Enum):
    """Платформы для публикации"""
    TELEGRAM = "telegram"
    LINKEDIN = "linkedin"
    VK = "vk"
    TWITTER = "twitter"


class Post(Base):
    """Модель публикации"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    # Контент
    title = Column(String(255), nullable=False)  # Тема/заголовок
    content = Column(Text, nullable=True)        # Текст поста
    platform = Column(String(50), default="linkedin")
    author = Column(String(100), default="Кристина Жукова")

    # Статус (пайплайн)
    status = Column(String(20), default=PostStatus.IDEA.value)

    # Медиа
    image_url = Column(String(500), nullable=True)
    image_prompt = Column(Text, nullable=True)

    # AI генерация
    ai_prompt = Column(Text, nullable=True)
    ai_model = Column(String(50), nullable=True)

    # Планирование
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)

    # Метаданные
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Post {self.id}: {self.title[:30]}...>"
