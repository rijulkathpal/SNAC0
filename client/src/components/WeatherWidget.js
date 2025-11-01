import React, { useState, useEffect } from 'react';
import './WeatherWidget.css';

const WeatherWidget = ({ latitude, longitude }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/weather?lat=${latitude}&lng=${longitude}`
      );
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setWeather(data);
      }
    } catch (err) {
      setError('Failed to load weather');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!latitude || !longitude) return null;

  return (
    <div className="weather-widget">
      <div className="weather-header">
        <h4>🌤️ Weather</h4>
        <button onClick={fetchWeather} disabled={loading} className="weather-refresh">
          🔄
        </button>
      </div>
      {loading && <div className="weather-loading">Loading...</div>}
      {error && <div className="weather-error">{error}</div>}
      {weather && !loading && (
        <div className="weather-content">
          <div className="weather-temp">
            {Math.round(weather.temp)}°C
          </div>
          <div className="weather-description">
            {weather.description}
          </div>
          <div className="weather-details">
            <div>Feels like: {Math.round(weather.feelsLike)}°C</div>
            <div>Humidity: {weather.humidity}%</div>
            <div>Wind: {weather.windSpeed} m/s</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;

