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
  | "Dust"
  | "Sand"
  | "Ash"
  | "Squall"
  | "Tornado"

export interface BackgroundGradient {
  from: string
  via?: string
  to: string
}

// 時間帯の判定
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 9) return "dawn" // 朝
  if (hour >= 9 && hour < 17) return "day" // 昼
  if (hour >= 17 && hour < 19) return "dusk" // 夕方
  return "night" // 夜
}

// 天気と時間帯に応じた背景色を取得
export function getWeatherBackground(
  weather: WeatherType,
  timeOfDay: TimeOfDay
): BackgroundGradient {
  const backgrounds: Record<WeatherType, Record<TimeOfDay, BackgroundGradient>> = {
    Clear: {
      dawn: { from: "#FFE5B4", via: "#FFB347", to: "#FFA500" }, // 朝焼け
      day: { from: "#87CEEB", via: "#87CEFA", to: "#B0E0E6" }, // 青空
      dusk: { from: "#FF6347", via: "#FF4500", to: "#FF8C00" }, // 夕焼け
      night: { from: "#191970", via: "#000080", to: "#000033" }, // 夜空
    },
    Clouds: {
      dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
      day: { from: "#B0C4DE", via: "#778899", to: "#708090" },
      dusk: { from: "#696969", via: "#808080", to: "#778899" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Rain: {
      dawn: { from: "#778899", via: "#708090", to: "#696969" },
      day: { from: "#4682B4", via: "#5F9EA0", to: "#708090" },
      dusk: { from: "#556B2F", via: "#6B8E23", to: "#808080" },
      night: { from: "#1C1C1C", via: "#2F2F2F", to: "#000000" },
    },
    Drizzle: {
      dawn: { from: "#B0C4DE", via: "#C0C0C0", to: "#A9A9A9" },
      day: { from: "#87CEEB", via: "#B0C4DE", to: "#778899" },
      dusk: { from: "#778899", via: "#696969", to: "#708090" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Thunderstorm: {
      dawn: { from: "#4B4B4B", via: "#2F2F2F", to: "#1C1C1C" },
      day: { from: "#2F4F4F", via: "#1C1C1C", to: "#000000" },
      dusk: { from: "#1C1C1C", via: "#000000", to: "#2F2F2F" },
      night: { from: "#000000", via: "#1C1C1C", to: "#2F2F2F" },
    },
    Snow: {
      dawn: { from: "#E6E6FA", via: "#D3D3D3", to: "#C0C0C0" },
      day: { from: "#F0F8FF", via: "#E0E0E0", to: "#D3D3D3" },
      dusk: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Mist: {
      dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
      day: { from: "#E0E0E0", via: "#D3D3D3", to: "#C0C0C0" },
      dusk: { from: "#A9A9A9", via: "#808080", to: "#696969" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Fog: {
      dawn: { from: "#C0C0C0", via: "#A9A9A9", to: "#808080" },
      day: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
      dusk: { from: "#808080", via: "#696969", to: "#708090" },
      night: { from: "#1C1C1C", via: "#000000", to: "#2F2F2F" },
    },
    Haze: {
      dawn: { from: "#D3D3D3", via: "#C0C0C0", to: "#A9A9A9" },
      day: { from: "#E0E0E0", via: "#D3D3D3", to: "#C0C0C0" },
      dusk: { from: "#A9A9A9", via: "#808080", to: "#696969" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Dust: {
      dawn: { from: "#DEB887", via: "#CD853F", to: "#A0522D" },
      day: { from: "#F4A460", via: "#DEB887", to: "#CD853F" },
      dusk: { from: "#CD853F", via: "#A0522D", to: "#8B4513" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Sand: {
      dawn: { from: "#F5DEB3", via: "#DEB887", to: "#CD853F" },
      day: { from: "#FFE4B5", via: "#F5DEB3", to: "#DEB887" },
      dusk: { from: "#DEB887", via: "#CD853F", to: "#A0522D" },
      night: { from: "#2F2F2F", via: "#1C1C1C", to: "#000000" },
    },
    Ash: {
      dawn: { from: "#696969", via: "#808080", to: "#A9A9A9" },
      day: { from: "#778899", via: "#696969", to: "#808080" },
      dusk: { from: "#556B2F", via: "#696969", to: "#708090" },
      night: { from: "#1C1C1C", via: "#000000", to: "#2F2F2F" },
    },
    Squall: {
      dawn: { from: "#4682B4", via: "#5F9EA0", to: "#708090" },
      day: { from: "#5F9EA0", via: "#4682B4", to: "#778899" },
      dusk: { from: "#556B2F", via: "#696969", to: "#708090" },
      night: { from: "#1C1C1C", via: "#2F2F2F", to: "#000000" },
    },
    Tornado: {
      dawn: { from: "#4B4B4B", via: "#2F2F2F", to: "#1C1C1C" },
      day: { from: "#2F4F4F", via: "#1C1C1C", to: "#000000" },
      dusk: { from: "#1C1C1C", via: "#000000", to: "#2F2F2F" },
      night: { from: "#000000", via: "#1C1C1C", to: "#2F2F2F" },
    },
  }

  return backgrounds[weather]?.[timeOfDay] || backgrounds.Clear[timeOfDay]
}

