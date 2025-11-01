import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const MapComponent = ({ 
  routes, 
  selectedRoute, 
  onRouteSelect, 
  isDrawingMode = false, 
  onMapClick = null,
  navigationRoute = null,
  onNavigationClear = null,
  isSettingNavLocation = null,
  places = [],
  onPlaceSelect = null
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [navInfo, setNavInfo] = useState(null);
  const markersRef = useRef([]);
  const routeLinesRef = useRef([]);
  const navMarkersRef = useRef([]);
  const placeMarkersRef = useRef([]);
  const navRouteLayerRef = useRef(null);
  const mapClickHandlerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const customSearchContainerRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    const mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken || mapboxToken === 'paste_your_mapbox_api_key_here') {
      const errorMsg = 'Mapbox access token is not set! Please add REACT_APP_MAPBOX_ACCESS_TOKEN to your .env file and restart the app.';
      console.error(errorMsg);
      setMapError(errorMsg);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    if (!map.current && mapContainer.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/akshay-vishnu/cmhftdgs7008601pj1wv26l94',
          center: [79.5300, 17.9833], // NIT Warangal coordinates (longitude, latitude)
          zoom: 15
        });

        // Create custom search control container
        const customSearchContainer = document.createElement('div');
        customSearchContainer.className = 'custom-map-search';
        customSearchContainer.style.position = 'absolute';
        customSearchContainer.style.top = '10px';
        customSearchContainer.style.left = '10px';
        customSearchContainer.style.zIndex = '1000';
        customSearchContainer.style.width = '400px';
        customSearchContainer.style.maxWidth = '90vw';
        mapContainer.current.appendChild(customSearchContainer);
        customSearchContainerRef.current = customSearchContainer;

        // Store geocoder reference for later use (for Mapbox searches)
        geocoderRef.current = {
          accessToken: mapboxToken,
          searchMapbox: async (query) => {
            try {
              const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&proximity=79.5300,17.9833&bbox=79.40,17.90,79.65,18.05&limit=5`
              );
              const data = await response.json();
              return data.features || [];
            } catch (error) {
              console.error('Mapbox search error:', error);
              return [];
            }
          }
        };

        map.current.on('load', () => {
          setMapLoaded(true);
          setMapError(null);
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Failed to load map. Please check your Mapbox API key and restart the app.');
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error initializing map. Please check the browser console for details.');
      }
    }

    return () => {
      if (customSearchContainerRef.current) {
        try {
          customSearchContainerRef.current.remove();
        } catch (error) {
          console.warn('Error removing search container:', error);
        }
      }
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        map.current = null;
      }
    };
  }, []);

  // Handle map search - combine local places and Mapbox results
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchSuggestions([]);
        setShowSearchSuggestions(false);
        return;
      }

      const queryLower = searchQuery.toLowerCase().trim();
      const allSuggestions = [];

      // Search local places first
      const localPlaceMatches = places.filter(place => {
        const nameMatch = place.name.toLowerCase().includes(queryLower);
        const descMatch = place.description && place.description.toLowerCase().includes(queryLower);
        return nameMatch || descMatch;
      }).map(place => ({
        name: place.name,
        lng: place.longitude,
        lat: place.latitude,
        context: place.category ? `🏫 ${place.category.charAt(0).toUpperCase() + place.category.slice(1).replace('_', ' ')}` : 'College Place',
        isLocal: true,
        description: place.description || ''
      }));

      allSuggestions.push(...localPlaceMatches);

      // Then search Mapbox
      if (geocoderRef.current && geocoderRef.current.searchMapbox) {
        try {
          const mapboxResults = await geocoderRef.current.searchMapbox(searchQuery);
          const mapboxSuggestions = mapboxResults.map(feature => ({
            name: feature.place_name,
            lng: feature.center[0],
            lat: feature.center[1],
            context: feature.context ? feature.context.map(ctx => ctx.text).join(', ') : 'External Location',
            isLocal: false
          }));
          allSuggestions.push(...mapboxSuggestions);
        } catch (error) {
          console.error('Error in Mapbox search:', error);
        }
      }

      setSearchSuggestions(allSuggestions);
      setShowSearchSuggestions(allSuggestions.length > 0);
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, places]);

  // Handle search result selection
  const handleSearchSelect = useCallback((suggestion) => {
    const { lng, lat, name } = suggestion;
    
    // If navigation mode is active, set the location
    if (window.setNavLocationType && window.setNavLocation) {
      window.setNavLocation(lng, lat, name);
      window.setNavLocationType = null;
    }

    // Fly to the location
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        duration: 1500
      });

      // Create a temporary marker
      const el = document.createElement('div');
      el.className = 'search-result-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#667eea';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${name}</strong>`))
        .addTo(map.current);

      // Remove marker after 3 seconds
      setTimeout(() => marker.remove(), 3000);
    }

    // Clear search
    setSearchQuery('');
    setShowSearchSuggestions(false);
  }, []);

  // Render custom search UI with suggestions
  useEffect(() => {
    if (!customSearchContainerRef.current || !mapLoaded) return;

    const container = customSearchContainerRef.current;
    const suggestionsHTML = showSearchSuggestions && searchSuggestions.length > 0 ? `
      <div id="map-search-suggestions" style="
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 4px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        max-height: 300px;
        overflow-y: auto;
      ">
        ${searchSuggestions.map((suggestion, idx) => `
          <div 
            class="map-suggestion-item ${suggestion.isLocal ? 'local-place' : ''}"
            data-index="${idx}"
            style="
              padding: 0.75rem;
              cursor: pointer;
              border-bottom: 1px solid #f0f0f0;
              transition: background-color 0.2s;
              ${suggestion.isLocal ? 'background-color: #f0f7ff; border-left: 3px solid #667eea;' : ''}
            "
            onmouseover="this.style.backgroundColor='${suggestion.isLocal ? '#e0efff' : '#f5f5f5'}'"
            onmouseout="this.style.backgroundColor='${suggestion.isLocal ? '#f0f7ff' : 'white'}'"
          >
            <div style="font-size: 0.9rem; font-weight: ${suggestion.isLocal ? '600' : '500'}; color: ${suggestion.isLocal ? '#667eea' : '#333'}; margin-bottom: 0.25rem;">
              ${suggestion.isLocal ? '🏫 ' : ''}${suggestion.name}
            </div>
            ${suggestion.context ? `<div style="font-size: 0.75rem; color: #666; font-style: italic;">${suggestion.context}</div>` : ''}
            ${suggestion.description ? `<div style="font-size: 0.75rem; color: #888; margin-top: 0.25rem;">${suggestion.description.substring(0, 60)}...</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    container.innerHTML = `
      <div style="position: relative; width: 100%;">
        <input
          type="text"
          id="map-search-input"
          placeholder="🔍 Search for places on campus..."
          style="width: 100%; padding: 10px 15px; font-size: 14px; border: 2px solid #ddd; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); outline: none; transition: border-color 0.2s;"
          value="${searchQuery}"
        />
        ${suggestionsHTML}
      </div>
    `;

    const input = container.querySelector('#map-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        setSearchQuery(e.target.value);
      });
      input.addEventListener('focus', () => {
        if (searchSuggestions.length > 0) {
          setShowSearchSuggestions(true);
        }
      });
      input.addEventListener('blur', () => {
        setTimeout(() => setShowSearchSuggestions(false), 200);
      });
      input.addEventListener('focus', () => {
        input.style.borderColor = '#667eea';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#ddd';
      });
    }

    // Add click handlers for suggestions using event delegation
    const suggestionsContainer = container.querySelector('#map-search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.map-suggestion-item');
        if (item) {
          const idx = parseInt(item.getAttribute('data-index'));
          if (idx >= 0 && idx < searchSuggestions.length) {
            handleSearchSelect(searchSuggestions[idx]);
          }
        }
      });
    }
  }, [mapLoaded, searchQuery, searchSuggestions, showSearchSuggestions, handleSearchSelect]);

  // Handle map click for drawing mode or navigation location setting
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMapClick = (e) => {
      // Prevent click on geocoder control, popups, or other UI elements
      if (e.originalEvent) {
        const target = e.originalEvent.target;
        if (target.closest && (
          target.closest('.mapboxgl-ctrl-geocoder') ||
          target.closest('.mapboxgl-popup') ||
          target.closest('.mapboxgl-ctrl') ||
          target.closest('.place-marker') ||
          target.closest('.custom-map-search')
        )) {
          return;
        }
      }

      const { lng, lat } = e.lngLat;
      
      // Check for navigation mode first
      if (window.setNavLocationType && window.setNavLocation) {
        console.log('Map clicked for navigation:', { type: window.setNavLocationType, lng, lat });
        window.setNavLocation(lng, lat);
        // Don't clear here - let the NavigationPanel handle it
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
        return;
      }
      
      // Check for drawing mode
      if (isDrawingMode && onMapClick) {
        onMapClick(lng, lat);
      }
    };

    // Always attach the handler, but only enable cursor in specific modes
    map.current.on('click', handleMapClick);
    mapClickHandlerRef.current = handleMapClick;

    // Update cursor based on current mode
    const updateCursor = () => {
      if (!map.current) return;
      const isNavMode = window.setNavLocationType !== undefined && window.setNavLocationType !== null;
      const isDrawMode = isDrawingMode && onMapClick;
      map.current.getCanvas().style.cursor = (isNavMode || isDrawMode) ? 'crosshair' : '';
    };

    updateCursor();
    const cursorInterval = setInterval(updateCursor, 200);

    return () => {
      clearInterval(cursorInterval);
      if (map.current && mapClickHandlerRef.current) {
        map.current.off('click', mapClickHandlerRef.current);
        map.current.getCanvas().style.cursor = '';
        mapClickHandlerRef.current = null;
      }
    };
  }, [isDrawingMode, onMapClick, mapLoaded]);

  // Clear existing markers and routes
  const clearMap = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (map.current && map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route-line');
    }
    routeLinesRef.current = [];
  };

  // Display places on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear previous place markers
    placeMarkersRef.current.forEach(marker => marker.remove());
    placeMarkersRef.current = [];

    const safePlaces = Array.isArray(places) ? places : [];
    
    safePlaces.forEach((place) => {
      const categoryIcons = {
        eateries: '🍽️',
        recreation: '⚽',
        educational: '📚',
        administration: '🏛️',
        staff_quarters: '🏠',
        hostel: '🏘️',
        library: '📖',
        other: '📍'
      };

      const el = document.createElement('div');
      el.style.fontSize = '24px';
      el.style.cursor = 'pointer';
      el.innerHTML = `<div style="font-size: 24px;">${categoryIcons[place.category] || '📍'}</div>`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<strong>${place.name}</strong><br/>${place.description ? place.description.substring(0, 50) + '...' : ''}`)
        )
        .addTo(map.current);

      // Click handler for place marker - check navigation mode first
      const handlePlaceMarkerClick = (e) => {
        // Prevent event from bubbling to map click
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        
        console.log('Place marker clicked:', { 
          placeName: place.name, 
          navType: window.setNavLocationType,
          hasNavHandler: !!window.setNavLocation 
        });
        
        // Check if navigation mode is active - prioritize setting navigation location
        if (window.setNavLocationType && window.setNavLocation) {
          console.log('Setting navigation location from place marker:', {
            type: window.setNavLocationType,
            name: place.name,
            lng: place.longitude,
            lat: place.latitude
          });
          
          // Call the navigation location setter
          window.setNavLocation(place.longitude, place.latitude, place.name);
          
          // The NavigationPanel will clear window.setNavLocationType, but we clear cursor here
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
          return;
        }
        
        // Otherwise, open place details
        if (onPlaceSelect) {
          onPlaceSelect(place);
        }
      };

      // Add click handler to the inner element
      el.addEventListener('click', handlePlaceMarkerClick);
      
      // Also add click handler to the marker element (Mapbox wraps it)
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.addEventListener('click', handlePlaceMarkerClick);
        markerElement.style.cursor = 'pointer';
      }

      placeMarkersRef.current.push(marker);
    });
  }, [places, mapLoaded, onPlaceSelect]);

  // Display routes on map
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    clearMap();

    // Ensure routes is an array
    const safeRoutes = Array.isArray(routes) ? routes : [];
    
    safeRoutes.forEach((route, routeIndex) => {
      if (!route.waypoints || route.waypoints.length === 0) return;

      // Create markers for waypoints
      route.waypoints.forEach((waypoint, index) => {
        const el = document.createElement('div');
        el.className = `custom-marker ${selectedRoute && selectedRoute._id === route._id ? 'selected' : ''}`;
        el.style.backgroundColor = route.color || '#3b82f6';
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([waypoint.longitude, waypoint.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<strong>${waypoint.name || `Point ${index + 1}`}</strong><br/>Route: ${route.name}`)
          )
          .addTo(map.current);

        markersRef.current.push(marker);
      });

      // Draw route line if there are at least 2 waypoints
      if (route.waypoints.length >= 2 && (!selectedRoute || selectedRoute._id === route._id || selectedRoute === null)) {
        const coordinates = route.waypoints
          .sort((a, b) => a.order - b.order)
          .map(wp => [wp.longitude, wp.latitude]);

        const sourceId = `route-${routeIndex}`;
        
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            }
          });

          map.current.addLayer({
            id: `route-${routeIndex}`,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': route.color || '#3b82f6',
              'line-width': selectedRoute && selectedRoute._id === route._id ? 6 : 4,
              'line-opacity': selectedRoute && selectedRoute._id === route._id ? 1 : 0.7
            }
          });
        } else {
          map.current.getSource(sourceId).setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }

        routeLinesRef.current.push(sourceId);
      }
    });

    // Fit map to show all routes if no route is selected
    if (safeRoutes.length > 0 && !selectedRoute) {
      const allCoordinates = safeRoutes
        .flatMap(route => route.waypoints || [])
        .map(wp => [wp.longitude, wp.latitude]);

      if (allCoordinates.length > 0 && map.current) {
        const bounds = allCoordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }
    } else if (selectedRoute && selectedRoute.waypoints && selectedRoute.waypoints.length > 0) {
      // Fit map to selected route
      const coordinates = selectedRoute.waypoints
        .sort((a, b) => a.order - b.order)
        .map(wp => [wp.longitude, wp.latitude]);

      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000
      });
    }
  }, [routes, selectedRoute, mapLoaded]);

  // Handle navigation route calculation
  useEffect(() => {
    if (!map.current || !mapLoaded || !navigationRoute) return;

    const calculateAndDisplayRoute = async () => {
      const token = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
      const { start, end, profile } = navigationRoute;

      try {
        // Clear previous navigation markers and route
        navMarkersRef.current.forEach(marker => marker.remove());
        navMarkersRef.current = [];

        if (navRouteLayerRef.current) {
          if (map.current.getLayer(navRouteLayerRef.current)) {
            map.current.removeLayer(navRouteLayerRef.current);
          }
          if (map.current.getSource(navRouteLayerRef.current)) {
            map.current.removeSource(navRouteLayerRef.current);
          }
          navRouteLayerRef.current = null;
        }

        // Add start and end markers
        const startMarker = new mapboxgl.Marker({ color: '#4CAF50' })
          .setLngLat([start.lng, start.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>📍 Start</strong><br/>${start.name}`))
          .addTo(map.current);

        const endMarker = new mapboxgl.Marker({ color: '#f44336' })
          .setLngLat([end.lng, end.lat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>📍 End</strong><br/>${end.name}`))
          .addTo(map.current);

        navMarkersRef.current.push(startMarker, endMarker);

        // Call Directions API
        const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?access_token=${token}&geometries=geojson&steps=true&overview=full`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const geometry = route.geometry;

          // Display route on map
          const sourceId = 'nav-route';
          navRouteLayerRef.current = sourceId;

          if (!map.current.getSource(sourceId)) {
            map.current.addSource(sourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: geometry
              }
            });
          } else {
            map.current.getSource(sourceId).setData({
              type: 'Feature',
              geometry: geometry
            });
          }

          if (!map.current.getLayer(sourceId)) {
            map.current.addLayer({
              id: sourceId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#667eea',
                'line-width': 6,
                'line-opacity': 0.8
              }
            });
          }

          // Calculate travel time and distance
          const duration = route.duration; // in seconds
          const distance = route.distance; // in meters

          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

          const distanceKm = (distance / 1000).toFixed(2);
          const distanceMi = (distance / 1609.34).toFixed(2);

          setNavInfo({
            time: timeString,
            distance: `${distanceKm} km (${distanceMi} mi)`,
            duration: duration
          });

          // Fit map to show entire route
          const routeCoords = geometry.coordinates;
          const bounds = routeCoords.reduce((bounds, coord) => {
            return bounds.extend(coord);
          }, new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]));

          map.current.fitBounds(bounds, {
            padding: 100,
            duration: 1500
          });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
        alert('Failed to calculate route. Please try again.');
      }
    };

    calculateAndDisplayRoute();
  }, [navigationRoute, mapLoaded]);

  if (mapError) {
    return (
      <div className="flex-1 relative w-3/4 h-full">
        <div className="flex items-center justify-center h-full flex-col p-8 bg-gray-100 text-red-600">
          <h3 className="mb-4">⚠️ Map Error</h3>
          <p className="text-center mb-4">{mapError}</p>
          <p className="text-sm text-gray-600 text-center">
            Make sure REACT_APP_MAPBOX_ACCESS_TOKEN is set in client/.env and restart the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative w-3/4 h-full">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />
      <div className="absolute top-2.5 right-2.5 z-[1000]">
        <div className="bg-white px-3 py-2 rounded-md shadow-lg text-sm text-gray-700">
          {routes.length > 0 && (
            <p>{routes.length} route{routes.length !== 1 ? 's' : ''} available</p>
          )}
        </div>
      </div>
      {navInfo && (
        <div className="absolute bottom-5 right-5 bg-white p-4 rounded-lg shadow-xl z-[1000] min-w-[200px] max-w-[300px]">
          <div className="font-semibold text-base mb-3 text-gray-800 border-b border-gray-200 pb-2">📍 Navigation</div>
          <div className="mb-2 text-sm text-gray-600">
            <strong className="text-gray-800 mr-2">Travel Time:</strong> {navInfo.time}
          </div>
          <div className="mb-2 text-sm text-gray-600">
            <strong className="text-gray-800 mr-2">Distance:</strong> {navInfo.distance}
          </div>
          <button 
            className="absolute top-2 right-2 bg-transparent border-none text-xl cursor-pointer text-gray-400 hover:text-gray-700 p-0 w-6 h-6 flex items-center justify-center" 
            onClick={() => {
              setNavInfo(null);
              if (onNavigationClear) onNavigationClear();
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;

