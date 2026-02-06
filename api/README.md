# MoodTune Python API (YouTube Music)

## Setup

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## YouTube Music 認証 (headers_auth.json)

1. ターミナルで実行:
   ```bash
   cd api
   ytmusicapi oauth
   ```
2. 指示に従い Enter を押し、ブラウザで Google ログイン → 許可。
3. 生成された `oauth.json`（または `browser.json`）の中身をコピーし、`api/headers_auth.json` として保存。

※ `headers_auth.json` は .gitignore 済みです。リポジトリにコミットしないでください。
