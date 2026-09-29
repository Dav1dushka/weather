import { useRef, useState, type FormEvent } from "react";
import { findCityForecast, findCoordinatesForecast } from "./lib/api";
import { getCondition, getWeatherIcon } from "./lib/weather-codes";
import type { ActiveRequest, DailyForecast, ForecastResponse, RequestState, WeatherResult } from "./types";

const INITIAL_STATUS: RequestState = {
  kind: "idle",
  message: "Search for a city to see its forecast.",
};

function formatForecastDay(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function App() {
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<RequestState>(INITIAL_STATUS);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const requestId = useRef(0);
  const activeRequest = useRef<ActiveRequest | null>(null);

  function startRequest(message: string): ActiveRequest {
    activeRequest.current?.controller.abort();
    const request: ActiveRequest = {
      id: ++requestId.current,
      controller: new AbortController(),
    };
    activeRequest.current = request;
    setWeather(null);
    setStatus({ kind: "loading", message });
    return request;
  }

  function isActive(request: ActiveRequest): boolean {
    return activeRequest.current?.id === request.id && !request.controller.signal.aborted;
  }

  function showRequestError(request: ActiveRequest, message: string): void {
    if (!isActive(request)) return;
    setStatus({ kind: "error", message });
  }

  function showForecast(request: ActiveRequest, result: WeatherResult): void {
    if (!isActive(request)) return;
    setWeather(result);
    setStatus({ kind: "success", message: `Forecast for ${result.placeName}` });
  }

  async function handleCitySearch(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const query = city.trim();
    if (!query) {
      setStatus({ kind: "error", message: "Enter a city name to search." });
      return;
    }

    const request = startRequest(`Looking up ${query}...`);
    try {
      const result = await findCityForecast(query, request.controller.signal);
      if (!result) {
        showRequestError(request, `No matching city found for “${query}”. Try another spelling.`);
        return;
      }
      showForecast(request, result);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      showRequestError(request, "We couldn't load the forecast. Check your connection and try again.");
    }
  }

  function handleLocationSearch(): void {
    if (!navigator.geolocation) {
      setStatus({ kind: "error", message: "This browser does not support location access." });
      return;
    }

    const request = startRequest("Waiting for location permission...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isActive(request)) return;
        setStatus({ kind: "loading", message: "Loading forecast for your location..." });
        try {
          const result = await findCoordinatesForecast(
            position.coords.latitude,
            position.coords.longitude,
            request.controller.signal,
          );
          showForecast(request, result);
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          showRequestError(request, "We couldn't load the forecast for your location. Try searching for a city.");
        }
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location access was denied. You can search for a city instead.",
          2: "Your location is unavailable. Check your device settings or search for a city.",
          3: "Location lookup timed out. Please try again.",
        };
        showRequestError(request, messages[error.code] ?? "We couldn't get your location. Search for a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const isLoading = status.kind === "loading";

  return (
    <main className="weather-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true">W</div>
        <div>
          <p className="eyebrow">WEATHER, AT A GLANCE</p>
          <h1>Weather App</h1>
          <p className="page-subtitle">Current conditions and a seven-day forecast.</p>
        </div>
      </header>

      <section className="search-panel" aria-label="Find weather">
        <form className="search-form" onSubmit={handleCitySearch}>
          <label className="visually-hidden" htmlFor="city">City name</label>
          <input
            id="city"
            name="city"
            type="search"
            placeholder="Search for a city"
            autoComplete="off"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <button className="button button-primary" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search"}
          </button>
        </form>
        <span className="separator" aria-hidden="true">or</span>
        <button className="button button-location" type="button" disabled={isLoading} onClick={handleLocationSearch}>
          <span aria-hidden="true">⌖</span> Use my location
        </button>
      </section>

      <p className={`status-message${isLoading ? " is-loading" : ""}${status.kind === "error" ? " is-error" : ""}`} role="status" aria-live="polite">
        {status.message}
      </p>

      <section className="weather-results" aria-label="Weather forecast" aria-live="polite">
        {weather && <WeatherCard placeName={weather.placeName} forecast={weather.forecast} />}
      </section>

      <footer className="page-footer">
        <p>Forecast data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Location access is used only when you choose the location button.</p>
      </footer>
    </main>
  );
}

function WeatherCard({ placeName, forecast }: { placeName: string; forecast: ForecastResponse }) {
  const current = forecast.current;
  return (
    <article className="weather-card">
      <section className="current-panel" aria-labelledby="locationName">
        <div className="current-location">
          <p className="eyebrow">CURRENT WEATHER</p>
          <h2 className="location-name" id="locationName">{placeName}</h2>
        </div>

        <div className="current-weather">
          <span className="current-icon" aria-hidden="true">
            {getWeatherIcon(current.weather_code, current.is_day === 1)}
          </span>
          <div className="temperature-block">
            <p className="current-condition">{getCondition(current.weather_code)}</p>
            <p className="current-temperature">{Math.round(current.temperature_2m)}°C</p>
          </div>
        </div>

        <div className="metrics-grid">
          <Metric label="Feels like" value={`${Math.round(current.apparent_temperature)}°C`} icon="↗" />
          <Metric label="Humidity" value={`${current.relative_humidity_2m}%`} icon="◌" />
          <Metric label="Wind" value={`${Math.round(current.wind_speed_10m)} km/h`} icon="↝" />
        </div>
      </section>

      <section className="forecast-panel" aria-labelledby="forecastHeading">
        <h3 className="forecast-heading" id="forecastHeading">7-day forecast</h3>
        <p className="forecast-caption">Daily highs and lows in °C</p>
        <div className="forecast-grid">
          {forecast.daily.time.slice(0, 7).map((date, index) => (
            <ForecastDay key={date} date={date} daily={forecast.daily} index={index} />
          ))}
        </div>
      </section>
    </article>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="metric-card">
      <span className="metric-icon" aria-hidden="true">{icon}</span>
      <div className="metric-copy">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
      </div>
    </div>
  );
}

function ForecastDay({ date, daily, index }: { date: string; daily: DailyForecast; index: number }) {
  const code = daily.weather_code[index] ?? 0;
  const high = daily.temperature_2m_max[index] ?? 0;
  const low = daily.temperature_2m_min[index] ?? 0;
  return (
    <article className="forecast-day">
      <span className="forecast-date">{formatForecastDay(date)}</span>
      <span className="forecast-icon" role="img" aria-label={getCondition(code)}>{getWeatherIcon(code)}</span>
      <span className="forecast-condition">{getCondition(code)}</span>
      <div className="forecast-temperatures">
        <strong className="forecast-high">{Math.round(high)}°</strong>
        <span className="forecast-low">{Math.round(low)}°</span>
      </div>
    </article>
  );
}

export default App;
