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


# ═══════════════════════════════════════════════════
# FEEDBACK & LEARNING MODELS
# ═══════════════════════════════════════════════════

class Feedback(Base):
    """Feedback на сгенерированный контент (для обучения)"""
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, nullable=False, index=True)

    # Тип feedback
    feedback_type = Column(String(20), nullable=False)  # approved, rejected, edited

    # Уверенность агента до feedback
    confidence_before = Column(String(10), nullable=True)

    # Детали редактирования (если edited)
    original_content = Column(Text, nullable=True)
    edited_content = Column(Text, nullable=True)

    # Причина отклонения (если rejected)
    rejection_reason = Column(String(100), nullable=True)
    rejection_details = Column(Text, nullable=True)

    # Метаданные
    user_id = Column(String(100), nullable=True)  # Telegram user ID
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Feedback {self.id}: {self.feedback_type} for post {self.post_id}>"


class PromptVersion(Base):
    """История версий промптов"""
    __tablename__ = "prompt_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(20), unique=True, nullable=False)  # v1.0.0
    content_hash = Column(String(64), nullable=False)  # SHA256 of content

    # Почему изменён
    reason = Column(Text, nullable=True)
    author = Column(String(50), default="agent")  # agent / human

    # Метрики на момент изменения
    approval_rate_before = Column(String(10), nullable=True)
    approval_rate_after = Column(String(10), nullable=True)  # Заполняется позже

    # Статус
    is_active = Column(Integer, default=0)  # 0 = inactive, 1 = active

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PromptVersion {self.version}: {'active' if self.is_active else 'inactive'}>"


class AgentDecision(Base):
    """Решения агента (для аудита и мониторинга)"""
    __tablename__ = "agent_decisions"

    id = Column(Integer, primary_key=True, index=True)

    # Тип решения
    decision_type = Column(String(50), nullable=False)  # generate, publish, modify_prompt, rollback

    # Контекст решения
    autonomy_level = Column(Integer, default=2)
    confidence = Column(String(10), nullable=True)

    # Было ли выполнено
    action_taken = Column(Integer, default=0)  # 0 = no, 1 = yes
    reason = Column(Text, nullable=True)

    # Результат
    outcome = Column(String(20), nullable=True)  # success, failure, pending
    outcome_details = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AgentDecision {self.id}: {self.decision_type}>"


class LearningEvent(Base):
    """События обучения (Reflexion cycles)"""
    __tablename__ = "learning_events"

    id = Column(Integer, primary_key=True, index=True)

    # Тип события
    event_type = Column(String(50), nullable=False)  # reflexion, rule_update, pattern_detected

    # Данные
    input_data = Column(Text, nullable=True)  # JSON: что анализировалось
    insights = Column(Text, nullable=True)  # Что выявлено
    actions = Column(Text, nullable=True)  # Какие действия предприняты

    # Связь с промптами
    prompt_version_before = Column(String(20), nullable=True)
    prompt_version_after = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LearningEvent {self.id}: {self.event_type}>"
