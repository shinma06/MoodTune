This is a [Next.js](https://next.js.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

**MoodTune** — 天気と時間帯に合わせた音楽プレイリストを表示します。**Favorite Music**（ジャンル選択）と **Mood Tuning**（天気・時間帯の手動設定）でプレイリストを更新できます。Spotify 連携はオプション（未設定時はモックで動作）。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Next.js と Python API を同時に起動する

YouTube Music 連携を使う場合は、Next と FastAPI の両方を立ち上げます。

```bash
npm run dev:all
```

**停止:** ターミナルで **Ctrl+C を1回**押すと、Next と API の両方が終了します。

- **Next.js のみ:** `npm run dev` または `npm run dev:next`
- **Python API のみ (port 8000):** `npm run dev:api`  
  （要: `api/.venv` と `api/oauth.json`。手順は [api/README.md](api/README.md) を参照）

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

| Variable                                  | Required    | Description                                                                                      |
| ----------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`                          | **Yes**     | OpenAI API key for playlist title/query generation.                                              |
| `AUTH_SECRET`                             | For auth    | Random string for NextAuth (e.g. `openssl rand -base64 32`). Needed if you enable Spotify login. |
| `NEXT_PUBLIC_USE_MOCK_SPOTIFY`            | No          | Omit or `true`: mock mode (no Spotify, no login). Set `false` to enable Spotify login.           |
| `NEXT_PUBLIC_WEATHER_API_KEY`             | For weather | OpenWeatherMap API key if you use live weather.                                                  |
| `AUTH_SPOTIFY_ID` / `AUTH_SPOTIFY_SECRET` | For Spotify | Only when `NEXT_PUBLIC_USE_MOCK_SPOTIFY=false`.                                                  |

**Minimum for deploy (no Spotify):** set `OPENAI_API_KEY`. The app runs in mock mode and does not require login.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
