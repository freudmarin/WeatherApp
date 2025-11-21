const API_KEY = "eccff5b2bbf2486f393195c946e62df7";

// -------------------- EVENT --------------------
document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) fetchWeatherByCity(city);
});

// Auto-load on page start
window.onload = () => {
    // 1. Try geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            () => loadLastCity()
        );
    } else {
        loadLastCity();
    }
};

// -------------------- MAIN FUNCTIONS --------------------
async function fetchWeatherByCity(city) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!res.ok) throw new Error("City not found");

        const data = await res.json();
        updateUI(data);
        saveLastCity(data.name);

        fetchForecast(data.name); // Load forecast too

    } catch (err) {
        displayError(err.message);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

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
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        const data = await res.json();
        updateForecastUI(data);

    } catch (err) {
        console.log("Forecast error:", err);
    }
}

// -------------------- UI FUNCTIONS --------------------
function updateUI(data) {
    const box = document.getElementById("weatherResult");
    document.getElementById("errorMessage").classList.add("hidden");

    document.getElementById("cityName").textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById("temperature").textContent = `Temperature: ${data.main.temp}°C`;
    document.getElementById("description").textContent = `Weather: ${data.weather[0].description}`;
    document.getElementById("humidity").textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById("wind").textContent = `Wind: ${data.wind.speed} m/s`;

    const iconCode = data.weather[0].icon;
    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    box.classList.remove("hidden");
}

function updateForecastUI(data) {
    const forecastBox = document.getElementById("forecast");
    forecastBox.innerHTML = "";
    forecastBox.classList.remove("hidden");

    // Get one forecast per day (every 24h)
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    daily.forEach(day => {
        const div = document.createElement("div");
        div.classList.add("forecast-day");

        div.innerHTML = `
            <div>
                <strong>${new Date(day.dt_txt).toLocaleDateString()}</strong><br>
                ${day.weather[0].description}<br>
                Temp: ${day.main.temp}°C
            </div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" />
        `;

        forecastBox.appendChild(div);
    });
}

function displayError(msg) {
    const box = document.getElementById("weatherResult");
    const err = document.getElementById("errorMessage");
    err.textContent = msg;
    err.classList.remove("hidden");
    box.classList.add("hidden");
}

// -------------------- LOCALSTORAGE --------------------
function saveLastCity(city) {
    localStorage.setItem("lastCity", city);
}

function loadLastCity() {
    const last = localStorage.getItem("lastCity");
    if (last) fetchWeatherByCity(last);
}