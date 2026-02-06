# MoodTune Python API (YouTube Music)

## Setup

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 環境変数 (.env.local をプロジェクトルートに配置)

- `OPENAI_API_KEY` — 検索クエリ生成用（未設定時は簡易クエリでフォールバック）
- `YT_OAUTH_CLIENT_ID` — Google OAuth クライアント ID（YouTube Data API）
- `YT_OAUTH_CLIENT_SECRET` — Google OAuth クライアントシークレット

## YouTube Music 認証 (oauth.json)

1. ターミナルで実行:
   ```bash
   cd api
   source .venv/bin/activate
   ytmusicapi oauth
   ```
2. Client ID / Client Secret を入力（Google Cloud Console で「TV および Limited Input デバイス」の OAuth クライアントを作成した値）。
3. 表示された URL をブラウザで開き、Google ログイン → 許可。
4. ターミナルに戻り Enter を押す。`api/oauth.json` が生成される。

※ `oauth.json` は .gitignore 済みです。リポジトリにコミットしないでください。

## 起動

```bash
cd api
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

- ヘルスチェック: `GET http://localhost:8000/api/py/health`
- プレイリスト生成: `POST http://localhost:8000/api/py/generate_playlist`  
  Body: `{ "genre": "J-POP", "weather": "Rain", "time_of_day": "dusk" }`
