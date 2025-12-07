from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import job,story
from core.config import Setting
from db.database import create_table

create_table()

app=FastAPI(
    title="Chose your own Adventur Game API",
    description="API to generate stories",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Setting.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(story.router,prefix=Setting.API_PREFIX)

app.include_router(job.router,prefix=Setting.API_PREFIX)

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app="main:app",host="0.0.0.0",port=8000,reload=True)
