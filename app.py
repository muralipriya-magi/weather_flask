import os
from flask import Flask, render_template, request, session, redirect, url_for, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables from .env file (API key & secret key)
load_dotenv()

app = Flask(__name__)

# Read API key and secret key from environment variables
API_KEY = os.getenv("OPENWEATHER_API_KEY")
app.secret_key = os.getenv("FLASK_SECRET_KEY")

# If keys are missing, stop the app
if not API_KEY or not app.secret_key:
    raise ValueError("OPENWEATHER_API_KEY or FLASK_SECRET_KEY not set")

# ----------------------------------------------------
# Helper: Get current weather data (RAW JSON response)
# ----------------------------------------------------
def get_weather_raw(city):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    r = requests.get(url)
    # Only return JSON if status is 200 OK
    return r.json() if r.status_code == 200 else None

# ----------------------------------------------------
# Helper: Get 5-day forecast (RAW JSON response)
# ----------------------------------------------------
def get_forecast_raw(city):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    r = requests.get(url)
    return r.json() if r.status_code == 200 else None

# ----------------------------------------------------
# Helper: Auto-detect user's city using IP address
# ----------------------------------------------------
def auto_location_city():
    try:
        ip_data = requests.get("https://ipapi.co/json/").json()
        # If city not found, fallback to Chennai
        return ip_data.get("city") or "Chennai"
    except:
        return "Chennai"

# ----------------------------------------------------
# Helper: Convert RAW weather JSON → clean dictionary
# ----------------------------------------------------
def summarize_current(data):
    main = data.get("main", {})
    sys = data.get("sys", {})
    weather = data.get("weather", [{}])[0]

    # Return a clean dictionary with only required fields
    return {
        "city": data.get("name"),
        "country": sys.get("country"),
        "temp": main.get("temp"),
        "feels_like": main.get("feels_like"),
        "humidity": main.get("humidity"),
        "pressure": main.get("pressure"),
        "visibility": data.get("visibility"),
        "wind_speed": data.get("wind", {}).get("speed"),
        "description": weather.get("description", "").title(),
        "icon": weather.get("icon"),
        "main": weather.get("main")
    }

# ----------------------------------------------------
# Helper: Convert 5-day forecast RAW JSON → group by day
# ----------------------------------------------------
def summarize_forecast(forecast_raw):
    daily = {}  # dictionary to group forecast by date

    for item in forecast_raw.get("list", []):
        dt_txt = item.get("dt_txt")  # example: "2024-12-11 12:00:00"
        date = dt_txt.split(" ")[0]  # get only the date part
        temp = item["main"]["temp"]
        weather = item["weather"][0]

        entry = {
            "dt": dt_txt,
            "temp": temp,
            "icon": weather.get("icon"),
            "main": weather.get("main"),
            "desc": weather.get("description").title()
        }

        # If date is new, create new entry
        if date not in daily:
            daily[date] = {"temps": [], "entries": []}

        # Store temperature and full entry
        daily[date]["temps"].append(temp)
        daily[date]["entries"].append(entry)

    # Final output list (only 5 days)
    out = []
    for d in sorted(daily.keys())[:5]:
        temps = daily[d]["temps"]
        entries = daily[d]["entries"]
        out.append({
            "date": d,
            "min": round(min(temps), 1),
            "max": round(max(temps), 1),
            "entries": entries
        })
    return out

# ----------------------------------------------------
# MAIN ROUTE: Home page (search weather + show results)
# ----------------------------------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    # Create search history list if not exists
    if "history" not in session:
        session["history"] = []

    # POST → user typed a city
    # GET → auto-detect city
    city = request.form.get("city") if request.method == "POST" else auto_location_city()

    # Get weather & forecast raw data
    cur_raw = get_weather_raw(city)
    f_raw = get_forecast_raw(city) if cur_raw else None

    # Convert raw data → clean dictionary
    current = summarize_current(cur_raw) if cur_raw else None
    forecast = summarize_forecast(f_raw) if f_raw else []

    # Manage search history (store last 5)
    history = session.get("history", [])
    if city:
        if city in history:
            history.remove(city)  # remove duplicate
        history.insert(0, city)  # add to top
        session["history"] = history[:5]

    return render_template("index.html",
                           current=current,
                           forecast=forecast,
                           history=session.get("history", []),
                           favorites=session.get("fav", []))

# ----------------------------------------------------
# Favorites Page: show saved favorite cities
# ----------------------------------------------------
@app.route("/favorites", methods=["GET", "POST"])
def favorites():
    # Initialize favorites list
    if "fav" not in session:
        session["fav"] = []

    # If user clicked "Add to favorites"
    if request.method == "POST":
        city = request.form.get("city")
        if city and city not in session["fav"]:
            session["fav"].append(city)

    # Prepare weather data for each favorite city
    favs = []
    for c in session["fav"]:
        raw = get_weather_raw(c)
        if raw:
            favs.append(summarize_current(raw))

    return render_template("favorites.html", favs=favs)

# ----------------------------------------------------
# Add city to favorites (POST)
# ----------------------------------------------------
@app.route("/fav/add", methods=["POST"])
def add_fav():
    city = request.form.get("city")
    if not city:
        return redirect(url_for("index"))

    fav = session.get("fav", [])
    if city not in fav:
        fav.append(city)
        session["fav"] = fav

    return redirect(url_for("index"))

# ----------------------------------------------------
# Remove city from favorites
# ----------------------------------------------------
@app.route("/fav/remove/<city>")
def remove_fav(city):
    fav = session.get("fav", [])
    if city in fav:
        fav.remove(city)
        session["fav"] = fav
    return redirect(url_for("favorites"))

# ----------------------------------------------------
# Run Flask app
# ----------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
