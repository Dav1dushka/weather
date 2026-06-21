const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weather");

searchBtn.addEventListener("click", getWeather);

async function getWeather() {

    const city = cityInput.value;

    try {

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        );

        const geoData = await geoResponse.json();
        
        if (!geoData.results) {
            weatherDiv.innerHTML = "Город не найден";
            return;
        }

        const { latitude, longitude, name } = geoData.results[0];

       const weatherResponse = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
);

        const weatherData = await weatherResponse.json();

        weatherDiv.innerHTML = `
    <h2>${name}</h2>
    <p>🌡 Температура: ${weatherData.current.temperature_2m}°C</p>
    <p>💧 Влажность: ${weatherData.current.relative_humidity_2m}%</p>
    <p>💨 Ветер: ${weatherData.current.wind_speed_10m} км/ч</p>
`;
        `;

    } catch(error) {
        weatherDiv.innerHTML = "Ошибка загрузки данных";
    }
}
