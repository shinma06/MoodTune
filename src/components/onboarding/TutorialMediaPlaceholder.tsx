import { ImageIcon } from "lucide-react"

interface Props {
  mediaPath?: string
  alt: string
}

export default function TutorialMediaPlaceholder({ mediaPath, alt }: Props) {
  if (mediaPath) {
    const isVideo = /\.(mp4|webm)$/i.test(mediaPath)
    if (isVideo) {
      return (
        <video
          src={mediaPath}
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-xl object-cover"
          aria-label={alt}
        />
      )
    }
    return (
      <img
        src={mediaPath}
        alt={alt}
        className="w-full rounded-xl object-cover"
      />
    )
  }

  return (
    <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center text-white/30 space-y-2">
        <ImageIcon className="w-12 h-12 mx-auto" />
        <p className="text-xs">メディア準備中</p>
      </div>
    </div>
  )
}
