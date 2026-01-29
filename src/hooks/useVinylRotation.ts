import { useState, useRef, useCallback, useEffect } from "react"

/** 3周 = 1080°（右回転で個別再生成の閾値） */
export const REGENERATE_THRESHOLD_DEG = 3 * 360
/** 1周 = 360°（この角度を超えると「個別再生成の域」に入り、3周未満で離したら戻り演出） */
export const REGENERATE_ZONE_ENTRY_DEG = 360
/** 戻り演出の基準時間（1周あたりの目安 ms）。回転量に比例して延長し角速度を一定にする */
const SNAPBACK_DURATION_PER_TURN_MS = 240

interface UseVinylRotationOptions {
  onRotationComplete: (direction: "next" | "prev") => void
  /** 次の/前のプレイリストに切り替える閾値（度） */
  rotationThreshold?: number
  /** 右に3周以上回したときに呼ぶ（現在表示中のジャンルを個別再生成） */
  onRegenerateCurrent?: () => void
  /** 左に3周以上回したときに呼ぶ（全件再生成） */
  onRegenerateAll?: () => void
}

/**
 * レコード盤の回転操作を管理するカスタムフック
 * - 45°以上で next/prev（操作と衝突しない）
 * - 右に3周以上で onRegenerateCurrent（個別再生成）
 * - 左に3周以上で onRegenerateAll（全件再生成）
 */
