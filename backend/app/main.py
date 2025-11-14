from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.subnets import router as subnets_router

app = FastAPI(title="Alpha-Bet Backend", version="0.1.0")

# CORS: allow frontend dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://161.97.128.68:3000",
        "https://alpha-bet-ashy.vercel.app",
        "https://alpha-bet.vercel.app",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(subnets_router, prefix="/subnets", tags=["subnets"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)