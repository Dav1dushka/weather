const weatherForm = document.getElementById("weatherForm");
const cityInput = document.getElementById("city");
const searchButton = document.getElementById("searchBtn");
const locationButton = document.getElementById("locationBtn");
const statusMessage = document.getElementById("statusMessage");
const weatherResults = document.getElementById("weather");

let activeRequest = 0;

const conditionLabels = new Map([
    [0, "Clear sky"],
    [1, "Mainly clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [48, "Depositing rime fog"],
    [51, "Light drizzle"],
    [53, "Moderate drizzle"],
    [55, "Dense drizzle"],
    [56, "Light freezing drizzle"],
    [57, "Dense freezing drizzle"],
    [61, "Light rain"],
    [63, "Moderate rain"],
    [65, "Heavy rain"],
    [66, "Light freezing rain"],
    [67, "Heavy freezing rain"],
    [71, "Light snow"],
    [73, "Moderate snow"],
    [75, "Heavy snow"],
    [77, "Snow grains"],
    [80, "Light rain showers"],
    [81, "Moderate rain showers"],
    [82, "Heavy rain showers"],
    [85, "Light snow showers"],
    [86, "Heavy snow showers"],
    [95, "Thunderstorm"],
    [96, "Thunderstorm with light hail"],
    [99, "Thunderstorm with heavy hail"]
]);

function getCondition(code) {
    return conditionLabels.get(code) ?? "Conditions unavailable";
}

function getWeatherIcon(code, isDay = 1) {
    if (code === 0) return isDay ? "☀️" : "🌙";
    if (code === 1) return "🌤️";
    if (code === 2) return "⛅";
    if (code === 3) return "☁️";
    if (code <= 48) return "🌫️";
    if (code <= 57) return "🌦️";
    if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️";
    if (code <= 77 || (code >= 85 && code <= 86)) return "❄️";
    if (code >= 95) return "⛈️";
    return "☁️";
}

function beginRequest(message) {
    activeRequest += 1;
    weatherResults.replaceChildren();
    statusMessage.textContent = message;
    statusMessage.className = "status-message is-loading";
    searchButton.disabled = true;
    locationButton.disabled = true;
    return activeRequest;
}

function finishRequest(requestId) {
    if (requestId !== activeRequest) return false;
    searchButton.disabled = false;
    locationButton.disabled = false;
    statusMessage.className = "status-message";
    return true;
}

function showError(requestId, message) {
    if (!finishRequest(requestId)) return;
    statusMessage.textContent = message;
    statusMessage.classList.add("is-error");
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Weather service returned ${response.status}.`);
    }
    return response.json();
}

async function fetchForecast(latitude, longitude) {
    const parameters = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        forecast_days: "7",
        timezone: "auto"
    });
    const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?${parameters}`);

    if (!data.current || !data.daily || !Array.isArray(data.daily.time)) {
        throw new Error("The weather service returned incomplete data.");
    }

    return data;
}

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createMetric(label, value, icon) {
    const item = createElement("div", "metric-card");
    const symbol = createElement("span", "metric-icon", icon);
    symbol.setAttribute("aria-hidden", "true");
    const copy = createElement("div", "metric-copy");
    copy.append(createElement("span", "metric-label", label));
    copy.append(createElement("strong", "metric-value", value));
    item.append(symbol, copy);
    return item;
}

