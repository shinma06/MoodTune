export type TimeOfDay = "dawn" | "day" | "dusk" | "night"
export type WeatherType =
    | "Clear"
    | "Clouds"
    | "Rain"
    | "Drizzle"
    | "Thunderstorm"
    | "Snow"
    | "Mist"
    | "Fog"
    | "Haze"

export interface BackgroundGradient {
    top?: string // 最上部の色（常に白ベースでUI視認性を担保）
    from: string
    via?: string // 中間色1
    via2?: string // 中間色2（滑らかなグラデーション用）
    via3?: string // 中間色3（より滑らかなグラデーション用）
    to: string
    to2?: string // 最終色（5色以上のグラデーション用）
}

/** 明るい背景用の上部色（ヘッダー/UIが暗いテーマになるかどうかの境界） */
const BACKGROUND_TOP_COLOR_BRIGHT = "#FAFAFA"

/**
 * 天気×時間帯 → グラデーション最上部の色（静的なテーブル）
 * ヘッダー・UIのテキスト色はこの値が明るいかどうかで固定で紐づく
 */
const TOP_COLOR: Record<WeatherType, Record<TimeOfDay, string>> = {
    Clear: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#FAFAFA", night: "#2A2A4A" },
    Clouds: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1C1C1C" },
    Rain: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1A1A2A" },
    Drizzle: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1A1A2A" },
    Thunderstorm: { dawn: "#1C1C1C", day: "#1C1C1C", dusk: "#1C1C1C", night: "#0A0A0A" },
    Snow: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#FAFAFA", night: "#2A2A2A" },
    Mist: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1C1C1C" },
    Fog: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1C1C1C" },
    Haze: { dawn: "#FAFAFA", day: "#FAFAFA", dusk: "#2F2F2F", night: "#1C1C1C" },
}

/**
 * 天気×時間帯 → ヘッダー/UIを暗いテーマ（白文字）にするか（静的なテーブル）
 * TOP_COLOR が明るい色でない組み合わせは true
 */
const IS_DARK: Record<WeatherType, Record<TimeOfDay, boolean>> = {
    Clear: { dawn: false, day: false, dusk: false, night: true },
    Clouds: { dawn: false, day: false, dusk: true, night: true },
    Rain: { dawn: false, day: false, dusk: true, night: true },
    Drizzle: { dawn: false, day: false, dusk: true, night: true },
    Thunderstorm: { dawn: true, day: true, dusk: true, night: true },
    Snow: { dawn: false, day: false, dusk: false, night: true },
    Mist: { dawn: false, day: false, dusk: true, night: true },
    Fog: { dawn: false, day: false, dusk: true, night: true },
    Haze: { dawn: false, day: false, dusk: true, night: true },
}

/** 天気と時間帯に応じた top 色を取得（テーブル参照） */
function getTopColor(weather: WeatherType, timeOfDay: TimeOfDay): string {
    return TOP_COLOR[weather]?.[timeOfDay] ?? BACKGROUND_TOP_COLOR_BRIGHT
}

/**
 * 背景が暗いかどうか（ヘッダー/UIのテキスト色を白にするか）を取得（テーブル参照）
 */
export function isDarkBackground(weather: WeatherType, timeOfDay: TimeOfDay): boolean {
    return IS_DARK[weather]?.[timeOfDay] ?? false
}

// 時間帯の判定
export function getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 6 && hour < 9) return "dawn" // 朝
    if (hour >= 9 && hour < 17) return "day" // 昼
    if (hour >= 17 && hour < 19) return "dusk" // 夕方
    return "night" // 夜
}

