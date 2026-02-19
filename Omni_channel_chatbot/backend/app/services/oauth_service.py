import httpx
import logging
from urllib.parse import urlencode
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

FB_GRAPH_API = "https://graph.facebook.com/v21.0"
FB_OAUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth"


def get_facebook_oauth_url(state: str) -> str:
    """Generate Facebook OAuth URL for user authorization."""
    params = {
        "client_id": settings.FB_APP_ID,
        "redirect_uri": settings.FB_OAUTH_REDIRECT_URI,
        "state": state,
        "scope": "pages_show_list,pages_messaging,pages_read_engagement,pages_manage_metadata,instagram_basic,instagram_manage_messages",
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
        logger.info(f"Token exchange success, token_type={data.get('token_type')}")
        return data["access_token"]


async def _debug_token_info(access_token: str):
    """Debug: log user info and granted permissions."""
    async with httpx.AsyncClient(timeout=30) as client:
        # Check who the token belongs to
        me_resp = await client.get(
            f"{FB_GRAPH_API}/me",
            params={"access_token": access_token, "fields": "id,name"}
        )
        logger.info(f"DEBUG /me => {me_resp.status_code}: {me_resp.text[:300]}")
        
        # Check granted permissions
        perm_resp = await client.get(
            f"{FB_GRAPH_API}/me/permissions",
            params={"access_token": access_token}
        )
        logger.info(f"DEBUG /me/permissions => {perm_resp.status_code}: {perm_resp.text[:500]}")
        
        # Debug token info
        debug_resp = await client.get(
            f"{FB_GRAPH_API}/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{settings.FB_APP_ID}|{settings.FB_APP_SECRET}",
            }
        )
        logger.info(f"DEBUG /debug_token => {debug_resp.status_code}: {debug_resp.text[:500]}")


async def get_user_pages(user_access_token: str) -> list[dict]:
    """Get list of pages that user manages."""
    # Debug: log token info before querying pages
    await _debug_token_info(user_access_token)
    
    url = f"{FB_GRAPH_API}/me/accounts"
    params = {
        "access_token": user_access_token,
        "fields": "id,name,access_token",
    }
    
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params)
        logger.info(f"GET /me/accounts status={response.status_code}")
        logger.info(f"GET /me/accounts body={response.text[:500]}")
        response.raise_for_status()
        data = response.json()
        pages = data.get("data", [])
        logger.info(f"Found {len(pages)} page(s)")
        return pages


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
