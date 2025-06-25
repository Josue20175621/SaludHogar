from fastapi import FastAPI
from models.auth import User
from routes import auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(auth.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