function formatForecastDay(dateValue) {
    const date = new Date(`${dateValue}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        timeZone: "UTC"
    }).format(date);
}

function createForecastDay(data, index) {
    const code = data.daily.weather_code[index];
    const day = createElement("article", "forecast-day");
    day.append(createElement("span", "forecast-date", formatForecastDay(data.daily.time[index])));

    const icon = createElement("span", "forecast-icon", getWeatherIcon(code));
    icon.setAttribute("aria-label", getCondition(code));
    day.append(icon);
    day.append(createElement("span", "forecast-condition", getCondition(code)));

    const temperatures = createElement("div", "forecast-temperatures");
    temperatures.append(
        createElement("strong", "forecast-high", `${Math.round(data.daily.temperature_2m_max[index])}°`),
        createElement("span", "forecast-low", `${Math.round(data.daily.temperature_2m_min[index])}°`)
    );
    day.append(temperatures);
    return day;
}

function renderForecast(data, placeName) {
    const current = data.current;
    const currentCode = current.weather_code;
    const card = createElement("section", "weather-card");

    const currentPanel = createElement("div", "current-panel");
    const location = createElement("div", "current-location");
    location.append(
        createElement("p", "eyebrow", "CURRENT WEATHER"),
        createElement("h2", "location-name", placeName)
    );

    const currentWeather = createElement("div", "current-weather");
    const icon = createElement("span", "current-icon", getWeatherIcon(currentCode, current.is_day));
    icon.setAttribute("aria-hidden", "true");
    const temperatureBlock = createElement("div", "temperature-block");
    temperatureBlock.append(
        createElement("p", "current-condition", getCondition(currentCode)),
        createElement("p", "current-temperature", `${Math.round(current.temperature_2m)}°C`)
    );
    currentWeather.append(icon, temperatureBlock);

    const metrics = createElement("div", "metrics-grid");
    metrics.append(
        createMetric("Feels like", `${Math.round(current.apparent_temperature)}°C`, "↗"),
        createMetric("Humidity", `${current.relative_humidity_2m}%`, "◌"),
        createMetric("Wind", `${Math.round(current.wind_speed_10m)} km/h`, "↝")
    );
    currentPanel.append(location, currentWeather, metrics);

    const forecastPanel = createElement("div", "forecast-panel");
    forecastPanel.append(
        createElement("div", "forecast-heading", "7-day forecast"),
        createElement("p", "forecast-caption", "Daily highs and lows in °C")
    );
    const forecastGrid = createElement("div", "forecast-grid");
    data.daily.time.slice(0, 7).forEach((_, index) => forecastGrid.append(createForecastDay(data, index)));
    forecastPanel.append(forecastGrid);

    card.append(currentPanel, forecastPanel);
    weatherResults.replaceChildren(card);
}

weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) {
        cityInput.focus();
        return;
    }

    const requestId = beginRequest(`Looking up ${city}...`);

    try {
        const parameters = new URLSearchParams({
            name: city,
            count: "1",
            language: "en",
            format: "json"
        });
        const locations = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${parameters}`);

        if (requestId !== activeRequest) return;
        const place = locations.results?.[0];
        if (!place) {
            showError(requestId, `No matching city found for “${city}”. Try another spelling.`);
            return;
        }

        statusMessage.textContent = `Loading forecast for ${place.name}...`;
        const forecast = await fetchForecast(place.latitude, place.longitude);
        if (!finishRequest(requestId)) return;

        const placeName = [place.name, place.admin1, place.country]
            .filter((value, index, values) => value && values.indexOf(value) === index)
            .join(", ");
        statusMessage.textContent = `Forecast for ${placeName}`;
        renderForecast(forecast, placeName);
    } catch (error) {
        console.error(error);
        showError(requestId, "We couldn't load the forecast. Check your connection and try again.");
    }
});

locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        statusMessage.textContent = "This browser does not support location access.";
        statusMessage.className = "status-message is-error";
        return;
    }

    const requestId = beginRequest("Waiting for location permission...");
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            if (requestId !== activeRequest) return;
            statusMessage.textContent = "Loading forecast for your location...";

            try {
                const { latitude, longitude } = position.coords;
                const forecast = await fetchForecast(latitude, longitude);
                if (!finishRequest(requestId)) return;
                statusMessage.textContent = "Forecast for your current location";
                renderForecast(forecast, "Your current location");
            } catch (error) {
                console.error(error);
                showError(requestId, "We couldn't load the forecast for your location. Try searching for a city.");
            }
        },
        (error) => {
            const messages = {
                1: "Location access was denied. You can search for a city instead.",
                2: "Your location is unavailable. Check your device settings or search for a city.",
                3: "Location lookup timed out. Please try again."
            };
            showError(requestId, messages[error.code] ?? "We couldn't get your location. Search for a city instead.");
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
});
