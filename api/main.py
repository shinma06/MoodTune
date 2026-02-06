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
# Helpers: query generation
# ---------------------------------------------------------------------------
# Time-of-day → search-friendly English keywords (for fallback queries)
TIME_OF_DAY_KEYWORDS: dict[str, str] = {
    "dawn": "morning chill",
    "day": "daytime",
    "dusk": "evening sunset",
    "night": "night",
}


def _build_queries_with_openai(genre: str, weather: str, time_of_day: str) -> list[str]:
    """Use OpenAI to generate 2–3 YouTube Music search queries (English, mood-specific)."""
    from openai import OpenAI

    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a music search query generator for YouTube Music. "
                    "Given a genre, weather, and time of day, output 2 or 3 different English search queries "
                    "that would find songs matching this mood. Use mood words (e.g. chill, upbeat, rainy day, night drive). "
                    "For Japanese genres (e.g. J-POP, City Pop) include 'Japanese' or the genre name so results are relevant. "
                    "Keep each query SHORT (3-6 words). Avoid special characters. "
                    "Output one query per line, no numbering or extra text. Only the query strings."
                ),
            },
            {
                "role": "user",
                "content": f"Genre: {genre}\nWeather: {weather}\nTime of day: {time_of_day}",
            },
        ],
        max_tokens=120,
        temperature=0.7,
    )
    raw = (resp.choices[0].message.content or "").strip()
    queries = [q.strip().strip('"').strip("'") for q in raw.splitlines() if q.strip()]
    return queries[:3] if queries else [f"{genre} {weather} {time_of_day} music"]


def _build_queries_fallback(genre: str, weather: str, time_of_day: str) -> list[str]:
    """Fallback: 2–3 queries when OpenAI is unavailable."""
    time_kw = TIME_OF_DAY_KEYWORDS.get(time_of_day, time_of_day)
    return [
        f"{genre} {weather} {time_kw} music",
        f"{genre} {time_kw} playlist",
        f"{genre} {weather} songs",
    ]


def _build_search_queries(genre: str, weather: str, time_of_day: str) -> list[str]:
    """Generate 2–3 search queries; use OpenAI if available, else fallback."""
    if os.environ.get("OPENAI_API_KEY"):
        try:
            return _build_queries_with_openai(genre, weather, time_of_day)
        except Exception as e:
            logger.warning("OpenAI query generation failed, using fallback: %s", e)
    return _build_queries_fallback(genre, weather, time_of_day)


# ---------------------------------------------------------------------------
# Helpers: search & selection
# ---------------------------------------------------------------------------
def _search_ytmusic(yt, query: str, auth_type: str, limit: int = 10) -> list[dict]:
    """
    Search YouTube Music with retry logic.
    - Browser auth: use filter="songs"
    - OAuth: no filter (400 risk). If still fails, retry with ignore_spelling=True,
      then retry with a simplified query.
    """
    if auth_type == "browser":
        return yt.search(query, limit=limit, filter="songs")

    # OAuth: try without filter first
    try:
        return yt.search(query, limit=limit)
    except Exception as e1:
        logger.warning("OAuth search failed for %r: %s. Retrying with ignore_spelling.", query, e1)

    # Retry with ignore_spelling=True
    try:
        return yt.search(query, limit=limit, ignore_spelling=True)
    except Exception as e2:
        logger.warning("OAuth search retry failed for %r: %s. Trying simplified query.", query, e2)

    # Last resort: simplify query to first 3 words
    simple = " ".join(query.split()[:3])
    if simple != query:
        try:
            return yt.search(simple, limit=limit, ignore_spelling=True)
        except Exception as e3:
            logger.warning("OAuth simplified search also failed for %r: %s", simple, e3)

    return []


def _pick_artist_id(item: dict) -> str | None:
    """Extract a single artist identifier from a search result item for diversity."""
    artists = item.get("artists") or []
    if not artists:
        return None
    first = artists[0] if isinstance(artists[0], dict) else None
    if not first:
        return None
    return first.get("id") or first.get("name") or None


