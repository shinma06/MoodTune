# MoodTune Python API (YouTube Music) — 要件

## 目的

- ジャンル・天気・時間帯に応じて **YouTube Music でプレイリストを生成**する。
- フロント（Next.js）は `/api/py/*` 経由でこの API を呼ぶ（next.config の rewrites で localhost:8000 にプロキシ）。

## 技術スタック（要件）

- **FastAPI**（port 8000）
- **ytmusicapi**（検索・プレイリスト作成）
- **OpenAI**（任意: 検索クエリ生成。未設定時は簡易クエリでフォールバック可）
- 認証: **ブラウザ認証**（`browser.json` / `headers_auth.json`）または **OAuth**（`oauth.json` + 環境変数）

## 入出力（要件）

- **入力**: `genre`, `weather`, `time_of_day`（必須）、`title`（任意、プレイリスト名）
- **出力**: 作成した YouTube Music プレイリストの URL（および `playlist_id`, `query` 等、必要に応じて）

### 値の制約（フロントと一致させること）

- **weather**: 次のいずれか。`Clear`, `Clouds`, `Rain`, `Drizzle`, `Thunderstorm`, `Snow`, `Mist`, `Fog`, `Haze`
- **time_of_day**: 次のいずれか。`dawn`, `day`, `dusk`, `night`

### API 契約

- **POST** `/api/py/generate_playlist`
- **Request body**: `{ "genre": string, "weather": string, "time_of_day": string, "title"?: string }`（JSON、snake_case）
- **Response 200**: `{ "url": string, "playlist_id": string, "query": string }`  
  - `url`: `https://music.youtube.com/playlist?list={playlist_id}`
- **エラー時**: 4xx/5xx と `{ "detail": string }`

## 再実装の手引き（処理フロー）

この節だけ見てバックエンドとフロント接続を再構築できるようにする。

1. **リクエスト受付**  
   `PlaylistRequest` で `genre`, `weather`, `time_of_day`, `title` を受け取り、上記「値の制約」でバリデーション（任意）。

2. **検索クエリ生成**  
   - `OPENAI_API_KEY` がある場合: プロンプトで「Genre / Weather / Time of day を組み合わせた YouTube Music 用の検索クエリ（英語）」を 1 本生成。  
   - ない場合: フォールバック例 `f"{genre} {weather} {time_of_day} music"`。

3. **YTMusic 初期化**  
   - 参照順: `api/browser.json` → `api/headers_auth.json` → `api/oauth.json`。  
   - OAuth のときは `YTMusic(oauth_path, oauth_credentials=OAuthCredentials(client_id, client_secret))`。  
   - **注意**: OAuth で `yt.search(..., filter="songs")` を使うと 400 が出ることがある。ブラウザ認証を推奨。ブラウザ認証時は `filter="songs"` 可。

4. **検索とプレイリスト作成**  
   - `yt.search(query, limit=15)`（OAuth のときは `filter` を付けない）。  
   - 結果から `videoId` を持つ要素だけを集め、`yt.create_playlist(title, description)` → `yt.add_playlist_items(playlist_id, video_ids)`。  
   - プレイリスト名: `title` が渡されていればそれ、なければ例 `f"MoodTune: {weather} {genre}"`。  
   - 説明: 例 `f"Auto-generated for {time_of_day} vibe. Query: {query}"`。

5. **レスポンス**  
   - 成功時: `{ "url": "https://music.youtube.com/playlist?list={playlist_id}", "playlist_id": "...", "query": "..." }` を返す。

6. **フロント接続**  
   - `src/lib/ytmusic-api.ts`: `generateYtMusicPlaylist(genre, weather, timeOfDay, title?)` で `POST /api/py/generate_playlist` を呼び、`YtMusicPlaylistResponse` を返す（実装後はスタブを削除）。  
   - 呼び出し元: `PlaylistExplorer`。渡す値は「表示中ジャンル」`currentPlaylist.genre`、`normalizeWeatherType(weatherType)`、`effectiveTimeOfDay`（テスト用時間帯を考慮）、`currentPlaylist.title`。  
   - 成功時: `window.open(response.url, "_blank", "noopener,noreferrer")`。  
   - UI: ジャンルが "---" でないときだけ「YouTube Music で作成」ボタンを表示。ローディング・エラー表示用 state を用意する。

## 認証ファイル（リネームしないこと）

| ファイル名 | 用途 |
|------------|------|
| `oauth.json` | OAuth 認証。`ytmusicapi oauth` で生成。**リネーム不要**。 |
| `browser.json` | ブラウザ認証。`ytmusicapi browser` でヘッダー貼り付け。 |
| `headers_auth.json` | ブラウザ認証の別名（手動でヘッダーを保存する場合）。 |

参照順: `browser.json` → `headers_auth.json` → `oauth.json`。OAuth 利用時は `YT_OAUTH_CLIENT_ID` と `YT_OAUTH_CLIENT_SECRET` を .env.local に設定。

## 環境変数（.env.local をプロジェクトルートに配置）

- `OPENAI_API_KEY` — 検索クエリ生成用（任意）
- OAuth 利用時: `YT_OAUTH_CLIENT_ID`, `YT_OAUTH_CLIENT_SECRET`

## Setup

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 起動

- プロジェクトルートから: `npm run dev:api`
- api 直下から: `cd api && source .venv/bin/activate && uvicorn main:app --reload --port 8000`

ヘルス: `GET http://localhost:8000/api/py/health`  
プレイリスト生成: `POST http://localhost:8000/api/py/generate_playlist` — **現状は未実装（501）。上記要件に沿って実装すること。**
