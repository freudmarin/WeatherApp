const API_KEY = "YOUR_API_KEY_HERE";

let unit = "metric"; // metric = °C, imperial = °F

// DOM Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherBox = document.getElementById("weatherResult");
const forecastBox = document.getElementById("forecast");
const errorBox = document.getElementById("errorMessage");
const suggestionBox = document.getElementById("suggestions");
const unitToggle = document.getElementById("unitToggle");

// -------------------- EVENTS --------------------
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

unitToggle.addEventListener("click", () => {
    unit = unit === "metric" ? "imperial" : "metric";
    const lastCity = localStorage.getItem("lastCity");
    if (lastCity) fetchWeatherByCity(lastCity);
});

// Autocomplete suggestions
cityInput.addEventListener("input", async () => {
    const query = cityInput.value.trim();
    suggestionBox.innerHTML = "";
    if (!query) {
        suggestionBox.classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`);
        const cities = await res.json();
        suggestionBox.classList.remove("hidden");
        cities.forEach(c => {
            const div = document.createElement("div");
            div.textContent = `${c.name}, ${c.country}`;
            div.addEventListener("click", () => {
                cityInput.value = c.name;
                suggestionBox.innerHTML = "";
                suggestionBox.classList.add("hidden");
            });
            suggestionBox.appendChild(div);
        });
    } catch (err) {
        console.log("Autocomplete error:", err);
    }
});

// -------------------- MAIN FUNCTIONS --------------------
window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            () => loadLastCity()
        );
    } else {
        loadLastCity();
    }
};

async function fetchWeatherByCity(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`);
        if (!res.ok) throw new Error("City not found");

        const data = await res.json();
        updateUI(data);
        saveLastCity(data.name);
        fetchForecast(data.name);
    } catch (err) {
        displayError(err.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`);
        const data = await res.json();
        updateUI(data);
        saveLastCity(data.name);
        fetchForecast(data.name);
    } catch (err) {
        displayError(err.message);
    }
}

async function fetchForecast(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`);
        const data = await res.json();
        updateForecastUI(data);
    } catch (err) {
        console.log("Forecast error:", err);
    }
}

// -------------------- UI FUNCTIONS --------------------
function updateUI(data) {
    errorBox.classList.add("hidden");

    document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temperature").textContent = `Temperature: ${data.main.temp.toFixed(1)}°${unit === "metric" ? "C" : "F"}`;
    document.getElementById("description").textContent = `Weather: ${data.weather[0].description}`;
    document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById("wind").textContent = `Wind: ${data.wind.speed} ${unit === "metric" ? "m/s" : "mph"}`;

    const iconCode = data.weather[0].icon;
    document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    weatherBox.classList.remove("hidden");
    weatherBox.classList.add("fade-in");
}

function updateForecastUI(data) {
    forecastBox.innerHTML = "";
    forecastBox.classList.remove("hidden");
    forecastBox.classList.add("fade-in");

    // Group forecasts by date
    const forecastByDate = {};
    data.list.forEach(item => {
        const dateStr = new Date(item.dt_txt).toLocaleDateString();
        if (!forecastByDate[dateStr]) forecastByDate[dateStr] = [];
        forecastByDate[dateStr].push(item);
    });

    const todayStr = new Date().toLocaleDateString();

    Object.keys(forecastByDate).forEach(dateStr => {
        const dayItems = forecastByDate[dateStr];

        // Find min and max temp for the day
        const temps = dayItems.map(i => i.main.temp);
        const minTemp = Math.min(...temps).toFixed(1);
        const maxTemp = Math.max(...temps).toFixed(1);

        // Pick icon and description from the middle of the day for better representation
        const midIndex = Math.floor(dayItems.length / 2);
        const icon = dayItems[midIndex].weather[0].icon;
        const description = dayItems[midIndex].weather[0].description;

        const div = document.createElement("div");
        div.classList.add("forecast-day");
        if (dateStr === todayStr) div.classList.add("current-day"); // highlight today

        div.innerHTML = `
            <div class="info">
                <strong>${dateStr}</strong>
                <span>${description}</span>
                <span>Min: ${minTemp}°${unit === "metric" ? "C" : "F"} | Max: ${maxTemp}°${unit === "metric" ? "C" : "F"}</span>
            </div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" />
        `;
        forecastBox.appendChild(div);
    });
}

function displayError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    weatherBox.classList.add("hidden");
}

// -------------------- LOCALSTORAGE --------------------
function saveLastCity(city) {
    localStorage.setItem("lastCity", city);
}

function loadLastCity() {
    const last = localStorage.getItem("lastCity");
    if (last) fetchWeatherByCity(last);
}