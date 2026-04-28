from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes import (
    auth,
    chapters,
    documents,
    health,
    paper_blueprints,
    paper_uploads,
    quizzes,
    review_queue,
    subjects,
    tutor,
)

app = FastAPI(title="CBSE AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/v1")
app.include_router(subjects.router, prefix="/v1")
app.include_router(chapters.router, prefix="/v1")
app.include_router(documents.router, prefix="/v1")
app.include_router(tutor.router, prefix="/v1")
app.include_router(quizzes.router, prefix="/v1")
app.include_router(paper_uploads.router, prefix="/v1")
app.include_router(paper_blueprints.router, prefix="/v1")
app.include_router(review_queue.router, prefix="/v1")
