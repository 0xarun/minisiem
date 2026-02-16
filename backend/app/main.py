from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine
from app.router.datasets import router as datasets_router
from app.router.logs import router as logs_router
from app.router.upload import router as upload_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(upload_router)
app.include_router(datasets_router)
app.include_router(logs_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
