from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
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
    MongoMetadataRouter,
)

app = FastAPI(title="AKS Gateway")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"code": 422, "message": "Validation Error", "details": exc.errors()},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": "Internal Gateway Error", "details": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# CORS — Allow all origins for Render deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
app.include_router(MongoMetadataRouter)


@app.get("/")
def home():
    return "AKS Gateway running"
