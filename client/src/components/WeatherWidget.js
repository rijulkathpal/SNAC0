import React, { useState, useEffect } from 'react';

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
    <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-base font-semibold text-gray-800 m-0">🌤️ Weather</h4>
        <button 
          onClick={fetchWeather} 
          disabled={loading}
          className="text-lg hover:rotate-180 transition-transform duration-500 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer"
        >
          🔄
        </button>
      </div>
      {loading && <div className="text-center py-4 text-gray-600">Loading...</div>}
      {error && <div className="text-center py-2 text-red-600 text-sm">{error}</div>}
      {weather && !loading && (
        <div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {Math.round(weather.temp)}°C
          </div>
          <div className="text-sm text-gray-700 mb-3 capitalize">
            {weather.description}
          </div>
          <div className="space-y-1 text-xs text-gray-600">
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

