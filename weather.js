
const DEFAULT_CITY = "Gurugram";

const refreshButton = document.getElementById("weather-refresh");
const statusMessage = document.getElementById("weather-status");
const weatherInfo = document.getElementById("weather-info");

function getWeatherCondition(code) {
    const conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Foggy",
        48: "Rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        71: "Light snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        95: "Thunderstorm"
    };

    return conditions[code] || "Weather conditions unavailable";
}

async function loadWeather() {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing...";
    statusMessage.textContent = "Loading weather...";
    weatherInfo.hidden = true;

    try {
        const response = await fetch(
            `/api/weather?city=${encodeURIComponent(DEFAULT_CITY)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load weather.");
        }

        document.getElementById("weather-location").textContent =
            `${data.city}, ${data.country}`;

        document.getElementById("weather-condition").textContent =
            getWeatherCondition(data.current.weather_code);

        document.getElementById("weather-temperature").textContent =
            `${data.current.temperature_2m}°C`;

        document.getElementById("weather-feels").textContent =
            `${data.current.apparent_temperature}°C`;

        document.getElementById("weather-humidity").textContent =
            `${data.current.relative_humidity_2m}%`;

        document.getElementById("weather-wind").textContent =
            `${data.current.wind_speed_10m} km/h`;

        document.getElementById("weather-rain").textContent =
            `${data.current.precipitation} mm`;

        weatherInfo.hidden = false;
        statusMessage.textContent = "";

        document.getElementById("weather-updated").textContent =
            `Last updated: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        statusMessage.textContent = error.message;
    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "↻ Refresh Weather";
    }
}

// Load weather automatically when the page opens.
loadWeather();

// Refresh weather when the button is clicked.
refreshButton.addEventListener("click", loadWeather);