def _select_with_artist_diversity(
    items: list[dict], max_tracks: int = 15, max_per_artist: int = 3
) -> list[str]:
    """
    Select up to max_tracks videoIds with artist diversity: each artist at most max_per_artist,
    and prefer alternating artists (add from different artist when possible).
    """
    seen_vids: set[str] = set()
    artist_count: dict[str, int] = {}
    selected: list[str] = []
    last_artist: str | None = None

    # Pass 1: prefer adding a track whose artist != last_artist, cap max_per_artist per artist
    remaining: list[dict] = []
    for item in items:
        vid = item.get("videoId")
        if not vid or vid in seen_vids:
            continue
        aid = _pick_artist_id(item) or "unknown"
        if artist_count.get(aid, 0) >= max_per_artist:
            remaining.append(item)
            continue
        if last_artist is not None and aid == last_artist:
            remaining.append(item)
            continue
        seen_vids.add(vid)
        artist_count[aid] = artist_count.get(aid, 0) + 1
        last_artist = aid
        selected.append(vid)
        if len(selected) >= max_tracks:
            return selected

    # Pass 2: add from remaining (same-artist or extra) until full
    for item in remaining:
        if len(selected) >= max_tracks:
            break
        vid = item.get("videoId")
        if not vid or vid in seen_vids:
            continue
        aid = _pick_artist_id(item) or "unknown"
        if artist_count.get(aid, 0) >= max_per_artist:
            continue
        seen_vids.add(vid)
        artist_count[aid] = artist_count.get(aid, 0) + 1
        last_artist = aid
        selected.append(vid)

    return selected


# ---------------------------------------------------------------------------
# Helpers: YTMusic init
# ---------------------------------------------------------------------------
def _make_browser_client():
    """Try to create a browser-auth YTMusic client. Returns (client, "browser") or None."""
    from ytmusicapi import YTMusic

    for name in ("browser.json", "headers_auth.json"):
        path = _API_DIR / name
        if path.is_file():
            logger.info("Browser auth client: %s", path)
            return YTMusic(str(path)), "browser"
    return None


def _make_oauth_client():
    """Try to create an OAuth YTMusic client. Returns (client, "oauth") or None."""
    from ytmusicapi import YTMusic

    oauth_path = _API_DIR / "oauth.json"
    if not oauth_path.is_file():
        return None
    client_id = os.environ.get("YT_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("YT_OAUTH_CLIENT_SECRET")
    if not (client_id and client_secret):
        logger.warning("oauth.json found but YT_OAUTH_CLIENT_ID / YT_OAUTH_CLIENT_SECRET not set")
        return None
    from ytmusicapi import OAuthCredentials
    logger.info("OAuth auth client: %s", oauth_path)
    return YTMusic(
        str(oauth_path),
        oauth_credentials=OAuthCredentials(client_id=client_id, client_secret=client_secret),
    ), "oauth"


def _init_ytmusic():
    """
    Initialize YTMusic clients.
    Returns (search_client, search_auth_type, write_client).
    - search: browser auth preferred (supports filter="songs").
    - write (create/add): OAuth preferred (browser auth may 401 on write).
    If only one auth is available, it's used for both.
    """
    browser = _make_browser_client()
    oauth = _make_oauth_client()

    if browser and oauth:
        # Hybrid: browser for search, OAuth for write
        logger.info("Hybrid mode: browser for search, OAuth for write")
        return browser[0], browser[1], oauth[0]
    elif browser:
        return browser[0], browser[1], browser[0]
    elif oauth:
        return oauth[0], oauth[1], oauth[0]
    else:
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

    # 1. Build 2–3 search queries
    queries = _build_search_queries(req.genre, req.weather, req.time_of_day)
    primary_query = queries[0] if queries else f"{req.genre} {req.weather} {req.time_of_day} music"
    logger.info("Search queries: %s", queries)

    # 2. Init YTMusic (search client may differ from write client)
    yt_search, search_auth_type, yt_write = _init_ytmusic()

    # 3. Search with each query and merge (dedupe by videoId, keep order)
    limit_per_query = 10
    all_items: list[dict] = []
    seen_ids: set[str] = set()

    for q in queries:
        try:
            results = _search_ytmusic(yt_search, q, search_auth_type, limit=limit_per_query)
        except Exception as e:
            logger.warning("YTMusic search failed for query %r: %s", q, e)
            continue
        for item in results:
            vid = item.get("videoId")
            if vid and vid not in seen_ids:
                seen_ids.add(vid)
                all_items.append(item)

    # 4. Select up to 15 with artist diversity
    video_ids = _select_with_artist_diversity(all_items, max_tracks=15, max_per_artist=3)

    if not video_ids:
        raise HTTPException(status_code=404, detail="No songs found for the given queries.")

    # 5. Create playlist (use write client — OAuth if available)
    title = req.title or f"MoodTune: {req.weather} {req.genre}"
    description = f"Auto-generated for {req.time_of_day} vibe. Queries: {' | '.join(queries)}"

    try:
        playlist_id = yt_write.create_playlist(title, description)
    except Exception as e:
        logger.error("Failed to create playlist: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to create playlist: {e}")

    # 6. Add items (use write client)
    try:
        yt_write.add_playlist_items(playlist_id, video_ids)
    except Exception as e:
        logger.error("Failed to add items to playlist: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to add items to playlist: {e}")

    url = f"https://music.youtube.com/playlist?list={playlist_id}"
    logger.info("Created playlist: %s", url)

    return PlaylistResponse(url=url, playlist_id=playlist_id, query=primary_query)
