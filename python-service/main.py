from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Underdogs Coach Finder AI Service")

# Allow requests from the Node.js frontend/backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import endpoints
from app.api import webhook

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

app.include_router(endpoints.router, prefix="/api/v1")
app.include_router(webhook.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
