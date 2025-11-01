import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import RoutePanel from './components/RoutePanel';
import NavigationPanel from './components/NavigationPanel';
import PlaceCategorizer from './components/PlaceCategorizer';
import PlaceDetails from './components/PlaceDetails';

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
    <div className="w-full h-screen flex flex-col">
      <header className="bg-gradient-to-br from-primary to-secondary text-white px-4 md:px-8 py-4 flex justify-between items-center shadow-lg z-[1000]">
        <h1 className="text-xl md:text-2xl font-semibold">Campus Navigation System</h1>
        <button 
          className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-md cursor-pointer text-sm md:text-base transition-all duration-300 hover:bg-white/30 hover:-translate-y-0.5"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          {isPanelOpen ? 'Hide' : 'Show'} Routes
        </button>
      </header>
      <div className="flex flex-1 relative overflow-hidden">
        <div className={`w-1/4 min-w-[300px] max-w-[400px] p-4 bg-gray-100 overflow-y-auto flex flex-col gap-4 transition-all duration-300 ${!isPanelOpen ? 'hidden' : ''}`}>
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

