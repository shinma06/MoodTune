"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useWeather } from "@/contexts/WeatherContext"

interface LoginModalProps {
  onContinueWithoutLogin?: () => void
}

export default function LoginModal({ onContinueWithoutLogin }: LoginModalProps) {
  const [isPending, setIsPending] = useState(false)
  const { isOverlayThemeDark } = useWeather()

  const handleLogin = () => {
    setIsPending(true)
    window.location.href = "/api/auth/spotify"
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-sm bg-black/50">
      <div className={`w-full max-w-sm mx-4 rounded-2xl border shadow-2xl p-8 ${isOverlayThemeDark ? "bg-slate-900/95 border-white/10" : "bg-background/95 border-border/50"}`}>
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </div>
            <h1 className={`text-2xl font-serif ${isOverlayThemeDark ? "text-white" : "text-foreground"}`}>MoodTune</h1>
            <p className={`text-sm ${isOverlayThemeDark ? "text-white/60" : "text-muted-foreground"}`}>天気と時間に合わせた音楽プレイリスト</p>
          </div>

          <div className="space-y-3">
            <p className={`text-sm ${isOverlayThemeDark ? "text-white/70" : "text-foreground/70"}`}>
              Spotifyアカウントでログインして、あなただけのプレイリストを楽しもう。
            </p>
            <Button
              onClick={handleLogin}
              disabled={isPending}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full py-5 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              )}
              {isPending ? "接続中..." : "Spotifyでログイン"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onContinueWithoutLogin}
              className={`w-full rounded-full py-5 ${
                isOverlayThemeDark
                  ? "bg-transparent border-white/25 text-white/90 hover:bg-white/10 hover:text-white"
                  : ""
              }`}
            >
              ログインせずに使う
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
