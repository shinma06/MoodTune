"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * localStorage を使った永続化フック
 * @param key ストレージのキー
 * @param initialValue 初期値
 * @returns [値, 値を更新する関数]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // SSR対策: 初期レンダリング時はinitialValueを使用
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  // クライアントサイドでのみlocalStorageから値を読み込む
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`localStorage の読み込みに失敗しました (key: ${key}):`, error)
    }
    setIsInitialized(true)
  }, [key])

  // 値を更新してlocalStorageに保存
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          }
          return valueToStore
        })
      } catch (error) {
        console.warn(`localStorage への保存に失敗しました (key: ${key}):`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
