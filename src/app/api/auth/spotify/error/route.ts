import { NextRequest, NextResponse } from "next/server"
import { logServerWarn } from "@/lib/server-log"

const LOG_TAG = "Spotify Auth (error)"

/** Simple error page for Spotify OAuth errors (access_denied, invalid_callback, etc.). */
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error") ?? "unknown"
  logServerWarn(LOG_TAG, "oauth_error_page", `User shown error: ${error}`, {
    error,
    referer: request.headers.get("referer") ?? undefined,
  })
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spotify ログインエラー</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>ログインできませんでした</h1><p>エラー: ${escapeHtml(error)}</p><p><a href="/">トップに戻る</a></p></body></html>`
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
