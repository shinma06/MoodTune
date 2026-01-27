import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

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
      // アカウントリンク時（初回ログイン時）にトークンを保存
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token ?? undefined
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000 // ミリ秒に変換
          : undefined
      }

      return token
    },
    async session({ session, token }) {
      // セッション取得時にJWTからトークンを取り出してセッションに含める
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string
      }
      if (token.expiresAt) {
        session.expiresAt = token.expiresAt as number
      }

      return session
    },
  },
})
