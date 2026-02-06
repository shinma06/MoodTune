# MoodTune Python API (YouTube Music)

## エラーの解読と解決の流れ

| エラー | 意味 | 対処 |
|--------|------|------|
| **401 Unauthorized** | YouTube Music の認証が無効（ファイルが空・期限切れ・Cookie 不正）。YouTube が「ログインしてください」と拒否している。 | 認証ファイルの**再生成**（下記「解決手順」）。 |
| **502 Bad Gateway** | Next.js (3000) が Python (8000) に届かない。Python が起動していないか、認証エラーでクラッシュした可能性。 | 認証を直したうえで **Python サーバーを再起動**。 |

**根本原因は「認証ファイルが正しくできていない」ことがほとんどです。**

**認証ファイルの役割（リネームしないこと）**

| ファイル名 | 用途 | 生成方法 |
|------------|------|----------|
| `oauth.json` | OAuth 認証（トークン形式） | `ytmusicapi oauth` → そのまま使用（**リネーム不要**） |
| `browser.json` | ブラウザ認証（ヘッダー形式） | `ytmusicapi browser` |
| `headers_auth.json` | ブラウザ認証の別名（同上） | 手動でヘッダーを保存する場合 |

参照順: `browser.json` → `headers_auth.json` → `oauth.json`。OAuth を使うときは `oauth.json` のままにし、空の `headers_auth.json` が残っていれば削除する。

### 解決手順（3ステップ）

1. **認証の再生成**  
   - **OAuth**: `cd api` → `ytmusicapi oauth` → ブラウザで認証。`api/oauth.json` ができる。**リネームせずそのまま使う**。  
   - **ブラウザ認証**: `ytmusicapi browser` でヘッダーを貼り付け → `api/browser.json`。手動の場合は `browser.json` または `headers_auth.json` に正しいヘッダーを保存。

2. **Python サーバーの再起動**  
   `api` ディレクトリで `uvicorn main:app --reload --port 8000`（または `npm run dev:api`）。起動ログにエラーが出ないこと、`Application startup complete.` が出ることを確認する。

3. **動作確認**  
   Next.js (`npm run dev`) を起動した状態で、ブラウザからプレイリスト生成を再度試す。200 が返れば解消。

## Setup

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 環境変数 (.env.local をプロジェクトルートに配置)

- `OPENAI_API_KEY` — 検索クエリ生成用（未設定時は簡易クエリでフォールバック）
- ブラウザ認証を使う場合: 上記のみで可
- OAuth を使う場合: `YT_OAUTH_CLIENT_ID` と `YT_OAUTH_CLIENT_SECRET` も必要

## YouTube Music 認証（どちらか一方）

### 推奨: ブラウザ認証 (browser.json) — search で 400 が出ない

OAuth で「Request contains an invalid argument」が出る場合は、こちらを使うと解消します。

1. ブラウザで [music.youtube.com](https://music.youtube.com) にログインした状態にする。
2. 開発者ツール (F12) → Network タブ → フィルタで `browse` を入力。ページ操作で POST が表示されたら、そのリクエストの **Request headers** をコピー（Accept 〜 Cookie まで）。
3. ターミナルで:
   ```bash
   cd api
   source .venv/bin/activate
   ytmusicapi browser
   ```
   表示に従い、コピーしたヘッダーを貼り付けて Enter。`api/browser.json` が生成される。
4. 認証は `browser.json` を優先するため、両方ある場合はブラウザ認証が使われます。

※ `browser.json` は .gitignore 済み。有効期限は約 2 年（ログアウトするまで）。

### 代替: OAuth (oauth.json)

1. ターミナルで:
   ```bash
   cd api
   source .venv/bin/activate
   ytmusicapi oauth
   ```
2. Client ID / Client Secret を入力（Google Cloud Console で「TV および Limited Input デバイス」の OAuth クライアントを作成した値）。
3. 表示された URL をブラウザで開き、Google ログイン → 許可。
4. ターミナルに戻り Enter を押す。`api/oauth.json` が生成される。

※ **oauth.json はリネームしない**: コードは `oauth.json` を OAuth 用としてそのまま参照します。OAuth のみ使う場合は `headers_auth.json` を削除し、`oauth.json` だけにすると確実です。  
※ OAuth 利用時、search で 400 が出ることがあります。その場合はブラウザ認証（`browser.json`）に切り替えてください。`oauth.json` は .gitignore 済みです。

## 401 Unauthorized が出る場合

検索（Read）は通るがプレイリスト作成・追加（Write）で 401 になる場合、**認証の有効性やアカウント識別子の不整合**が原因のことが多いです。`filter="songs"` 自体が原因ではありません。以下を順に試してください。

### STEP 1: ヘッダーの完全再取得（Firefox 推奨）

Chrome より Firefox の方が Cookie 形式が安定しやすいです。

1. Firefox で [music.youtube.com](https://music.youtube.com) を開き、**プレイリストを作成したいアカウント**に切り替えていることを確認する。
2. 開発者ツール (F12) → ネットワークタブ → 適当な操作（ライブラリ表示など）で `browse` や `next` などのリクエストを表示。
3. そのリクエストを右クリック → **Copy → Copy Request Headers**（または「ヘッダーをコピー」）。
4. ターミナルで `ytmusicapi browser` を実行し、貼り付けて `api/browser.json`（または `headers_auth.json`）を**上書き生成**する。

### STEP 2: X-Goog-AuthUser の手動確認

`api/headers_auth.json`（または browser.json 内のヘッダー）を開き、次を確認してください。

- **x-goog-authuser**: メインアカウントなら `0`。ブランドアカウントを使っている場合は `1` や `2` に変更して試す。
- ブラウザでアカウントを切り替えた直後にヘッダーを取ると、Cookie のセッションと `X-Goog-AuthUser` が食い違うことがあります。その場合は STEP 1 をやり直し、**使いたいアカウントで**ヘッダーをコピーしてください。

### STEP 3: 認証の切り分け（検索を経由しないテスト）

検索を通さずに「プレイリスト作成＋曲 1 件追加」だけ実行し、ここで 401 なら認証の問題です。

```bash
cd api
source .venv/bin/activate
python test_ytmusic_auth.py
```

成功時は「Playlist Created」「Item Added Successfully」と表示されます。失敗時は STEP 1 / 2 を再確認してください。

## 起動

**プロジェクトルートから（推奨）:**

```bash
npm run dev:api
```

**api ディレクトリから直接:**

```bash
cd api
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

- ヘルスチェック: `GET http://localhost:8000/api/py/health`
- プレイリスト生成: `POST http://localhost:8000/api/py/generate_playlist`  
  Body: `{ "genre": "J-POP", "weather": "Rain", "time_of_day": "dusk" }`

**補足:** 認証は `api/browser.json` / `api/headers_auth.json`（ブラウザ認証）を優先し、なければ `api/oauth.json`（OAuth）+ 環境変数を使用します。ファイル名と用途は上記のとおりで、リネームしないでください。
