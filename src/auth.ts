import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

async function refreshSpotifyToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: number
} | null> {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.AUTH_SPOTIFY_ID}:${process.env.AUTH_SPOTIFY_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  } catch {
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      authorization: {
        params: {
          scope: [
            "playlist-modify-public",
            "playlist-modify-private",
            "user-read-email",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token ?? undefined
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined
        return token
      }

      // トークンが有効な場合はそのまま返す
      if (token.expiresAt && Date.now() < (token.expiresAt as number) - 60_000) {
        return token
      }

      // リフレッシュトークンがない場合はそのまま返す
      if (!token.refreshToken) return token

      // アクセストークンをリフレッシュ
      const refreshed = await refreshSpotifyToken(token.refreshToken as string)
      if (!refreshed) return { ...token, error: "RefreshTokenError" }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
        error: undefined,
      }
    },
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string
      }
      if (token.expiresAt) {
        session.expiresAt = token.expiresAt as number
      }
      if (token.error) {
        session.error = token.error as string
      }

      return session
    },
  },
})
