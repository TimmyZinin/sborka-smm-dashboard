"""
SMM Dashboard Backend — FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import init_db
from .routers import posts

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle: создаём таблицы при старте"""
    init_db()
    yield


app = FastAPI(
    title="SMM Dashboard API",
    description="API для управления SMM агентом СБОРКА",
    version="1.0.0",
    lifespan=lifespan
)

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(posts.router)


@app.get("/")
def root():
    """Корневой эндпоинт"""
    return {
        "name": "SMM Dashboard API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    """Проверка здоровья API"""
    return {"status": "ok"}


@app.get("/api/metrics/health")
def get_health_metrics():
    """Метрики здоровья контент-плана (mock data)"""
    return {
        "plan_completion": 0.77,
        "buffer_days": 5,
        "empty_slots_week": 2,
        "posts_by_status": {
            "idea": 5,
            "draft": 3,
            "review": 2,
            "scheduled": 7,
            "published": 23
        },
        "posts_by_platform": {
            "telegram": 12,
            "linkedin": 8,
            "vk": 6,
            "twitter": 4
        }
    }
