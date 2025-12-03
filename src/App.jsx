import { useState } from 'react'
import './App.css'

const API_KEY = '823978c650842f346e8ac2de5d3239c9';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [units, setUnits] = useState('metric'); // 'metric' or 'imperial'

  const unitSymbol = units === 'metric' ? '°C' : '°F';

  const fetchWeather = async (eOrCoords) => {
    // eOrCoords can be an event (from form) or an object { lat, lon }
    if (eOrCoords && eOrCoords.preventDefault) eOrCoords.preventDefault();

    // If called from form without a city, do nothing
    if (!city && !(eOrCoords && eOrCoords.lat)) return;

    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast(null);

    try {
      let weatherUrl = '';
      let forecastUrl = '';

      if (eOrCoords && eOrCoords.lat != null) {
        const { lat, lon } = eOrCoords;
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;
      } else {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${units}`;
      }

      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) throw new Error('City not found');
      const weatherData = await weatherResponse.json();
      setWeather(weatherData);

      const forecastResponse = await fetch(forecastUrl);
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        const dailyForecast = forecastData.list.filter(reading => reading.dt_txt.includes('12:00:00'));
        setForecast(dailyForecast);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        setLoading(false);
        setError('Unable to retrieve your location');
      }
    );
  };

  const toggleUnits = (u) => {
    if (u === units) return;
    setUnits(u);
    // If we already have a city/weather displayed, refetch with new units
    if (weather) {
      // If weather has coord, use coords for more precise result
      const coords = weather.coord ? { lat: weather.coord.lat, lon: weather.coord.lon } : null;
      if (coords) fetchWeather(coords);
      else fetchWeather({ preventDefault: () => {} });
    }
  };

  const formatDate = (dt) => {
    return new Date(dt * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dt) => {
    return new Date(dt * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="app-container">
      <div className="weather-card">
        <div className="header-row">
          <h1 className="app-title">Weather Forecast</h1>
          <div className="controls">
            <div className="unit-toggle" role="group" aria-label="Temperature units">
              <button type="button" className={`unit-btn ${units === 'metric' ? 'active' : ''}`} onClick={() => toggleUnits('metric')}>°C</button>
              <button type="button" className={`unit-btn ${units === 'imperial' ? 'active' : ''}`} onClick={() => toggleUnits('imperial')}>°F</button>
            </div>
            <button type="button" className="loc-btn" title="Use my location" onClick={useMyLocation}>📍</button>
          </div>
        </div>

        <form onSubmit={fetchWeather} className="search-form">
          <div className="search-input-wrap">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {weather && (
          <div className="weather-content">
            <div className="current-weather">
              <div className="weather-header">
                <div>
                  <h2 className="city-name">
                    {weather.name}, {weather.sys.country}
                  </h2>
                  <p className="date">{formatDate(weather.dt)}</p>
                </div>
                <div className="weather-icon-large">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                    alt={weather.weather[0].description} 
                  />
                </div>
              </div>
              
              <div className="main-temp">
                <span className="temp-value">{Math.round(weather.main.temp)}{unitSymbol}</span>
                <div className="temp-details">
                  <p className="description">{weather.weather[0].description}</p>
                  <p>Feels like {Math.round(weather.main.feels_like)}{unitSymbol}</p>
                </div>
              </div>
              
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{weather.main.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Wind</span>
                  <span className="value">{weather.wind.speed} {units === 'metric' ? 'm/s' : 'mph'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Pressure</span>
                  <span className="value">{weather.main.pressure} hPa</span>
                </div>
                <div className="detail-item">
                  <span className="label">Sunrise</span>
                  <span className="value">{formatTime(weather.sys.sunrise)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Sunset</span>
                  <span className="value">{formatTime(weather.sys.sunset)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Visibility</span>
                  <span className="value">{(weather.visibility / 1000).toFixed(1)} km</span>
                </div>
              </div>
            </div>

            {forecast && forecast.length > 0 && (
              <div className="forecast-section">
                <h3>5-Day Forecast</h3>
                <div className="forecast-list">
                  {forecast.map((day) => (
                    <div key={day.dt} className="forecast-item">
                      <p className="forecast-day">
                        {new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <img 
                        src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} 
                        alt={day.weather[0].description} 
                      />
                      <p className="forecast-temp">{Math.round(day.main.temp)}{unitSymbol}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
