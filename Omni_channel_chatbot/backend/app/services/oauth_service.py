import httpx
import logging
from urllib.parse import urlencode
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

FB_GRAPH_API = "https://graph.facebook.com/v19.0"
FB_OAUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth"


def get_facebook_oauth_url(state: str) -> str:
    """Generate Facebook OAuth URL for user authorization."""
    params = {
        "client_id": settings.FB_APP_ID,
        "redirect_uri": settings.FB_OAUTH_REDIRECT_URI,
        "state": state,
        "scope": "pages_messaging,pages_read_engagement,pages_manage_metadata,instagram_basic,instagram_manage_messages",
    }
    return f"{FB_OAUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> str:
    """Exchange authorization code for access token."""
    url = f"{FB_GRAPH_API}/oauth/access_token"
    params = {
        "client_id": settings.FB_APP_ID,
        "client_secret": settings.FB_APP_SECRET,
        "redirect_uri": settings.FB_OAUTH_REDIRECT_URI,
        "code": code,
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data["access_token"]


async def get_user_pages(user_access_token: str) -> list[dict]:
    """Get list of pages that user manages."""
    url = f"{FB_GRAPH_API}/me/accounts"
    params = {
        "access_token": user_access_token,
        "fields": "id,name,access_token",
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("data", [])


async def subscribe_page_webhook(page_id: str, page_access_token: str) -> bool:
    """Subscribe page to webhooks."""
    url = f"{FB_GRAPH_API}/{page_id}/subscribed_apps"
    params = {
        "access_token": page_access_token,
        "subscribed_fields": "messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads",
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, params=params)
            response.raise_for_status()
            return True
    except Exception as e:
        logger.warning(f"Failed to subscribe webhook for page {page_id}: {e}")
        return False


async def get_instagram_accounts(page_id: str, page_access_token: str) -> list[dict]:
    """Get Instagram business accounts connected to a Facebook Page."""
    url = f"{FB_GRAPH_API}/{page_id}"
    params = {
        "access_token": page_access_token,
        "fields": "instagram_business_account",
    }
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            ig_account = data.get("instagram_business_account")
            if ig_account:
                # Get IG account details
                ig_url = f"{FB_GRAPH_API}/{ig_account['id']}"
                ig_params = {
                    "access_token": page_access_token,
                    "fields": "id,username,name",
                }
                ig_response = await client.get(ig_url, params=ig_params)
                ig_response.raise_for_status()
                return [ig_response.json()]
            return []
    except Exception as e:
        logger.warning(f"Failed to get Instagram accounts for page {page_id}: {e}")
        return []