export function useVinylRotation({
  onRotationComplete,
  rotationThreshold = 45,
  onRegenerateCurrent,
  onRegenerateAll,
}: UseVinylRotationOptions) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startRotation, setStartRotation] = useState(0)
  const [totalRotation, setTotalRotation] = useState(0)
  /** 1ジェスチャー内の累積回転（度）。右プラス・左マイナス。3周フィードバック表示用 */
  const [cumulativeRotation, setCumulativeRotation] = useState(0)
  /** 戻り演出中の transition 時間（ms）。null のときは通常の transition を使用 */
  const [snapBackDurationMs, setSnapBackDurationMs] = useState<number | null>(null)
  const vinylRef = useRef<HTMLDivElement>(null)
  /** 1ジェスチャー内の累積回転（度）。3周検知用 */
  const cumulativeRotationRef = useRef(0)
  /** 前回の接触点の角度（度）。累積計算用 */
  const lastAngleRef = useRef(0)

  /** 2つの角度の最短差を -180〜180 の範囲で返す */
  const getAngleDifference = useCallback((angle1: number, angle2: number): number => {
    let diff = angle2 - angle1
    if (diff > 180) {
      diff -= 360
    } else if (diff < -180) {
      diff += 360
    }
    return diff
  }, [])

  /** 中心から (clientX, clientY) への角度を度で返す（-180〜180） */
  const getAngleFromCenter = useCallback((clientX: number, clientY: number): number => {
    if (!vinylRef.current) return 0
    const rect = vinylRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rad = Math.atan2(clientY - centerY, clientX - centerX)
    return (rad * 180) / Math.PI
  }, [])

  const calculateRotationFromDrag = useCallback(
    (clientX: number, clientY: number): number => {
      if (!vinylRef.current) return 0

      const rect = vinylRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const startAngleRad = Math.atan2(startY - centerY, startX - centerX)
      const currentAngleRad = Math.atan2(clientY - centerY, clientX - centerX)

      const startAngleDeg = (startAngleRad * 180) / Math.PI
      const currentAngleDeg = (currentAngleRad * 180) / Math.PI

      return getAngleDifference(startAngleDeg, currentAngleDeg)
    },
    [startX, startY, getAngleDifference]
  )

  const resetRotation = useCallback(() => {
    setRotation(0)
    setStartRotation(0)
    setTotalRotation(0)
    setCumulativeRotation(0)
    cumulativeRotationRef.current = 0
  }, [])

  /** 指定角度から 0° まで、CSS transition（linear）で回した角度分を逆方向に戻す。角速度一定で滑らかに一貫した制御。 */
  const runSnapBackAnimation = useCallback(
    (fromRotationDeg: number) => {
      const durationMs = Math.max(
        200,
        SNAPBACK_DURATION_PER_TURN_MS * (Math.abs(fromRotationDeg) / 360)
      )
      setSnapBackDurationMs(durationMs)
      setRotation(fromRotationDeg)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRotation(0)
        })
      })
    },
    []
  )

  /** 戻り演出の transitionend で状態をクリア */
  useEffect(() => {
    if (snapBackDurationMs === null || !vinylRef.current) return
    const el = vinylRef.current
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return
      setSnapBackDurationMs(null)
      resetRotation()
    }
    el.addEventListener("transitionend", onTransitionEnd)
    return () => el.removeEventListener("transitionend", onTransitionEnd)
  }, [snapBackDurationMs, resetRotation])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const cumulative = cumulativeRotationRef.current
    const rotationDiff = totalRotation

    if (onRegenerateCurrent && cumulative >= REGENERATE_THRESHOLD_DEG) {
      onRegenerateCurrent()
      resetRotation()
      return
    }
    if (onRegenerateAll && cumulative <= -REGENERATE_THRESHOLD_DEG) {
      onRegenerateAll()
      resetRotation()
      return
    }
    // 個別再生成の域（1周超）に入っているが3周未満で離した → 回した角度分を逆方向に戻す演出（左右どちらも）
    const absCumulative = Math.abs(cumulative)
    if (
      absCumulative > REGENERATE_ZONE_ENTRY_DEG &&
      absCumulative < REGENERATE_THRESHOLD_DEG
    ) {
      runSnapBackAnimation(rotation)
      return
    }
    if (rotationDiff >= rotationThreshold) {
      onRotationComplete("next")
      resetRotation()
    } else if (rotationDiff <= -rotationThreshold) {
      onRotationComplete("prev")
      resetRotation()
    } else {
      resetRotation()
    }
  }, [
    isDragging,
    rotation,
    totalRotation,
    rotationThreshold,
    onRotationComplete,
    onRegenerateCurrent,
    onRegenerateAll,
    resetRotation,
    runSnapBackAnimation,
  ])

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (snapBackDurationMs !== null) {
        setSnapBackDurationMs(null)
        resetRotation()
      }
      setIsDragging(true)
      setStartX(clientX)
      setStartY(clientY)
      setStartRotation(rotation)
      setTotalRotation(0)
      setCumulativeRotation(0)
      cumulativeRotationRef.current = 0
      lastAngleRef.current = getAngleFromCenter(clientX, clientY)
    },
    [rotation, snapBackDurationMs, getAngleFromCenter, resetRotation]
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return
      const angleDiff = calculateRotationFromDrag(clientX, clientY)
      const currentAngle = getAngleFromCenter(clientX, clientY)
      const delta = getAngleDifference(lastAngleRef.current, currentAngle)
      cumulativeRotationRef.current += delta
      lastAngleRef.current = currentAngle
      setCumulativeRotation(cumulativeRotationRef.current)
      // 表示は累積回転で更新（何周しても正しく追従し、戻り演出で「回した角度分」逆回転できる）
      setRotation(startRotation + cumulativeRotationRef.current)
      setTotalRotation(angleDiff)
    },
    [isDragging, startRotation, calculateRotationFromDrag, getAngleFromCenter, getAngleDifference]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY)
    },
    [handleStart]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    },
    [handleMove]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientX, e.touches[0].clientY)
    },
    [handleStart]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    },
    [handleMove]
  )

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleTouchEnd()
      }
    }
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY)
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp)
    window.addEventListener("mousemove", handleGlobalMouseMove)
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp)
      window.removeEventListener("mousemove", handleGlobalMouseMove)
    }
  }, [isDragging, handleMove, handleTouchEnd])

  return {
    rotation,
    isDragging,
    cumulativeRotation,
    snapBackDurationMs,
    vinylRef,
    handleMouseDown,
    handleMouseUp: handleTouchEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}

