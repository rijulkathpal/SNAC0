import React, { useState, useEffect } from 'react';
import './NavigationPanel.css';

const NavigationPanel = ({ onRouteCalculate, onClear }) => {
  const [startLocation, setStartLocation] = useState({ name: '', lng: null, lat: null });
  const [endLocation, setEndLocation] = useState({ name: '', lng: null, lat: null });
  const [profile, setProfile] = useState('driving'); // driving, walking, cycling
  const [isSettingStart, setIsSettingStart] = useState(false);
  const [isSettingEnd, setIsSettingEnd] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [places, setPlaces] = useState([]); // Local college places from database

  const handleCalculateRoute = () => {
    if (!startLocation.lng || !startLocation.lat || !endLocation.lng || !endLocation.lat) {
      alert('Please set both start and end locations');
      return;
    }

    onRouteCalculate({
      start: { ...startLocation },
      end: { ...endLocation },
      profile: profile
    });
  };

  const handleClear = () => {
    setStartLocation({ name: '', lng: null, lat: null });
    setEndLocation({ name: '', lng: null, lat: null });
    onClear();
  };

  const handleSetFromMap = (type) => {
    console.log('Setting navigation mode:', type);
    
    if (type === 'start') {
      setIsSettingStart(true);
      setIsSettingEnd(false);
      window.setNavLocationType = 'start';
      console.log('Navigation mode set to START - click on map or place markers');
    } else {
      setIsSettingEnd(true);
      setIsSettingStart(false);
      window.setNavLocationType = 'end';
      console.log('Navigation mode set to END - click on map or place markers');
    }
    
    // Ensure the handler exists
    if (!window.setNavLocation) {
      console.warn('setNavLocation handler not found, it should be set by useEffect');
    }
  };

  // Fetch places from database on mount
  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places`);
      const data = await response.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    }
  };

  // This will be called from MapComponent when user clicks map or place markers
  React.useEffect(() => {
    window.setNavLocation = (lng, lat, name = '') => {
      const type = window.setNavLocationType;
      console.log('Setting navigation location:', { type, lng, lat, name }); // Debug log
      
      if (type === 'start') {
        setStartLocation({ name: name || 'Start Location', lng, lat });
        setIsSettingStart(false);
        console.log('Start location set:', { name: name || 'Start Location', lng, lat });
      } else if (type === 'end') {
        setEndLocation({ name: name || 'End Location', lng, lat });
        setIsSettingEnd(false);
        console.log('End location set:', { name: name || 'End Location', lng, lat });
      } else {
        console.warn('No navigation type set, but setNavLocation was called');
      }
      
      // Clear navigation mode
      window.setNavLocation = null;
      window.setNavLocationType = null;
    };
    
    return () => {
      // Cleanup on unmount
      window.setNavLocation = null;
      window.setNavLocationType = null;
    };
  }, []);

  const handleLocationSearch = async (type, query) => {
    if (!query || query.length < 2) {
      if (type === 'start') {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
      return;
    }

    const queryLower = query.toLowerCase().trim();
    const allSuggestions = [];

    // First, search local college places from database
    const localPlaceMatches = places.filter(place => {
      const nameMatch = place.name.toLowerCase().includes(queryLower);
      const descMatch = place.description && place.description.toLowerCase().includes(queryLower);
      return nameMatch || descMatch;
    }).map(place => ({
      name: place.name,
      lng: place.longitude,
      lat: place.latitude,
      context: place.category ? `🏫 ${place.category.charAt(0).toUpperCase() + place.category.slice(1).replace('_', ' ')}` : 'College Place',
      isLocal: true, // Mark as local place
      description: place.description || ''
    }));

    // Add local places first (prioritize them)
    allSuggestions.push(...localPlaceMatches);

    // Then search Mapbox for external locations
    const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    if (token) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&proximity=79.5300,17.9833&bbox=79.40,17.90,79.65,18.05&limit=5`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const mapboxSuggestions = data.features.map(feature => ({
            name: feature.place_name,
            lng: feature.center[0],
            lat: feature.center[1],
            context: feature.context ? feature.context.map(ctx => ctx.text).join(', ') : 'External Location',
            isLocal: false // Mark as external
          }));
          
          // Add Mapbox results after local places
          allSuggestions.push(...mapboxSuggestions);
        }
      } catch (error) {
        console.error('Error searching Mapbox location:', error);
        // Continue with local places even if Mapbox fails
      }
    }

    // Update suggestions
    if (type === 'start') {
      setStartSuggestions(allSuggestions);
      setShowStartSuggestions(allSuggestions.length > 0);
    } else {
      setEndSuggestions(allSuggestions);
      setShowEndSuggestions(allSuggestions.length > 0);
    }
  };

  const handleSelectSuggestion = (type, suggestion) => {
    const location = {
      name: suggestion.name,
      lng: suggestion.lng,
      lat: suggestion.lat
    };
    
    if (type === 'start') {
      setStartLocation(location);
      setShowStartSuggestions(false);
      setStartSuggestions([]);
    } else {
      setEndLocation(location);
      setShowEndSuggestions(false);
      setEndSuggestions([]);
    }
  };

  return (
    <div className="navigation-panel">
      <h3>📍 Navigation</h3>
      
      <div className="nav-form">
        <div className="nav-input-group">
          <label>Start Location</label>
          <div className="nav-input-row" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search or click on map..."
              value={startLocation.name}
              onChange={(e) => {
                const val = e.target.value;
                setStartLocation(prev => ({ ...prev, name: val }));
                handleLocationSearch('start', val);
              }}
              onFocus={() => {
                if (startSuggestions.length > 0) {
                  setShowStartSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow suggestion click
                setTimeout(() => setShowStartSuggestions(false), 200);
              }}
            />
            <button
              className={`btn-set-location ${isSettingStart ? 'active' : ''}`}
              onClick={() => handleSetFromMap('start')}
              title="Click on map to set start"
            >
              🖱️
            </button>
            {showStartSuggestions && startSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {startSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`suggestion-item ${suggestion.isLocal ? 'local-place' : ''}`}
                    onClick={() => handleSelectSuggestion('start', suggestion)}
                  >
                    <div className="suggestion-name">
                      {suggestion.isLocal && '🏫 '}
                      {suggestion.name}
                    </div>
                    {suggestion.context && (
                      <div className="suggestion-context">{suggestion.context}</div>
                    )}
                    {suggestion.description && (
                      <div className="suggestion-desc">{suggestion.description.substring(0, 60)}...</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {startLocation.lng && (
            <div className="location-coords">
              {startLocation.lat.toFixed(4)}, {startLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        <div className="nav-input-group">
          <label>End Location</label>
          <div className="nav-input-row" style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search or click on map..."
              value={endLocation.name}
              onChange={(e) => {
                const val = e.target.value;
                setEndLocation(prev => ({ ...prev, name: val }));
                handleLocationSearch('end', val);
              }}
              onFocus={() => {
                if (endSuggestions.length > 0) {
                  setShowEndSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay to allow suggestion click
                setTimeout(() => setShowEndSuggestions(false), 200);
              }}
            />
            <button
              className={`btn-set-location ${isSettingEnd ? 'active' : ''}`}
              onClick={() => handleSetFromMap('end')}
              title="Click on map to set end"
            >
              🖱️
            </button>
            {showEndSuggestions && endSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {endSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`suggestion-item ${suggestion.isLocal ? 'local-place' : ''}`}
                    onClick={() => handleSelectSuggestion('end', suggestion)}
                  >
                    <div className="suggestion-name">
                      {suggestion.isLocal && '🏫 '}
                      {suggestion.name}
                    </div>
                    {suggestion.context && (
                      <div className="suggestion-context">{suggestion.context}</div>
                    )}
                    {suggestion.description && (
                      <div className="suggestion-desc">{suggestion.description.substring(0, 60)}...</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {endLocation.lng && (
            <div className="location-coords">
              {endLocation.lat.toFixed(4)}, {endLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        <div className="nav-input-group">
          <label>Travel Mode</label>
          <select value={profile} onChange={(e) => setProfile(e.target.value)}>
            <option value="driving">🚗 Driving</option>
            <option value="walking">🚶 Walking</option>
            <option value="cycling">🚴 Cycling</option>
          </select>
        </div>

        <div className="nav-actions">
          <button className="btn-calculate" onClick={handleCalculateRoute}>
            Get Directions
          </button>
          <button className="btn-clear" onClick={handleClear}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;

