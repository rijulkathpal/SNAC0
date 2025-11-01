import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import RoutePanel from './components/RoutePanel';
import NavigationPanel from './components/NavigationPanel';
import PlaceCategorizer from './components/PlaceCategorizer';
import PlaceDetails from './components/PlaceDetails';
import './App.css';

function App() {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [onMapClickCallback, setOnMapClickCallback] = useState(null);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [isSettingNavLocation, setIsSettingNavLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [places, setPlaces] = useState([]);

  // Fetch routes from API
  const fetchRoutes = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/routes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Ensure routes is always an array
      setRoutes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      // Set to empty array on error to prevent crashes
      setRoutes([]);
    }
  };

  useEffect(() => {
    fetchRoutes();
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

  const handleRouteCreated = () => {
    fetchRoutes();
  };

  const handleRouteDeleted = () => {
    fetchRoutes();
    setSelectedRoute(null);
  };

  const handleRouteUpdated = () => {
    fetchRoutes();
  };

  const handleNavigationCalculate = (routeData) => {
    setNavigationRoute(routeData);
  };

  const handleNavigationClear = () => {
    setNavigationRoute(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Campus Navigation System</h1>
        <button 
          className="toggle-panel-btn"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          {isPanelOpen ? 'Hide' : 'Show'} Routes
        </button>
      </header>
      <div className="app-container">
        <div className={`sidebar-panel ${isPanelOpen ? '' : 'hidden'}`}>
          <NavigationPanel
            onRouteCalculate={handleNavigationCalculate}
            onClear={handleNavigationClear}
          />
          <PlaceCategorizer
            onPlaceSelect={setSelectedPlace}
          />
          <RoutePanel
            isOpen={true}
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            onRouteCreated={handleRouteCreated}
            onRouteDeleted={handleRouteDeleted}
            onRouteUpdated={handleRouteUpdated}
            onDrawingModeChange={setIsDrawingRoute}
            onMapClickCallbackChange={setOnMapClickCallback}
          />
        </div>
        <MapComponent
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRoute}
          isDrawingMode={isDrawingRoute}
          onMapClick={onMapClickCallback}
          navigationRoute={navigationRoute}
          onNavigationClear={handleNavigationClear}
          places={places}
          onPlaceSelect={setSelectedPlace}
        />
        {selectedPlace && (
          <PlaceDetails
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

