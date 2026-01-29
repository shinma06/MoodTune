"use client"

import { useState, useEffect, useCallback } from "react"

// カスタムイベント名（同一ページ内でのlocalStorage変更を通知）
const STORAGE_CHANGE_EVENT = "local-storage-change"

/** 同一ページ内の他コンポーネントに変更を通知（レンダリング中の setState を避けるため queueMicrotask で発火） */
function dispatchStorageChange(key: string) {
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }))
    })
  }
}

/**
 * localStorage を使った永続化フック（同一ページ内での変更も検知可能）
 * @param key ストレージのキー
 * @param initialValue 初期値
 * @returns [値, 値を更新する関数, 初期化完了フラグ]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

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

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>
      if (customEvent.detail.key === key) {
        try {
          const item = window.localStorage.getItem(key)
          if (item) {
            setStoredValue(JSON.parse(item))
          }
        } catch (error) {
          console.warn(`localStorage の読み込みに失敗しました (key: ${key}):`, error)
        }
      }
    }

    const handleNativeStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`localStorage の読み込みに失敗しました (key: ${key}):`, error)
        }
      }
    }

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
    window.addEventListener("storage", handleNativeStorageChange)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
      window.removeEventListener("storage", handleNativeStorageChange)
    }
  }, [key])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
            dispatchStorageChange(key)
          }
          return valueToStore
        })
      } catch (error) {
        console.warn(`localStorage への保存に失敗しました (key: ${key}):`, error)
      }
    },
    [key]
  )

  return [storedValue, setValue, isInitialized]
}
