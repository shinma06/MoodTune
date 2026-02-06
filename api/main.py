"""
MoodTune Python API (FastAPI) — YouTube Music playlist generation.
Run: uvicorn main:app --reload --port 8000 (from api/ directory).
"""

import logging
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
_ROOT = Path(__file__).resolve().parent.parent
for name in (".env.local", ".env"):
    env_path = _ROOT / name
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path)
        break

_API_DIR = Path(__file__).resolve().parent

logger = logging.getLogger("moodtune")
logging.basicConfig(level=logging.INFO)

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="MoodTune API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
VALID_WEATHER = ("Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Snow", "Mist", "Fog", "Haze")
VALID_TIME_OF_DAY = ("dawn", "day", "dusk", "night")


class PlaylistRequest(BaseModel):
    """POST /api/py/generate_playlist request body."""
    genre: str = Field(..., min_length=1)
    weather: Literal["Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Snow", "Mist", "Fog", "Haze"]
    time_of_day: Literal["dawn", "day", "dusk", "night"]
    title: str | None = Field(None)


class PlaylistResponse(BaseModel):
    url: str
    playlist_id: str
    query: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/api/py/health")
def health():
    return {"status": "ok", "service": "moodtune-api"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _build_query_with_openai(genre: str, weather: str, time_of_day: str) -> str:
    """Use OpenAI to generate a YouTube Music search query."""
    from openai import OpenAI

    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a music search query generator for YouTube Music. "
                    "Given a genre, weather condition, and time of day, produce a single concise English search query "
                    "that would find a great playlist or set of songs matching that mood. "
                    "Output ONLY the query string, nothing else."
                ),
            },
            {
                "role": "user",
                "content": f"Genre: {genre}\nWeather: {weather}\nTime of day: {time_of_day}",
            },
        ],
        max_tokens=60,
        temperature=0.8,
    )
    query = (resp.choices[0].message.content or "").strip().strip('"').strip("'")
    return query or f"{genre} {weather} {time_of_day} music"


def _build_query_fallback(genre: str, weather: str, time_of_day: str) -> str:
    """Simple fallback when OpenAI is unavailable."""
    return f"{genre} {weather} {time_of_day} music"


def _build_search_query(genre: str, weather: str, time_of_day: str) -> str:
    """Generate a search query — use OpenAI if available, otherwise fallback."""
    if os.environ.get("OPENAI_API_KEY"):
        try:
            return _build_query_with_openai(genre, weather, time_of_day)
        except Exception as e:
            logger.warning("OpenAI query generation failed, using fallback: %s", e)
    return _build_query_fallback(genre, weather, time_of_day)


def _init_ytmusic():
    """
    Initialize YTMusic client.
    Priority: browser.json → headers_auth.json → oauth.json
    Returns (ytmusic_instance, auth_type) where auth_type is "browser" or "oauth".
    """
    from ytmusicapi import YTMusic

    # 1. Browser auth (browser.json)
    browser_path = _API_DIR / "browser.json"
    if browser_path.is_file():
        logger.info("Using browser auth: %s", browser_path)
        return YTMusic(str(browser_path)), "browser"

    # 2. Browser auth (headers_auth.json)
    headers_path = _API_DIR / "headers_auth.json"
    if headers_path.is_file():
        logger.info("Using browser auth: %s", headers_path)
        return YTMusic(str(headers_path)), "browser"

    # 3. OAuth
    oauth_path = _API_DIR / "oauth.json"
    if oauth_path.is_file():
        client_id = os.environ.get("YT_OAUTH_CLIENT_ID")
        client_secret = os.environ.get("YT_OAUTH_CLIENT_SECRET")
        if client_id and client_secret:
            from ytmusicapi import OAuthCredentials
            logger.info("Using OAuth auth: %s", oauth_path)
            return YTMusic(
                str(oauth_path),
                oauth_credentials=OAuthCredentials(
                    client_id=client_id,
                    client_secret=client_secret,
                ),
            ), "oauth"
        else:
            logger.warning("oauth.json found but YT_OAUTH_CLIENT_ID / YT_OAUTH_CLIENT_SECRET not set")

    raise HTTPException(
        status_code=500,
        detail="No valid YTMusic auth file found. Place browser.json, headers_auth.json, or oauth.json in api/.",
    )


# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------
@app.post("/api/py/generate_playlist", response_model=PlaylistResponse)
def generate_playlist(req: PlaylistRequest):
    """Generate a YouTube Music playlist based on genre, weather, and time of day."""

    # 1. Search query
    query = _build_search_query(req.genre, req.weather, req.time_of_day)
    logger.info("Search query: %s", query)

    # 2. Init YTMusic
    yt, auth_type = _init_ytmusic()

    # 3. Search
    try:
        # OAuth may return 400 with filter="songs", so only use filter for browser auth
        if auth_type == "browser":
            results = yt.search(query, limit=15, filter="songs")
        else:
            results = yt.search(query, limit=15)
    except Exception as e:
        logger.error("YTMusic search failed: %s", e)
        raise HTTPException(status_code=502, detail=f"YouTube Music search failed: {e}")

    # 4. Collect video IDs
    video_ids = []
    for item in results:
        vid = item.get("videoId")
        if vid and vid not in video_ids:
            video_ids.append(vid)

    if not video_ids:
        raise HTTPException(status_code=404, detail="No songs found for the given query.")

    # 5. Create playlist
    title = req.title or f"MoodTune: {req.weather} {req.genre}"
    description = f"Auto-generated for {req.time_of_day} vibe. Query: {query}"

    try:
        playlist_id = yt.create_playlist(title, description)
    except Exception as e:
        logger.error("Failed to create playlist: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to create playlist: {e}")

    # 6. Add items
    try:
        yt.add_playlist_items(playlist_id, video_ids)
    except Exception as e:
        logger.error("Failed to add items to playlist: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to add items to playlist: {e}")

    url = f"https://music.youtube.com/playlist?list={playlist_id}"
    logger.info("Created playlist: %s", url)

    return PlaylistResponse(url=url, playlist_id=playlist_id, query=query)
