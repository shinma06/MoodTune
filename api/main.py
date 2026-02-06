"""
MoodTune Python API (FastAPI) — YouTube Music playlist generation.
Run: uvicorn main:app --reload --port 8000 (from api/ directory).

要件:
- 入力: genre, weather, time_of_day（および任意の title）
- 認証: ブラウザ認証 (browser.json / headers_auth.json) または OAuth (oauth.json + 環境変数)
- 出力: YouTube Music プレイリストの URL
実装は未実装（スタブ）。上記要件に沿って実装すること。
"""
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env from project root (parent of api/)
_ROOT = Path(__file__).resolve().parent.parent
for name in (".env.local", ".env"):
    env_path = _ROOT / name
    if env_path.is_file():
        load_dotenv(dotenv_path=env_path)
        break

app = FastAPI(title="MoodTune API")
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


class PlaylistRequest(BaseModel):
    """POST /api/py/generate_playlist のリクエスト（要件）。"""
    genre: str = Field(..., min_length=1)
    weather: str = Field(...)
    time_of_day: str = Field(...)
    title: str | None = Field(None)


@app.post("/api/py/generate_playlist")
def generate_playlist(_req: PlaylistRequest):
    """YouTube Music プレイリスト生成 — 未実装（要件に沿って実装すること）。"""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=501,
        content={"detail": "YouTube Music playlist generation is not implemented yet."},
    )
