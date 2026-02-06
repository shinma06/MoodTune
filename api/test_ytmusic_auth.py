"""
Test YouTube Music auth without search (create_playlist + add_playlist_items only).
Use this to isolate 401: if this fails, the cause is auth/headers, not filter="songs".
Run from api/: python test_ytmusic_auth.py
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from ytmusicapi import YTMusic, OAuthCredentials

# Load .env from project root (same as main.py)
_ROOT = Path(__file__).resolve().parent.parent
for name in (".env.local", ".env"):
    p = _ROOT / name
    if p.is_file():
        load_dotenv(dotenv_path=p)
        break

# Same resolution as main.py: browser.json / headers_auth.json / oauth.json
API_DIR = Path(__file__).resolve().parent
auth_path = None
use_oauth = False
for name in ("browser.json", "headers_auth.json"):
    path = API_DIR / name
    if path.is_file():
        auth_path = path
        break
if auth_path is None:
    op = API_DIR / "oauth.json"
    if op.is_file():
        auth_path = op
        use_oauth = True
    else:
        raise FileNotFoundError(
            "No api/browser.json, headers_auth.json or oauth.json. "
            "Run 'ytmusicapi browser' or 'ytmusicapi oauth' first."
        )


def main() -> None:
    if use_oauth:
        cid = os.environ.get("YT_OAUTH_CLIENT_ID")
        csec = os.environ.get("YT_OAUTH_CLIENT_SECRET")
        if not cid or not csec:
            raise ValueError(
                "OAuth: set YT_OAUTH_CLIENT_ID and YT_OAUTH_CLIENT_SECRET in .env.local"
            )
        yt = YTMusic(
            str(auth_path),
            oauth_credentials=OAuthCredentials(client_id=cid, client_secret=csec),
        )
    else:
        yt = YTMusic(str(auth_path))
    # Fixed video ID (single track); no search involved
    test_video_id = "u5hYi6yN4tU"
    try:
        playlist_id = yt.create_playlist("MoodTune Auth Test", "Test description")
        print(f"Playlist Created: {playlist_id}")
        yt.add_playlist_items(playlist_id, [test_video_id])
        print("Item Added Successfully")
    except Exception as e:
        print(f"Error: {e}")
        raise


if __name__ == "__main__":
    main()
