import crypto from "node:crypto"

const SPOTIFY_AUTHORIZE = "https://accounts.spotify.com/authorize"
const SPOTIFY_TOKEN = "https://accounts.spotify.com/api/token"

/** プレイリスト取得・作成・更新に必要なスコープ（Spotify Web API） */
export const SPOTIFY_SCOPES = [
  "playlist-read-private", // ユーザーのプレイリスト一覧取得（既存 MoodTune 検索）
  "playlist-modify-public", // 公開プレイリストの作成・更新
  "playlist-modify-private", // 非公開プレイリストの作成・更新
  "user-read-email", // ユーザー情報
].join(" ")

/** PKCE: code verifier (43–128 chars, high-entropy). */
export function generateCodeVerifier(length = 64): string {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const values = crypto.randomBytes(length)
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("")
}

/** PKCE: code challenge = base64url(SHA256(code_verifier)). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = crypto.createHash("sha256").update(verifier).digest()
  return digest
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

/** Canonical redirect URI (must match Spotify Dashboard exactly). */
export function getRedirectUri(): string {
  const base =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000"
  const url = new URL(base)
  return `${url.origin}/api/auth/spotify/callback`
}

/** Build Spotify authorize URL (Step 2: Request User Authorization). */
export async function buildAuthorizeUrl(state: string): Promise<{
  url: string
  codeVerifier: string
}> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const clientId = process.env.AUTH_SPOTIFY_ID
  if (!clientId) throw new Error("AUTH_SPOTIFY_ID is not set")

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: SPOTIFY_SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
    show_dialog: "true", // 毎回同意画面を表示し、最新スコープでトークンを発行させる
  })
  const url = `${SPOTIFY_AUTHORIZE}?${params.toString()}`
  return { url, codeVerifier }
}

/**
 * Exchange authorization code for tokens (Step 3: Request access token).
 * PKCE flow: no client_secret, only client_id + code_verifier.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
}> {
  const clientId = process.env.AUTH_SPOTIFY_ID
  if (!clientId) throw new Error("AUTH_SPOTIFY_ID is not set")

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: codeVerifier,
  })

  const res = await fetch(SPOTIFY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Spotify token error: ${res.status} ${err}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
  }>
}
