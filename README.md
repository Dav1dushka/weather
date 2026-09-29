# Weather App

A React and TypeScript weather dashboard for checking current conditions and a seven-day forecast by city or device location. Weather data comes from the Open-Meteo APIs.

![Weather dashboard showing a seven-day forecast for Livorno](assets/weather-app.png)

## What it does

- Search for a city and view current conditions plus a seven-day forecast.
- Ask for browser location only when the user selects **Use my location**.
- Show loading, no-results, API-error, location-permission, and timeout states.
- Cancel an older network request when a newer search starts, so late responses cannot replace the latest result.
- Use a responsive forecast layout on desktop and mobile screens.

## Run locally

You need Node.js 20.19+ or 22.12+.

```bash
pnpm install
pnpm dev
```

Vite prints the local URL in the terminal. To create a production build, run:

```bash
pnpm build
```

Browser geolocation works on secure contexts such as HTTPS and localhost. Some browsers block it when the page is opened directly from disk.

## Data and APIs

- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) finds the city coordinates.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) provides current conditions and the daily forecast.
- The browser's Geolocation API provides coordinates only after the user requests location access and grants permission.

The app does not store a location. Coordinates are held only while requesting the forecast needed to display the result.

## Implementation notes

- React state controls the search, request status, and forecast display.
- TypeScript describes the API data used by the interface. The API layer checks the response shape before rendering it.
- `AbortController` cancels an outdated fetch when the user starts a new search.
- City names and query parameters are encoded with `URLSearchParams`.
- The search form, loading message, forecast labels, and keyboard focus states support accessible use.

## Project structure

```text
src/
  lib/
    api.ts             Fetch and validate the Open-Meteo responses
    weather-codes.ts   Map weather codes to labels and icons
  App.tsx              Search, request state, and forecast components
  main.tsx             React entry point
  styles.css           Responsive layout and visual styles
```

## Built with

React · TypeScript · Vite · Fetch API · Open-Meteo
