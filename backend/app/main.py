from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import auth_router
from .routers.bindaccount import router as bindaccount_router
from .config import get_settings

settings = get_settings()

# 自动创建数据库和表
init_db()

app = FastAPI(
    title="校园服务 API",
    description="校园服务应用后端 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router)
app.include_router(bindaccount_router)


@app.get("/", tags=["根"])
async def root():
    return {"message": "校园服务 API", "docs": "/docs"}


@app.get("/health", tags=["健康检查"])
async def health_check():
    return {"status": "healthy"}
