from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.init import (
    AuthenticationRouter,
    SectionsRouter,
    ResourcesRouter,
    BorrowsRouter,
    ExternalRouter,
    ReviewsRouter,
    AdminRouter,
    RequestsRouter,
)

app = FastAPI(title="AKS Gateway")

# CORS — Vite dev server runs on :5173
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(AuthenticationRouter)
app.include_router(SectionsRouter)
app.include_router(ResourcesRouter)
app.include_router(BorrowsRouter)
app.include_router(ExternalRouter)
app.include_router(ReviewsRouter)
app.include_router(AdminRouter)
app.include_router(RequestsRouter)


@app.get("/")
def home():
    return "AKS Gateway running"
