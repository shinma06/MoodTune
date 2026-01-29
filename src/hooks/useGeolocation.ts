import { useCallback } from "react"
import { getGeolocationErrorMessage, GEOLOCATION_OPTIONS } from "@/lib/weather-utils"

interface UseGeolocationOptions {
  onSuccess: (position: GeolocationPosition) => void
  onError: (error: string) => void
}

/**
 * 位置情報取得を管理するカスタムフック
 */
export function useGeolocation({ onSuccess, onError }: UseGeolocationOptions) {
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError("位置情報サービスが利用できません")
      return
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        onError(getGeolocationErrorMessage(error))
      },
      GEOLOCATION_OPTIONS
    )
  }, [onSuccess, onError])

  return { requestGeolocation }
}

