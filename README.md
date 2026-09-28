# Weather App

A browser-based weather application built with HTML, CSS and JavaScript.

The application can search for a city, retrieve its coordinates, display current weather conditions and show a 7-day forecast. It also supports weather lookup using the browser's geolocation API.

## Features

- Search weather by city
- Use current browser location
- Geocoding with Open-Meteo
- Current temperature
- Feels-like temperature for location-based lookup
- Relative humidity
- Wind speed
- Weather condition icons
- 7-day temperature forecast
- Loading and error states
- Keyboard support with Enter to search

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Fetch API
- Browser Geolocation API
- Open-Meteo API

## How It Works

1. The user enters a city name.
2. The application sends the city to the Open-Meteo geocoding API.
3. The returned latitude and longitude are used to request weather data.
4. Current conditions and a 7-day forecast are rendered dynamically in the page.
5. Alternatively, the browser's geolocation API can be used to request weather for the current location.

## What I Practiced

- Working with external REST APIs
- Asynchronous JavaScript with `async/await`
- HTTP requests with the Fetch API
- Handling API responses and errors
- DOM manipulation
- Browser geolocation
- Dynamic UI rendering
- Event handling

## Notes

The application uses client-side API requests, so no backend server is required to run the project locally.

## Screenshot

_Add a current screenshot here to make the repository easier to review._

## Author

Davyd

GitHub: https://github.com/Dav1dushka
