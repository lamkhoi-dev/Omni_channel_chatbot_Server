import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, channels, contacts, conversations, messages, products, webhooks, admin
from app.websocket.manager import manager
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ChatDesk backend starting...")

    # Connect to Milvus
    try:
        from app.services.milvus_service import connect_milvus
        connect_milvus()
        logger.info("Milvus connected")
    except Exception as e:
        logger.warning(f"Failed to connect to Milvus: {e}")

    # Pre-load embedding model at startup
    try:
        from app.services.embedding_service import get_embedding
        await get_embedding("warmup")
        logger.info("Embedding model pre-loaded")
    except Exception as e:
        logger.warning(f"Failed to pre-load embedding model: {e}")

    yield

    # Disconnect Milvus
    try:
        from app.services.milvus_service import disconnect_milvus
        disconnect_milvus()
    except Exception:
        pass
    logger.info("ChatDesk backend shutting down...")


app = FastAPI(
    title="ChatDesk API",
    description="Omni-channel chatbot platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
allowed_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(channels.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(products.router)
app.include_router(webhooks.router)
app.include_router(admin.router)


# WebSocket endpoint
@app.websocket("/ws/{business_id}")
async def websocket_endpoint(websocket: WebSocket, business_id: str):
    await manager.connect(business_id, websocket)
    try:
        while True:
            # Keep connection alive, receive pings
            data = await websocket.receive_text()
            logger.debug(f"WS received from {business_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(business_id, websocket)


@app.get("/")
async def root():
    return {"message": "ChatDesk API is running", "docs": "/docs"}
