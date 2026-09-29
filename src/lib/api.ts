import type { ForecastResponse, GeocodedPlace, WeatherResult } from "../types";

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber);
}

function isForecastResponse(value: unknown): value is ForecastResponse {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.daily)) return false;

  const { current, daily } = value;
  const currentIsValid = [
    current.temperature_2m,
    current.relative_humidity_2m,
    current.apparent_temperature,
    current.is_day,
    current.weather_code,
    current.wind_speed_10m,
  ].every(isFiniteNumber);
  if (!isStringArray(daily.time)
    || !isNumberArray(daily.weather_code)
    || !isNumberArray(daily.temperature_2m_max)
    || !isNumberArray(daily.temperature_2m_min)) return false;

  const hasForecastDays = daily.time.length > 0
    && daily.weather_code.length === daily.time.length
    && daily.temperature_2m_max.length === daily.time.length
    && daily.temperature_2m_min.length === daily.time.length;

  return currentIsValid && hasForecastDays;
}

function parsePlace(value: unknown): GeocodedPlace | null {
  if (!isRecord(value)
    || typeof value.name !== "string"
    || !isFiniteNumber(value.latitude)
    || !isFiniteNumber(value.longitude)) {
    return null;
  }

  return {
    name: value.name,
    latitude: value.latitude,
    longitude: value.longitude,
    ...(typeof value.admin1 === "string" ? { admin1: value.admin1 } : {}),
    ...(typeof value.country === "string" ? { country: value.country } : {}),
  };
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

async function fetchForecast(latitude: number, longitude: number, signal: AbortSignal): Promise<ForecastResponse> {
  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    timezone: "auto",
  });

  const data = await fetchJson(`${FORECAST_ENDPOINT}?${parameters}`, signal);
  if (!isForecastResponse(data)) {
    throw new Error("The weather service returned incomplete forecast data.");
  }
  return data;
}

export async function findCityForecast(city: string, signal: AbortSignal): Promise<WeatherResult | null> {
  const parameters = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
  const data = await fetchJson(`${GEOCODING_ENDPOINT}?${parameters}`, signal);
  const results = isRecord(data) && Array.isArray(data.results) ? data.results : [];
  const place = parsePlace(results[0]);
  if (!place) return null;

  const forecast = await fetchForecast(place.latitude, place.longitude, signal);
  const placeName = [place.name, place.admin1, place.country]
    .filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index)
    .join(", ");

  return { placeName, forecast };
}

export async function findCoordinatesForecast(latitude: number, longitude: number, signal: AbortSignal): Promise<WeatherResult> {
  const forecast = await fetchForecast(latitude, longitude, signal);
  return { placeName: "Your current location", forecast };
}
