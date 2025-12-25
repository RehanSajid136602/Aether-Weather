export interface DailyForecast {
  day: string;
  high: number;
  low: number;
  condition: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
}

export interface WeatherData {
  city: string;
  country: string;
  currentTemp: number;
  condition: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  groundingSource?: string;
  rawText?: string;
}

export interface CitySearchResult {
  name: string;
  location: string;
  lat?: number;
  lng?: number;
}

export enum AppTheme {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  STORM = 'storm',
  SNOW = 'snow',
  NIGHT = 'night',
}

export interface AIAnalysisResult {
  advice: string;
  outfit: string;
  details: string;
}
