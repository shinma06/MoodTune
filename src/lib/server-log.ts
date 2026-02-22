/**
 * サーバーサイド用のエラー・詳細ログユーティリティ。
 * API ルート・Server Actions で一貫した形式のログを出力する。
 */

export type LogContext = Record<string, unknown>

function formatError(error: unknown): { name: string; message: string; stack?: string; cause?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause != null ? String(error.cause) : undefined,
    }
  }
  // Spotify API 等が throw する { statusCode, body } 形式のオブジェクトを読める形にする
  if (error != null && typeof error === "object") {
    const obj = error as Record<string, unknown>
    const statusCode = obj.statusCode ?? obj.status
    const body = obj.body ?? obj.error
    if (typeof statusCode === "number") {
      let bodyStr = ""
      if (body != null) {
        if (typeof body === "string") bodyStr = body
        else if (typeof (body as { message?: unknown }).message === "string")
          bodyStr = (body as { message: string }).message
        else bodyStr = JSON.stringify(body)
      }
      return {
        name: (obj.name as string) ?? "ApiError",
        message: `HTTP ${statusCode}${bodyStr ? `: ${bodyStr}` : ""}`,
        stack: typeof obj.stack === "string" ? obj.stack : undefined,
      }
    }
    // その他のオブジェクトは JSON で出して [object Object] を避ける
    try {
      return {
        name: (obj.name as string) ?? "Unknown",
        message: typeof obj.message === "string" ? obj.message : JSON.stringify(error),
      }
    } catch {
      return { name: "Unknown", message: String(error) }
    }
  }
  return {
    name: "Unknown",
    message: String(error),
  }
}

/**
 * エラー詳細をサーバーログに出力する。
 * @param tag ログの識別子（例: "Weather API", "Spotify Callback"）
 * @param phase どの処理段階で発生したか（例: "parse_params", "fetch_owm", "token_exchange"）
 * @param error キャッチしたエラー（Error または unknown）
 * @param context 追加のコンテキスト（status, url, userId など）
 */
export function logServerError(
  tag: string,
  phase: string,
  error: unknown,
  context?: LogContext
): void {
  const err = formatError(error)
  const payload = {
    tag,
    phase,
    at: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      ...(err.stack && { stack: err.stack }),
      ...(err.cause && { cause: err.cause }),
    },
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  }
  try {
    console.error(`[${tag}] ERROR phase=${phase}`, JSON.stringify(payload, null, 0))
  } catch {
    // シリアライズ失敗時も握り潰さず、発生箇所とエラー内容を必ず出力する
    console.error(`[${tag}] ERROR phase=${phase} (serialize failed)`, err.name, err.message, err.stack ?? "(no stack)")
  }
}

/**
 * エラーではないが記録しておきたい事象（フォールバック・拒否・リミット等）をログに出力する。
 */
export function logServerWarn(tag: string, phase: string, message: string, context?: LogContext): void {
  const payload = {
    tag,
    phase,
    at: new Date().toISOString(),
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  }
  try {
    console.warn(`[${tag}] WARN phase=${phase}`, JSON.stringify(payload, null, 0))
  } catch {
    console.warn(`[${tag}] WARN phase=${phase} (serialize failed)`, message, context)
  }
}
