"""
MoodTune Python API (FastAPI) — YouTube Music playlist generation.
Run: uvicorn main:app --reload --port 8000 (from api/ directory).
"""
from pathlib import Path
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field, model_validator
from ytmusicapi import YTMusic, OAuthCredentials

# Load .env from project root (parent of api/)
_ROOT = Path(__file__).resolve().parent.parent
for name in (".env.local", ".env"):
    env_path = _ROOT / name
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path)
        break

# Request/response models aligned with frontend (WeatherType, TimeOfDay, genre)
WEATHER_TYPES = frozenset(
    {"Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Snow", "Mist", "Fog", "Haze"}
)
TIME_OF_DAY_VALUES = frozenset({"dawn", "day", "dusk", "night"})


class PlaylistRequest(BaseModel):
    genre: str = Field(..., min_length=1, description="Genre name (e.g. J-POP, City Pop)")
    weather: str = Field(..., description="WeatherType from frontend (e.g. Clear, Rain)")
    time_of_day: str = Field(..., description="TimeOfDay: dawn | day | dusk | night")

    @model_validator(mode="after")
    def check_weather_and_time(self):
        if self.weather not in WEATHER_TYPES:
            raise ValueError(f"weather must be one of {sorted(WEATHER_TYPES)}")
        if self.time_of_day not in TIME_OF_DAY_VALUES:
            raise ValueError(f"time_of_day must be one of {sorted(TIME_OF_DAY_VALUES)}")
        return self


def _get_ytmusic() -> YTMusic:
    oauth_path = Path(__file__).resolve().parent / "oauth.json"
    if not oauth_path.is_file():
        raise FileNotFoundError(
            "api/oauth.json not found. Run 'ytmusicapi oauth' in the api/ directory."
        )
    client_id = os.environ.get("YT_OAUTH_CLIENT_ID")
    client_secret = os.environ.get("YT_OAUTH_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise ValueError(
            "Set YT_OAUTH_CLIENT_ID and YT_OAUTH_CLIENT_SECRET in .env.local"
        )
    return YTMusic(
        str(oauth_path),
        oauth_credentials=OAuthCredentials(
            client_id=client_id,
            client_secret=client_secret,
        ),
    )


def _build_search_query(genre: str, weather: str, time_of_day: str) -> str:
    """Use OpenAI to generate a single YouTube Music search query."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        # Fallback: simple concatenation
        return f"{genre} {weather} {time_of_day} music"
    client = OpenAI(api_key=api_key)
    prompt = f"""Create a search query for YouTube Music. Output ONLY the query string, no quotes.
Genre: {genre}
Weather: {weather}
Time of day: {time_of_day}
Rules: Combine keywords effectively (e.g. "Chill Lo-Fi hip hop rain"). Use English."""
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
    )
    return (completion.choices[0].message.content or "").strip() or f"{genre} {weather} {time_of_day}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate env / oauth once (optional)
    yield
    # Shutdown: nothing to close


app = FastAPI(title="MoodTune API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/py/health")
def health():
    return {"status": "ok", "service": "moodtune-api"}


@app.post("/api/py/generate_playlist")
def generate_playlist(req: PlaylistRequest):
    try:
        search_query = _build_search_query(req.genre, req.weather, req.time_of_day)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        yt = _get_ytmusic()
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        # OAuth 時に filter="songs" だと YouTube が 400 を返すことがあるため filter なしで検索し、
        # 結果から videoId を持つ項目（曲・動画）のみを使用する
        search_results = yt.search(search_query, limit=15)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"YouTube Music search failed: {getattr(e, 'message', str(e))}",
        )

    video_ids = [
        t["videoId"] for t in search_results
        if isinstance(t, dict) and t.get("videoId")
    ]
    if not video_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No songs found for query: {search_query}",
        )

    title = f"MoodTune: {req.weather} {req.genre}"
    description = f"Auto-generated for {req.time_of_day} vibe. Query: {search_query}"

    try:
        playlist_id = yt.create_playlist(title=title, description=description)
        yt.add_playlist_items(playlist_id, video_ids)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"YouTube Music playlist create failed: {getattr(e, 'message', str(e))}",
        )

    return {
        "url": f"https://music.youtube.com/playlist?list={playlist_id}",
        "playlist_id": playlist_id,
        "query": search_query,
    }
