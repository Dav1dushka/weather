const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const weatherDiv = document.getElementById("weather");

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        getWeather();
    }
});

async function getWeather() {

    const city = cityInput.value.trim();

    if (!city) {
        weatherDiv.innerHTML = "<p>Введите название города</p>";
        return;
    }

    weatherDiv.innerHTML = "<p>Загрузка...</p>";

    try {

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=ru&format=json`
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            weatherDiv.innerHTML = "<p>Город не найден</p>";
            return;
        }

        const {
            latitude,
            longitude,
            name,
            country
        } = geoData.results[0];

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        );

        const weatherData = await weatherResponse.json();

        let forecastHTML = "";

        for (let i = 0; i < 7; i++) {
            forecastHTML += `
                <div class="forecast-day">
                    <p>${weatherData.daily.time[i]}</p>
                    <p>⬆ ${weatherData.daily.temperature_2m_max[i]}°C</p>
                    <p>⬇ ${weatherData.daily.temperature_2m_min[i]}°C</p>
                </div>
            `;
        }

        weatherDiv.innerHTML = `
            <div class="weather-card">
                <h2>${name}, ${country}</h2>

                <h1>${weatherData.current.temperature_2m}°C</h1>

                <p>💧 Влажность: ${weatherData.current.relative_humidity_2m}%</p>

                <p>💨 Ветер: ${weatherData.current.wind_speed_10m} км/ч</p>

                <h3>Прогноз на 7 дней</h3>

                <div class="forecast">
                    ${forecastHTML}
                </div>
            </div>
        `;

    } catch (error) {

        weatherDiv.innerHTML = `
            <p>Ошибка загрузки данных.</p>
        `;

        console.error(error);
    }
}

const locationBtn = document.getElementById("locationBtn");

locationBtn.addEventListener("click", getLocationWeather);

function getLocationWeather(){

    navigator.geolocation.getCurrentPosition(
        async(position)=>{

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const weatherResponse = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
);

            const weatherData = await weatherResponse.json();

           weatherDiv.innerHTML = `...`;
        const ctx =
document.getElementById("tempChart");

if(window.weatherChart){
    window.weatherChart.destroy();
}

window.weatherChart = new Chart(ctx, {

    type: "line",

    data: {

        labels: weatherData.daily.time,

        datasets: [{

            label: "Макс. температура",

            data:
            weatherData.daily.temperature_2m_max

        }]

    }

});
            
<div class="weather-card">

<h2>${name}, ${country}</h2>

<h1>${weatherData.current.temperature_2m}°C</h1>

<p>
🌡 Ощущается как:
${weatherData.current.apparent_temperature}°C
</p>

<p>
💧 Влажность:
${weatherData.current.relative_humidity_2m}%
</p>

<p>
💨 Ветер:
${weatherData.current.wind_speed_10m} км/ч
</p>

<p>
🌅 Восход:
${weatherData.daily.sunrise[0].slice(11)}
</p>

<p>
🌇 Закат:
${weatherData.daily.sunset[0].slice(11)}
</p>

<h3>Прогноз на 7 дней</h3>

<div class="forecast">
${forecastHTML}
</div>

</div>
`;
        },
        ()=>{
            alert("Не удалось получить геолокацию");
        }
    );
}
