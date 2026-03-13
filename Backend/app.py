import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from assessment import router as assessment_router
from auth import router as auth_router
from dashboard import router as dashboard_router
from database import Base, engine
from intake import router as intake_router
from user import router as user_router


def parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "https://idp-lovat.vercel.app" )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("AUTO_CREATE_TABLES", "false").lower() == "true":
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Intelligent Development Planner API", version="1.0.0", lifespan=lifespan)




app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


api_prefix = "/api/v1"
app.include_router(auth_router, prefix=f"{api_prefix}/auth", tags=["Auth"])
app.include_router(user_router, prefix=f"{api_prefix}/user", tags=["User"])
app.include_router(intake_router, prefix=f"{api_prefix}/intake", tags=["Intake"])
app.include_router(assessment_router, prefix=f"{api_prefix}/assessment", tags=["Assessment"])
app.include_router(dashboard_router, prefix=f"{api_prefix}/dashboard", tags=["Dashboard"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))

    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)