/** 天気×時間帯 → 背景グラデーション（静的なテーブル） */
const BACKGROUNDS: Record<WeatherType, Record<TimeOfDay, BackgroundGradient>> = {
    Clear: {
        dawn: { from: "#FFE5B4", via: "#FFB347", to: "#FFA500" }, // 朝焼け
        day: { from: "#87CEEB", via: "#87CEFA", to: "#B0E0E6" }, // 青空
        dusk: { from: "#FF6347", via: "#FF4500", to: "#FF8C00" }, // 夕焼け
        night: { from: "#3A3A5C", via: "#2A2A4A", via2: "#1A1A3A", to: "#191970", to2: "#000033" }, // 夜空
    },
    Clouds: {
        dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
        day: { from: "#B0C4DE", via: "#778899", to: "#708090" },
        dusk: { from: "#696969", via: "#808080", to: "#778899" },
        night: { from: "#2F2F2F", via: "#252525", via2: "#1A1A1A", to: "#0F0F0F", to2: "#000000" },
    },
    Rain: {
        dawn: { from: "#778899", via: "#708090", to: "#696969" },
        day: { from: "#4682B4", via: "#5F9EA0", to: "#708090" },
        dusk: { from: "#3A3A3A", via: "#2F2F2F", via2: "#252525", to: "#1A1A1A", to2: "#000000" },
        night: { from: "#2A2A3A", via: "#1F1F2F", via2: "#151525", to: "#0F0F1A", to2: "#000000" },
    },
    Drizzle: {
        dawn: { from: "#B0C4DE", via: "#C0C0C0", to: "#A9A9A9" },
        day: { from: "#87CEEB", via: "#B0C4DE", to: "#778899" },
        dusk: { from: "#778899", via: "#696969", to: "#708090" },
        night: { from: "#2A2A3A", via: "#1F1F2F", via2: "#151525", to: "#0F0F1A", to2: "#000000" },
    },
    Thunderstorm: {
        dawn: { from: "#1A1A1A", via: "#151515", via2: "#0F0F0F", to: "#0A0A0A", to2: "#000000" },
        day: { from: "#1C1C1C", via: "#151515", via2: "#0F0F0F", to: "#0A0A0A", to2: "#000000" },
        dusk: { from: "#1A1A1A", via: "#151515", via2: "#0F0F0F", to: "#0A0A0A", to2: "#000000" },
        night: { from: "#0A0A0A", via: "#080808", via2: "#050505", to: "#030303", to2: "#000000" },
    },
    Snow: {
        dawn: { from: "#E6E6FA", via: "#D3D3D3", to: "#C0C0C0" },
        day: { from: "#F0F8FF", via: "#E0E0E0", to: "#D3D3D3" },
        dusk: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
        night: { from: "#2F2F2F", via: "#252525", via2: "#1A1A1A", to: "#0F0F0F", to2: "#000000" },
    },
    Mist: {
        dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
        day: { from: "#E0E0E0", via: "#D3D3D3", to: "#C0C0C0" },
        dusk: { from: "#A9A9A9", via: "#808080", to: "#696969" },
        night: { from: "#2F2F2F", via: "#252525", via2: "#1A1A1A", to: "#0F0F0F", to2: "#000000" },
    },
    Fog: {
        dawn: { from: "#C0C0C0", via: "#A9A9A9", to: "#808080" },
        day: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
        dusk: { from: "#3A3A3A", via: "#2F2F2F", via2: "#252525", to: "#1A1A1A", to2: "#000000" },
        night: { from: "#2F2F2F", via: "#252525", via2: "#1A1A1A", to: "#0F0F0F", to2: "#000000" },
    },
    Haze: {
        dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
        day: { from: "#E0E0E0", via: "#D3D3D3", to: "#C0C0C0" },
        dusk: { from: "#A9A9A9", via: "#808080", to: "#696969" },
        night: { from: "#2F2F2F", via: "#252525", via2: "#1A1A1A", to: "#0F0F0F", to2: "#000000" },
    },
}

// 天気と時間帯に応じた背景色を取得（テーブル参照）
export function getWeatherBackground(
    weather: WeatherType,
    timeOfDay: TimeOfDay
): BackgroundGradient {
    const baseGradient = BACKGROUNDS[weather]?.[timeOfDay] || BACKGROUNDS.Clear[timeOfDay]
    return {
        top: getTopColor(weather, timeOfDay),
        ...baseGradient,
    }
}

