import React, { useState, useEffect, useRef } from 'react';
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
  const searchTimeoutRef = useRef({ start: null, end: null });

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

  // Fetch places from database on mount and refresh periodically
  useEffect(() => {
    fetchPlaces();
    
    // Refresh places every 30 seconds to catch new additions
    const interval = setInterval(() => {
      fetchPlaces();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-show suggestions when they update
  useEffect(() => {
    if (startSuggestions.length > 0) {
      // Always show suggestions when they exist
      setShowStartSuggestions(true);
    }
  }, [startSuggestions]);

  useEffect(() => {
    if (endSuggestions.length > 0) {
      // Always show suggestions when they exist
      setShowEndSuggestions(true);
    }
  }, [endSuggestions]);

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const placesArray = Array.isArray(data) ? data : [];
      setPlaces(placesArray);
      console.log(`NavigationPanel: Loaded ${placesArray.length} places from database`);
      
      // Debug: Log first few places to verify they're loaded correctly
      if (placesArray.length > 0) {
        console.log('Sample places loaded:', placesArray.slice(0, 5).map(p => ({
          name: p.name,
          category: p.category,
          coords: { lat: p.latitude, lng: p.longitude }
        })));
      } else {
        console.warn('⚠️ NavigationPanel: No places found in database! Make sure places are populated.');
      }
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
      //window.setNavLocation = null;
      window.setNavLocationType = null;
    };
    
    return () => {
      // Cleanup on unmount
      window.setNavLocation = null;
      window.setNavLocationType = null;
      // Clear any pending search timeouts
      if (searchTimeoutRef.current.start) clearTimeout(searchTimeoutRef.current.start);
      if (searchTimeoutRef.current.end) clearTimeout(searchTimeoutRef.current.end);
    };
  }, []);

  const handleLocationSearch = async (type, query) => {
    // If query is empty, show all local places (limited to top 20)
    if (!query || query.trim().length === 0) {
      if (places.length === 0) {
        console.warn('⚠️ NavigationPanel: Trying to show all places but none are loaded');
        // Try to refresh places
        fetchPlaces();
      }
      
      const allLocalPlaces = places.slice(0, 20).map(place => ({
        name: place.name,
        lng: place.longitude,
        lat: place.latitude,
        context: place.category ? `🏫 ${place.category.charAt(0).toUpperCase() + place.category.slice(1).replace('_', ' ')}` : 'College Place',
        isLocal: true,
        description: place.description || ''
      }));
      
      console.log(`NavigationPanel: Showing ${allLocalPlaces.length} places (empty query)`);
      
      if (type === 'start') {
        setStartSuggestions(allLocalPlaces);
        setShowStartSuggestions(allLocalPlaces.length > 0);
      } else {
        setEndSuggestions(allLocalPlaces);
        setShowEndSuggestions(allLocalPlaces.length > 0);
      }
      return;
    }

    const queryLower = query.toLowerCase().trim();
    
    // If query is too short, wait for more input
    if (queryLower.length < 1) {
      if (type === 'start') {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
      return;
    }

    const allSuggestions = [];

    // Enhanced search for local college places
    // Split query into words for better matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    
    // More lenient search for local college places - show more matches
    const localPlaceMatches = places.filter(place => {
      const nameLower = (place.name || '').toLowerCase();
      const descLower = (place.description || '').toLowerCase();
      const categoryLower = (place.category || '').toLowerCase().replace('_', ' ');
      
      // Match 1: All query words must be found somewhere (in name, description, or category)
      const allWordsMatch = queryWords.every(word => 
        nameLower.includes(word) || 
        descLower.includes(word) || 
        categoryLower.includes(word)
      );
      
      // Match 2: Exact substring match (full query appears anywhere)
      const exactMatch = nameLower.includes(queryLower) || 
                        descLower.includes(queryLower) ||
                        categoryLower.includes(queryLower);
      
      // Match 3: At least one word from query matches a word in name (partial match)
      const nameWords = nameLower.split(/\s+/);
      const wordMatch = queryWords.some(word => {
        return nameWords.some(nw => nw.startsWith(word) || nw.includes(word));
      });
      
      // Match 4: Character-by-character fuzzy match (for typos or partial words)
      // If query is at least 3 chars, check if any word in name starts with or contains query
      const fuzzyMatch = queryLower.length >= 3 && nameWords.some(nw => 
        nw.substring(0, queryLower.length) === queryLower ||
        nw.includes(queryLower.substring(0, Math.max(2, queryLower.length - 1)))
      );
      
      // Match if ANY of these conditions are true (more lenient)
      return allWordsMatch || exactMatch || wordMatch || fuzzyMatch;
    });
    
    // If no matches found and query is very short, show all places (user might be browsing)
    // This helps when user types something that doesn't match but wants to see options
    let placesToShow = localPlaceMatches;
    let isShowingAll = false;
    if (placesToShow.length === 0 && queryLower.length <= 3 && places.length > 0) {
      // Show all places when query is very short (1-3 chars) and no matches
      // This helps discover places even with partial typing
      placesToShow = places.slice(0, 15);
      isShowingAll = true;
      console.log(`NavigationPanel: No matches for "${queryLower}", showing all ${placesToShow.length} places for browsing`);
    }
    
    // Debug logging with more details
    if (placesToShow.length > 0) {
      console.log(`✅ NavigationPanel: Showing ${placesToShow.length} places for query "${queryLower}"`);
      console.log('Places to show:', placesToShow.slice(0, 5).map(p => p.name));
    } else {
      if (places.length === 0) {
        console.error('❌ NavigationPanel: No places loaded! Database might be empty. Check if places are populated.');
      } else {
        console.warn(`⚠️ NavigationPanel: No places to show for "${queryLower}" among ${places.length} places`);
        console.log('All place names in database:', places.map(p => p.name));
        console.log('Sample place data:', places.slice(0, 3).map(p => ({
          name: p.name,
          category: p.category,
          description: p.description?.substring(0, 30)
        })));
      }
    }
    
    const mappedMatches = placesToShow.map(place => ({
      name: place.name,
      lng: place.longitude,
      lat: place.latitude,
      context: place.category ? `🏫 ${place.category.charAt(0).toUpperCase() + place.category.slice(1).replace('_', ' ')}` : 'College Place',
      isLocal: true,
      description: place.description || '',
      // Add relevance score for sorting (higher = more relevant)
      relevance: calculateRelevance(place, queryLower, queryWords)
    }));
    
    const sortedMatches = mappedMatches
      .sort((a, b) => {
        // If no query or showing all places, sort alphabetically
        if (queryLower.length === 0 || isShowingAll) {
          return a.name.localeCompare(b.name);
        }
        // Otherwise sort by relevance
        return b.relevance - a.relevance;
      })
      .slice(0, 15); // Increase limit to show more places

    // Add local places first (prioritize them)
    allSuggestions.push(...sortedMatches);

    // DISABLED: Mapbox search - now using only database places
    // Uncomment below if you want to re-enable Mapbox search as fallback
    /*
    if (queryLower.length >= 2) {
      const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      if (token) {
        try {
          // First try with types restriction and bbox (more focused search)
          let apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&proximity=79.5328,17.9808&bbox=79.40,17.90,79.65,18.05&limit=10&types=poi,address,place`;
          
          let response = await fetch(apiUrl);
          let data = await response.json();
          
          // Check for API errors
          if (data.error || data.message) {
            console.error(`Mapbox API error for "${query}":`, data.error || data.message);
          }
          
          console.log(`NavigationPanel: Mapbox API (with types) returned ${data.features?.length || 0} features for "${query}"`);
          
          // If no results, try without types restriction (broader search)
          if (!data.features || data.features.length === 0) {
            console.log(`NavigationPanel: Trying Mapbox without types restriction for "${query}"`);
            apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&proximity=79.5328,17.9808&bbox=79.40,17.90,79.65,18.05&limit=10`;
            response = await fetch(apiUrl);
            data = await response.json();
            
            if (data.error || data.message) {
              console.error(`Mapbox API error (no types):`, data.error || data.message);
            }
            
            console.log(`NavigationPanel: Mapbox API (without types) returned ${data.features?.length || 0} features for "${query}"`);
          }
          
          // If still no results, try with just proximity (no bbox restriction)
          if (!data.features || data.features.length === 0) {
            console.log(`NavigationPanel: Trying Mapbox with only proximity for "${query}"`);
            apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&proximity=79.5328,17.9808&limit=10`;
            response = await fetch(apiUrl);
            data = await response.json();
            
            if (data.error || data.message) {
              console.error(`Mapbox API error (proximity only):`, data.error || data.message);
            }
            
            console.log(`NavigationPanel: Mapbox API (proximity only) returned ${data.features?.length || 0} features for "${query}"`);
          }
          
          // Don't search worldwide - only search within proximity/bbox area
          // If all restricted searches fail, just accept no results (better than showing global results)
          
          if (data.features && data.features.length > 0) {
            // Campus coordinates
            const campusLat = 17.9808;
            const campusLng = 79.5328;
            
            // Calculate distance from campus (in km)
            const calculateDistance = (lat1, lng1, lat2, lng2) => {
              const R = 6371; // Earth's radius in km
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLng = (lng2 - lng1) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                       Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              return R * c;
            };
            
            // Smarter filtering: Allow places with "street" in name if they're POIs
            // AND filter by distance to campus (only show places within reasonable distance)
            const mapboxSuggestions = data.features
              .filter(feature => {
                const placeType = feature.place_type || [];
                const placeName = (feature.place_name || '').toLowerCase();
                const [lng, lat] = feature.center || [];
                
                // Check distance from campus - only include places within 20km of campus
                // This prevents showing places from other countries or distant cities
                if (lat && lng) {
                  const distance = calculateDistance(campusLat, campusLng, lat, lng);
                  if (distance > 20) { // More than 20km away
                    console.log(`Filtering out distant place: ${feature.place_name} (${distance.toFixed(1)}km away)`);
                    return false;
                  }
                }
                
                // Check if it's a pure street/road (not a POI with street in name)
                const isPureStreet = placeType.some(type => 
                  type === 'street' || 
                  type === 'road' || 
                  type === 'route'
                );
                
                // But allow if it's a POI (Point of Interest) even if name has "street"
                const isPOI = placeType.includes('poi');
                const isLandmark = placeType.includes('landmark');
                const isPlace = placeType.includes('place');
                
                // Allow POIs, landmarks, and places even if name contains "street"
                // Only exclude pure street/road features
                if (isPureStreet && !isPOI && !isLandmark && !isPlace) {
                  console.log(`Filtering out pure street: ${feature.place_name} (types: ${placeType.join(', ')})`);
                  return false;
                }
                
                // Include everything else (POIs, landmarks, places, addresses) that's within range
                return true;
              })
              .map(feature => ({
                name: feature.place_name,
                lng: feature.center[0],
                lat: feature.center[1],
                context: feature.context ? feature.context.map(ctx => ctx.text).join(', ') : 'External Location',
                isLocal: false,
                placeTypes: feature.place_type || []
              }))
              .slice(0, 8); // Increased limit to show more results
            
            // Add Mapbox results after local places (but always show them)
            if (mapboxSuggestions.length > 0) {
              allSuggestions.push(...mapboxSuggestions);
              console.log(`✅ NavigationPanel: Added ${mapboxSuggestions.length} Mapbox results:`, mapboxSuggestions.map(s => s.name));
            } else {
              console.log(`⚠️ NavigationPanel: All Mapbox results were filtered out`);
            }
          } else {
            console.log(`NavigationPanel: Mapbox returned empty results for "${query}"`);
          }
        } catch (error) {
          console.error('Error searching Mapbox location:', error);
          // Continue with local places even if Mapbox fails
        }
      }
    }
    */

    // Update suggestions
    if (type === 'start') {
      setStartSuggestions(allSuggestions);
      // Always show dropdown if we have suggestions
      if (allSuggestions.length > 0) {
        setShowStartSuggestions(true);
      }
      console.log(`NavigationPanel: Updated start suggestions - ${allSuggestions.length} items, show=${allSuggestions.length > 0}`);
    } else {
      setEndSuggestions(allSuggestions);
      // Always show dropdown if we have suggestions
      if (allSuggestions.length > 0) {
        setShowEndSuggestions(true);
      }
      console.log(`NavigationPanel: Updated end suggestions - ${allSuggestions.length} items, show=${allSuggestions.length > 0}`);
    }
  };

  // Calculate relevance score for better sorting
  const calculateRelevance = (place, queryLower, queryWords) => {
    const nameLower = (place.name || '').toLowerCase();
    const descLower = (place.description || '').toLowerCase();
    let score = 0;
    
    // Exact name match gets highest score
    if (nameLower === queryLower) score += 100;
    // Name starts with query
    else if (nameLower.startsWith(queryLower)) score += 50;
    // Name contains query
    else if (nameLower.includes(queryLower)) score += 30;
    
    // Word matches in name
    queryWords.forEach(word => {
      const nameWords = nameLower.split(/\s+/);
      if (nameWords.some(nw => nw === word)) score += 20;
      else if (nameWords.some(nw => nw.startsWith(word))) score += 15;
      else if (nameWords.some(nw => nw.includes(word))) score += 10;
    });
    
    // Description match (lower weight)
    if (descLower.includes(queryLower)) score += 5;
    
    return score;
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
                
                // Clear previous timeout
                if (searchTimeoutRef.current.start) {
                  clearTimeout(searchTimeoutRef.current.start);
                }
                
                // Debounce search
                searchTimeoutRef.current.start = setTimeout(() => {
                  handleLocationSearch('start', val);
                }, 200);
                
                // Show suggestions immediately if query is empty (to show all places)
                if (!val.trim()) {
                  handleLocationSearch('start', val);
                }
              }}
              onFocus={() => {
                // Show all places when focusing on empty input
                if (!startLocation.name.trim()) {
                  handleLocationSearch('start', '');
                }
                // Show suggestions if we have any (don't wait for async search)
                if (startSuggestions.length > 0) {
                  setShowStartSuggestions(true);
                }
                // Also set a timeout to show suggestions after search completes
                setTimeout(() => {
                  if (startSuggestions.length > 0) {
                    setShowStartSuggestions(true);
                  }
                }, 300);
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
              <div className="suggestions-dropdown" style={{ zIndex: 1000 }}>
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
                
                // Clear previous timeout
                if (searchTimeoutRef.current.end) {
                  clearTimeout(searchTimeoutRef.current.end);
                }
                
                // Debounce search
                searchTimeoutRef.current.end = setTimeout(() => {
                  handleLocationSearch('end', val);
                }, 200);
                
                // Show suggestions immediately if query is empty (to show all places)
                if (!val.trim()) {
                  handleLocationSearch('end', val);
                }
              }}
              onFocus={() => {
                // Show all places when focusing on empty input
                if (!endLocation.name.trim()) {
                  handleLocationSearch('end', '');
                }
                // Show suggestions if we have any (don't wait for async search)
                if (endSuggestions.length > 0) {
                  setShowEndSuggestions(true);
                }
                // Also set a timeout to show suggestions after search completes
                setTimeout(() => {
                  if (endSuggestions.length > 0) {
                    setShowEndSuggestions(true);
                  }
                }, 300);
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
              <div className="suggestions-dropdown" style={{ zIndex: 1000 }}>
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

