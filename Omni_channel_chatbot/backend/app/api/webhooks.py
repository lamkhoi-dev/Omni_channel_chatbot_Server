import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Query
from sqlalchemy import select
from app.config import get_settings
from app.database import async_session
from app.models.channel import Channel
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.ai_service import generate_ai_response
from app.websocket.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
settings = get_settings()


# ==================== Facebook Webhook ====================

@router.get("/facebook")
async def facebook_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Facebook webhook verification (GET)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.FB_VERIFY_TOKEN:
        # Return challenge as-is (Facebook sends a number, but test may send string)
        try:
            return int(hub_challenge)
        except (ValueError, TypeError):
            return hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/facebook")
async def facebook_webhook(request: Request):
    """Receive messages from Facebook Messenger."""
    body = await request.json()
    logger.info(f"Facebook webhook received: {body}")

    if body.get("object") != "page":
        return {"status": "ignored"}

    for entry in body.get("entry", []):
        page_id = entry.get("id")
        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event.get("sender", {}).get("id")
            message_data = messaging_event.get("message", {})
            message_text = message_data.get("text")

            if not message_text or sender_id == page_id:
                continue

            await _process_incoming_message(
                platform="facebook",
                page_id=page_id,
                sender_id=sender_id,
                message_text=message_text,
                platform_message_id=message_data.get("mid"),
            )

    return {"status": "ok"}


# ==================== Instagram Webhook ====================

@router.get("/instagram")
async def instagram_verify(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Instagram webhook verification (GET)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.FB_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/instagram")
async def instagram_webhook(request: Request):
    """Receive messages from Instagram."""
    body = await request.json()
    logger.info(f"Instagram webhook received: {body}")

    if body.get("object") != "instagram":
        return {"status": "ignored"}

    for entry in body.get("entry", []):
        ig_id = entry.get("id")
        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event.get("sender", {}).get("id")
            message_data = messaging_event.get("message", {})
            message_text = message_data.get("text")

            if not message_text or sender_id == ig_id:
                continue

            await _process_incoming_message(
                platform="instagram",
                page_id=ig_id,
                sender_id=sender_id,
                message_text=message_text,
                platform_message_id=message_data.get("mid"),
            )

    return {"status": "ok"}


# ==================== Shared Logic ====================

async def _process_incoming_message(
    platform: str,
    page_id: str,
    sender_id: str,
    message_text: str,
    platform_message_id: str | None,
):
    """Process incoming message from FB or IG: save to DB, trigger AI, notify via WS."""
    async with async_session() as db:
        try:
            # 1. Find channel
            channel_result = await db.execute(
                select(Channel).where(
                    Channel.platform == platform,
                    Channel.platform_page_id == page_id,
                    Channel.is_active == True,
                )
            )
            channel = channel_result.scalar_one_or_none()
            if not channel:
                logger.warning(f"No active channel for {platform} page {page_id}")
                return

            # 2. Find or create contact
            contact_result = await db.execute(
                select(Contact).where(
                    Contact.business_id == channel.business_id,
                    Contact.platform == platform,
                    Contact.platform_user_id == sender_id,
                )
            )
            contact = contact_result.scalar_one_or_none()
            if not contact:
                contact = Contact(
                    business_id=channel.business_id,
                    platform=platform,
                    platform_user_id=sender_id,
                    display_name=f"User {sender_id[-6:]}",
                )
                db.add(contact)
                await db.flush()
                await db.refresh(contact)

            # 3. Find or create conversation
            conv_result = await db.execute(
                select(Conversation).where(
                    Conversation.channel_id == channel.id,
                    Conversation.contact_id == contact.id,
                )
            )
            conversation = conv_result.scalar_one_or_none()
            if not conversation:
                conversation = Conversation(
                    business_id=channel.business_id,
                    channel_id=channel.id,
                    contact_id=contact.id,
                    platform=platform,
                    is_ai_enabled=True,
                )
                db.add(conversation)
                await db.flush()
                await db.refresh(conversation)

            # 4. Save incoming message
            message = Message(
                conversation_id=conversation.id,
                sender_type="contact",
                content=message_text,
                platform_message_id=platform_message_id,
            )
            db.add(message)
            conversation.last_message_at = datetime.now(timezone.utc)
            await db.flush()
            await db.refresh(message)

            # 5. Notify frontend via WebSocket
            await manager.send_message(
                str(channel.business_id),
                {
                    "type": "new_message",
                    "conversation_id": str(conversation.id),
                    "message": {
                        "id": str(message.id),
                        "sender_type": message.sender_type,
                        "content": message.content,
                        "created_at": message.created_at.isoformat(),
                    },
                    "contact": {
                        "id": str(contact.id),
                        "display_name": contact.display_name,
                        "platform": contact.platform,
                    },
                },
            )

            # 6. If AI enabled, generate and send AI response
            if conversation.is_ai_enabled:
                ai_response_text = await generate_ai_response(
                    db=db,
                    conversation=conversation,
                    user_message=message_text,
                )

                if ai_response_text:
                    # Send AI reply back via platform
                    from app.services.facebook_service import send_facebook_message
                    from app.services.instagram_service import send_instagram_message

                    ai_platform_msg_id = None
                    try:
                        if platform == "facebook":
                            ai_platform_msg_id = await send_facebook_message(
                                page_access_token=channel.access_token,
                                recipient_id=sender_id,
                                message_text=ai_response_text,
                            )
                        elif platform == "instagram":
                            ai_platform_msg_id = await send_instagram_message(
                                page_access_token=channel.access_token,
                                recipient_id=sender_id,
                                message_text=ai_response_text,
                            )
                    except Exception as e:
                        logger.error(f"Failed to send AI response via {platform}: {e}")

                    # Save AI message
                    ai_message = Message(
                        conversation_id=conversation.id,
                        sender_type="ai",
                        content=ai_response_text,
                        platform_message_id=ai_platform_msg_id,
                    )
                    db.add(ai_message)
                    conversation.last_message_at = datetime.now(timezone.utc)
                    await db.flush()
                    await db.refresh(ai_message)

                    # Notify frontend
                    await manager.send_message(
                        str(channel.business_id),
                        {
                            "type": "new_message",
                            "conversation_id": str(conversation.id),
                            "message": {
                                "id": str(ai_message.id),
                                "sender_type": "ai",
                                "content": ai_message.content,
                                "created_at": ai_message.created_at.isoformat(),
                            },
                        },
                    )

            await db.commit()

        except Exception as e:
            await db.rollback()
            logger.error(f"Error processing incoming message: {e}", exc_info=True)
