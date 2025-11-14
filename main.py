from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import routers

app = FastAPI(
    title="Email Analytics",
    description="API para leitura e classificação de email's integrado ao Gemini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.router)

app.mount("/", StaticFiles(directory="static", html=True), name="static")