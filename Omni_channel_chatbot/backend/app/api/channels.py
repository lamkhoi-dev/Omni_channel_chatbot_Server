import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.channel import Channel
from app.schemas.channel import ChannelCreate, ChannelOut
from app.api.deps import get_current_business
from app.services.oauth_service import (
    get_facebook_oauth_url,
    exchange_code_for_token,
    get_user_pages,
    subscribe_page_webhook,
    get_instagram_accounts,
)

router = APIRouter(prefix="/api/channels", tags=["channels"])

# Store state temporarily (in production, use Redis or DB)
_oauth_states = {}


@router.get("", response_model=list[ChannelOut])
async def list_channels(
    current_user: User = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Channel).where(Channel.business_id == current_user.id).order_by(Channel.created_at.desc())
    )
    return result.scalars().all()


@router.get("/facebook/oauth")
async def facebook_oauth_start(current_user: User = Depends(get_current_business)):
    """Start Facebook OAuth flow."""
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = str(current_user.id)
    oauth_url = get_facebook_oauth_url(state)
    return RedirectResponse(oauth_url)


@router.get("/facebook/callback")
async def facebook_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Handle Facebook OAuth callback."""
    # Verify state
    business_id = _oauth_states.pop(state, None)
    if not business_id:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        # Exchange code for token
        user_access_token = await exchange_code_for_token(code)
        
        # Get user's pages
        pages = await get_user_pages(user_access_token)
        
        if not pages:
            from app.config import get_settings
            frontend_url = get_settings().FRONTEND_URL
            return RedirectResponse(f"{frontend_url}/channels?error=no_pages")
        
        # Save all pages
        for page in pages:
            # Check if already exists
            result = await db.execute(
                select(Channel).where(
                    Channel.business_id == uuid.UUID(business_id),
                    Channel.platform == "facebook",
                    Channel.platform_page_id == page["id"],
                )
            )
            existing = result.scalar_one_or_none()
            
            if not existing:
                channel = Channel(
                    business_id=uuid.UUID(business_id),
                    platform="facebook",
                    platform_page_id=page["id"],
                    page_name=page["name"],
                    access_token=page["access_token"],
                )
                db.add(channel)
                
                # Subscribe to webhook
                await subscribe_page_webhook(page["id"], page["access_token"])
                
                # Try to get Instagram accounts
                ig_accounts = await get_instagram_accounts(page["id"], page["access_token"])
                for ig in ig_accounts:
                    ig_result = await db.execute(
                        select(Channel).where(
                            Channel.business_id == uuid.UUID(business_id),
                            Channel.platform == "instagram",
                            Channel.platform_page_id == ig["id"],
                        )
                    )
                    ig_existing = ig_result.scalar_one_or_none()
                    if not ig_existing:
                        ig_channel = Channel(
                            business_id=uuid.UUID(business_id),
                            platform="instagram",
                            platform_page_id=ig["id"],
                            page_name=ig.get("username") or ig.get("name"),
                            access_token=page["access_token"],  # Use page token for IG
                        )
                        db.add(ig_channel)
        
        await db.commit()
        from app.config import get_settings
        frontend_url = get_settings().FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/channels?success=true")
        
    except Exception as e:
        await db.rollback()
        from app.config import get_settings
        frontend_url = get_settings().FRONTEND_URL
        return RedirectResponse(f"{frontend_url}/channels?error={str(e)}")


@router.post("/facebook", response_model=ChannelOut)
async def connect_facebook(
    data: ChannelCreate,
    current_user: User = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    # Check if page already connected
    result = await db.execute(
        select(Channel).where(
            Channel.business_id == current_user.id,
            Channel.platform == "facebook",
            Channel.platform_page_id == data.platform_page_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="This Facebook Page is already connected")

    channel = Channel(
        business_id=current_user.id,
        platform="facebook",
        platform_page_id=data.platform_page_id,
        page_name=data.page_name,
        access_token=data.access_token,
    )
    db.add(channel)
    await db.flush()
    await db.refresh(channel)
    return channel


@router.post("/instagram", response_model=ChannelOut)
async def connect_instagram(
    data: ChannelCreate,
    current_user: User = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Channel).where(
            Channel.business_id == current_user.id,
            Channel.platform == "instagram",
            Channel.platform_page_id == data.platform_page_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="This Instagram account is already connected")

    channel = Channel(
        business_id=current_user.id,
        platform="instagram",
        platform_page_id=data.platform_page_id,
        page_name=data.page_name,
        access_token=data.access_token,
    )
    db.add(channel)
    await db.flush()
    await db.refresh(channel)
    return channel


@router.delete("/{channel_id}")
async def disconnect_channel(
    channel_id: uuid.UUID,
    current_user: User = Depends(get_current_business),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Channel).where(Channel.id == channel_id, Channel.business_id == current_user.id)
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    await db.delete(channel)
    return {"detail": "Channel disconnected"}
