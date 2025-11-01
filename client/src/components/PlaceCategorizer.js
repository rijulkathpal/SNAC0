import React, { useState, useEffect } from 'react';
import PlaceForm from './PlaceForm';

const PlaceCategorizer = ({ onPlaceSelect }) => {
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isPopulating, setIsPopulating] = useState(false);

  const categories = {
    all: { label: '📍 All Places', icon: '📍' },
    eateries: { label: '🍽️ Eateries', icon: '🍽️' },
    recreation: { label: '⚽ Recreation', icon: '⚽' },
    educational: { label: '📚 Educational', icon: '📚' },
    administration: { label: '🏛️ Administration', icon: '🏛️' },
    staff_quarters: { label: '🏠 Staff Quarters', icon: '🏠' },
    hostel: { label: '🏘️ Hostel', icon: '🏘️' },
    library: { label: '📖 Library', icon: '📖' },
    other: { label: '📍 Other', icon: '📍' }
  };

  useEffect(() => {
    fetchPlaces();
  }, [selectedCategory]);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const url = selectedCategory && selectedCategory !== 'all'
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places/category/${selectedCategory}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places`;
      
      const response = await fetch(url);
      const data = await response.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceSaved = () => {
    setIsCreating(false);
    setEditingPlace(null);
    fetchPlaces();
  };

  const handlePopulateCollegePlaces = async () => {
    if (!window.confirm('This will add NIT Warangal places to the database using OpenStreetMap geocoding. This may take a few minutes. Continue?')) {
      return;
    }

    setIsPopulating(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places/populate-college-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ ${data.message}\n\nCreated: ${data.results.success.length}\nFailed: ${data.results.failed.length}\nSkipped: ${data.results.skipped.length}`);
        fetchPlaces(); // Refresh the places list
      } else {
        alert(`Error: ${data.error || 'Failed to populate places'}`);
      }
    } catch (error) {
      console.error('Error populating places:', error);
      alert('Error populating places. Please check the console.');
    } finally {
      setIsPopulating(false);
    }
  };

  const groupedPlaces = places.reduce((acc, place) => {
    const category = place.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(place);
    return acc;
  }, {});

  if (isCreating || editingPlace) {
    return (
      <div className="bg-white p-4 rounded-lg mb-4 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="m-0 text-gray-800 text-lg">{editingPlace ? 'Edit' : 'Add'} Place</h3>
          <button 
            className="text-xl text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
            onClick={() => { setIsCreating(false); setEditingPlace(null); }}
          >
            ✕
          </button>
        </div>
        <PlaceForm
          place={editingPlace}
          onSave={handlePlaceSaved}
          onCancel={() => { setIsCreating(false); setEditingPlace(null); }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg mb-4 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-gray-800 text-lg">🗺️ Places</h3>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-md text-white border-none cursor-pointer text-sm font-medium transition-all duration-200 ${
              isPopulating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={handlePopulateCollegePlaces}
            disabled={isPopulating}
            title="Populate college places from OpenStreetMap"
          >
            {isPopulating ? '⏳ Loading...' : '🌐 Populate Places'}
          </button>
          <button 
            className="px-4 py-2 bg-primary text-white border-none rounded-md cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-[#5568d3]"
            onClick={() => setIsCreating(true)}
          >
            + Add Place
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedCategory === key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(key)}
            >
              {icon} {label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Loading places...</div>}

      <div className="space-y-4">
        {selectedCategory && selectedCategory !== 'all' ? (
          groupedPlaces[selectedCategory]?.length > 0 ? (
            groupedPlaces[selectedCategory].map((place) => (
                <div key={place._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all duration-200">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onPlaceSelect(place)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{categories[place.category]?.icon || '📍'}</span>
                      <span className="font-medium text-gray-800">{place.name}</span>
                    </div>
                    {place.description && (
                      <div className="text-xs text-gray-500 ml-8">{place.description.substring(0, 50)}...</div>
                    )}
                  </div>
                  <button
                    className="ml-2 p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPlace(place);
                    }}
                    title="Edit place"
                  >
                    ✏️
                  </button>
                </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No places in this category</div>
          )
        ) : (
          Object.entries(groupedPlaces).map(([category, categoryPlaces]) => (
            <div key={category} className="mb-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <span className="text-xl">{categories[category]?.icon || '📍'}</span>
                <span className="font-semibold text-gray-700">{categories[category]?.label || category}</span>
                <span className="text-sm text-gray-400">({categoryPlaces.length})</span>
              </div>
              <div className="space-y-2">
                {categoryPlaces.map((place) => (
                  <div key={place._id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all duration-200">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onPlaceSelect(place)}
                    >
                      <span className="font-medium text-gray-800">{place.name}</span>
                      {place.description && (
                        <div className="text-xs text-gray-500 mt-1">{place.description.substring(0, 40)}...</div>
                      )}
                    </div>
                    <button
                      className="ml-2 p-1 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlace(place);
                      }}
                      title="Edit place"
                    >
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {places.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p>No places found</p>
          <p className="text-sm text-gray-400 mt-2">Add places to see them here</p>
        </div>
      )}
    </div>
  );
};

export default PlaceCategorizer;

