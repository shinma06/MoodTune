"use client"

import { useState, useEffect, useCallback, useRef } from "react"

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

export interface UseLocalStorageOptions<T> {
  /** 値のバリデーション。false を返すと initialValue にフォールバック */
  validate?: (value: unknown) => value is T
}

/**
 * localStorage を使った永続化フック（同一ページ内での変更も検知可能）
 * @param key ストレージのキー
 * @param initialValue 初期値
 * @param options バリデーション等のオプション
 * @returns [値, 値を更新する関数, 初期化完了フラグ]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)
  /** initialValue を参照用に保持（削除時のフォールバック用） */
  const initialValueRef = useRef(initialValue)
  initialValueRef.current = initialValue
  const validateRef = useRef(options?.validate)
  validateRef.current = options?.validate

  /** localStorage から読み込み、バリデーションを通す */
  const parseAndValidate = useCallback((raw: string | null): T | null => {
    if (raw === null) return null
    try {
      const parsed = JSON.parse(raw)
      if (validateRef.current) {
        return validateRef.current(parsed) ? parsed : null
      }
      return parsed as T
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const raw = window.localStorage.getItem(key)
    const parsed = parseAndValidate(raw)
    if (parsed !== null) {
      setStoredValue(parsed)
    }
    setIsInitialized(true)
  }, [key, parseAndValidate])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>
      if (customEvent.detail.key === key) {
        const raw = window.localStorage.getItem(key)
        const parsed = parseAndValidate(raw)
        if (parsed !== null) {
          setStoredValue(parsed)
        } else if (raw !== null) {
          // 同一ページ内での書き込み: バリデーションに失敗する値（例: []）もそのまま反映（修復しない）
          try {
            setStoredValue(JSON.parse(raw) as T)
          } catch {
            setStoredValue(initialValueRef.current)
          }
        } else {
          setStoredValue(initialValueRef.current)
        }
      }
    }

    const handleNativeStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        const parsed = parseAndValidate(e.newValue)
        // 削除された or バリデーション失敗時は initialValue にフォールバック
        setStoredValue(parsed ?? initialValueRef.current)
      }
    }

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
    window.addEventListener("storage", handleNativeStorageChange)

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange)
      window.removeEventListener("storage", handleNativeStorageChange)
    }
  }, [key, parseAndValidate])

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