import { useState, useRef, useCallback, useEffect } from "react"

interface UseVinylRotationOptions {
  onRotationComplete: (direction: "next" | "prev") => void
  rotationThreshold?: number
}

/**
 * レコード盤の回転操作を管理するカスタムフック
 */
export function useVinylRotation({
  onRotationComplete,
  rotationThreshold = 45,
}: UseVinylRotationOptions) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startRotation, setStartRotation] = useState(0)
  const [totalRotation, setTotalRotation] = useState(0)
  const vinylRef = useRef<HTMLDivElement>(null)

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
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const rotationDiff = totalRotation

    if (rotationDiff >= rotationThreshold) {
      onRotationComplete("next")
      resetRotation()
    } else if (rotationDiff <= -rotationThreshold) {
      onRotationComplete("prev")
      resetRotation()
    } else {
      resetRotation()
    }
  }, [isDragging, totalRotation, rotationThreshold, onRotationComplete, resetRotation])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setStartY(clientY)
    setStartRotation(rotation)
    setTotalRotation(0)
  }, [rotation])

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return
      const angleDiff = calculateRotationFromDrag(clientX, clientY)
      const newRotation = startRotation + angleDiff
      setRotation(newRotation)
      setTotalRotation(angleDiff)
    },
    [isDragging, startRotation, calculateRotationFromDrag]
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
    vinylRef,
    handleMouseDown,
    handleMouseUp: handleTouchEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}

