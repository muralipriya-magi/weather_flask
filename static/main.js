/* ===============================
   DOM ELEMENTS
   Grab all required HTML elements
   =============================== */
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const currentWeatherSection = document.getElementById("currentWeather");
const forecastContainer = document.getElementById("forecast");
const historyContainer = document.getElementById("searchHistory");

/* ===============================
   API DETAILS
   Replace with your API Key
   =============================== */
const API_KEY = "your_api_key_here";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

/* ======================================================
   MAIN FUNCTION → FETCH WEATHER + FORECAST
   Called whenever user searches or clicks history
   ====================================================== */
async function getWeather(city) {
    try {
        // Fetch current weather
        const weatherRes = await fetch(
            `${BASE_URL}weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const weather = await weatherRes.json();

        // Fetch 5-day forecast
        const forecastRes = await fetch(
            `${BASE_URL}forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        const forecast = await forecastRes.json();

        // Display data in UI
        displayCurrentWeather(weather);
        displayForecast(forecast);

        // Update animated background
        updateBackground(weather);

        // Save city in search history
        addToHistory(city);

        // Update temperature chart
        updateChart(forecast);

    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

/* ======================================================
   DISPLAY CURRENT WEATHER CARD
   Shows: city, temperature, description, icon, etc.
   ====================================================== */
function displayCurrentWeather(data) {
    currentWeatherSection.innerHTML = `
        <h2>${data.name}</h2>
        <p>${data.weather[0].main} - ${data.weather[0].description}</p>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind: ${data.wind.speed} m/s</p>
    `;
}

/* ======================================================
   DISPLAY 5-DAY FORECAST
   OpenWeather returns every 3 hours (40 entries)
   We pick only entries with "12:00" → one per day
   ====================================================== */
function displayForecast(forecast) {
    forecastContainer.innerHTML = "";

    // Filter entries at 12 PM → ideal daily snapshot
    const daily = forecast.list.filter(item => item.dt_txt.includes("12:00"));

    daily.forEach(day => {
        forecastContainer.innerHTML += `
            <div class="day-card glass">
                <h4>${day.dt_txt.substring(0, 10)}</h4>
                <p>${day.weather[0].main}</p>
                <p>${day.main.temp}°C</p>
            </div>
        `;
    });
}

/* ======================================================
   WEATHER-BASED BACKGROUND SYSTEM
   Uses CSS classes + JS animations
   ====================================================== */
function updateBackground(weather) {
    const type = weather.weather[0].main.toLowerCase();

    // Remove previous weather class
    document.body.className = "";

    if (type.includes("rain")) {
        document.body.classList.add("rain-bg");
        startRainAnimation();
    }
    else if (type.includes("snow")) {
        document.body.classList.add("snow-bg");
        startSnowAnimation();
    }
    else if (type.includes("cloud")) {
        document.body.classList.add("cloud-bg");
        startCloudAnimation();
    }
    else if (type.includes("clear")) {
        document.body.classList.add("sunny-bg");
        startSunnyAnimation();
    }
    else {
        document.body.classList.add("night-bg");
        startNightAnimation();
    }
}

/* ======================================================
   RAIN ANIMATION (Moderate Level)
   Creates raindrop elements dynamically
   ====================================================== */
function startRainAnimation() {
    clearAnimations(); // remove old animations

    for (let i = 0; i < 40; i++) {
        const drop = document.createElement("div");
        drop.classList.add("raindrop");
        drop.style.left = Math.random() * 100 + "vw";
        drop.style.animationDuration = (0.5 + Math.random()) + "s";
        document.body.appendChild(drop);
    }
}

/* ======================================================
   SNOW ANIMATION (Moderate Level)
   Creates floating snowflakes
   ====================================================== */
function startSnowAnimation() {
    clearAnimations();

    for (let i = 0; i < 30; i++) {
        const flake = document.createElement("div");
        flake.classList.add("snowflake");
        flake.style.left = Math.random() * 100 + "vw";
        flake.style.animationDuration = (2 + Math.random() * 3) + "s";
        document.body.appendChild(flake);
    }
}

/* ======================================================
   CLOUD MOVEMENT ANIMATION
   Adds drifting cloud layers
   ====================================================== */
function startCloudAnimation() {
    clearAnimations();
    const cloudLayer = document.createElement("div");
    cloudLayer.classList.add("cloud-layer");
    document.body.appendChild(cloudLayer);
}

/* ======================================================
   SUNNY ANIMATION (Glow + Rays)
   Adds subtle sun ray particle effect
   ====================================================== */
function startSunnyAnimation() {
    clearAnimations();
    const sun = document.createElement("div");
    sun.classList.add("sun-rays");
    document.body.appendChild(sun);
}

/* ======================================================
   NIGHT MODE ANIMATION
   Twinkling stars
   ====================================================== */
function startNightAnimation() {
    clearAnimations();

    for (let i = 0; i < 20; i++) {
        const star = document.createElement("div");
        star.classList.add("star");
        star.style.left = Math.random() * 100 + "vw";
        star.style.top = Math.random() * 40 + "vh";
        star.style.animationDuration = (1 + Math.random() * 2) + "s";
        document.body.appendChild(star);
    }
}

/* ======================================================
   CLEAR ALL PREVIOUS ANIMATION ELEMENTS
   Called before starting a new animation
   ====================================================== */
function clearAnimations() {
    document.querySelectorAll(".raindrop, .snowflake, .cloud-layer, .sun-rays, .star")
            .forEach(el => el.remove());
}

/* ======================================================
   SEARCH HISTORY (LOCAL STORAGE)
   Saves cities, avoids duplicates
   ====================================================== */
function addToHistory(city) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    if (!history.includes(city)) {
        history.push(city);
        localStorage.setItem("history", JSON.stringify(history));
    }

    showHistory();
}

/* ======================================================
   DISPLAY HISTORY AS BUTTONS
   Clicking a button fetches weather instantly
   ====================================================== */
function showHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    historyContainer.innerHTML = "";

    history.forEach(city => {
        historyContainer.innerHTML += `
            <button class="history-btn" onclick="getWeather('${city}')">${city}</button>
        `;
    });
}

/* ======================================================
   TEMPERATURE CHART (Chart.js)
   Shows next 24 hours (8 points)
   ====================================================== */
function updateChart(forecast) {
    const labels = forecast.list.slice(0, 8).map(item => item.dt_txt);
    const temps = forecast.list.slice(0, 8).map(item => item.main.temp);

    // Destroy old chart if exists
    if (window.tempChart) {
        window.tempChart.destroy();
    }

    const ctx = document.getElementById("tempChart").getContext("2d");

    // Create new chart
    window.tempChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Temperature (°C)",
                data: temps,
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
        }
    });
}

/* ======================================================
   SEARCH BUTTON EVENT LISTENER
   Triggers main weather fetch
   ====================================================== */
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
});

/* ======================================================
   LOAD HISTORY ON PAGE START
   ====================================================== */
showHistory();
