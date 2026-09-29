export interface GeocodedPlace {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export interface CurrentConditions {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

export interface ForecastResponse {
  current: CurrentConditions;
  daily: DailyForecast;
}

export interface WeatherResult {
  placeName: string;
  forecast: ForecastResponse;
}

export type RequestState =
  | { kind: "idle"; message: string }
  | { kind: "loading"; message: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export interface ActiveRequest {
  id: number;
  controller: AbortController;
}
