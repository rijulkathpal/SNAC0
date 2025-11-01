import React, { useState, useEffect } from 'react';
import PlaceForm from './PlaceForm';
import './PlaceCategorizer.css';

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
      <div className="place-categorizer">
        <div className="categorizer-header">
          <h3>{editingPlace ? 'Edit' : 'Add'} Place</h3>
          <button onClick={() => { setIsCreating(false); setEditingPlace(null); }}>✕</button>
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
    <div className="place-categorizer">
      <div className="categorizer-header">
        <h3>🗺️ Places</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-populate-places" 
            onClick={handlePopulateCollegePlaces}
            disabled={isPopulating}
            title="Populate college places from OpenStreetMap"
            style={{
              padding: '0.5rem 1rem',
              background: isPopulating ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isPopulating ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {isPopulating ? '⏳ Loading...' : '🌐 Populate Places'}
          </button>
          <button className="btn-add-place" onClick={() => setIsCreating(true)}>
            + Add Place
          </button>
        </div>
      </div>

      <div className="category-filter">
        <div className="category-buttons">
          {Object.entries(categories).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              {icon} {label.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="loading">Loading places...</div>}

      <div className="places-list">
        {selectedCategory && selectedCategory !== 'all' ? (
          groupedPlaces[selectedCategory]?.length > 0 ? (
            groupedPlaces[selectedCategory].map((place) => (
                <div key={place._id} className="place-item">
                  <div
                    className="place-item-content"
                    onClick={() => onPlaceSelect(place)}
                  >
                    <div className="place-item-header">
                      <span className="place-icon">{categories[place.category]?.icon || '📍'}</span>
                      <span className="place-name">{place.name}</span>
                    </div>
                    {place.description && (
                      <div className="place-item-desc">{place.description.substring(0, 50)}...</div>
                    )}
                  </div>
                  <button
                    className="place-edit-btn"
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
            <div className="empty-state">No places in this category</div>
          )
        ) : (
          Object.entries(groupedPlaces).map(([category, categoryPlaces]) => (
            <div key={category} className="category-group">
              <div className="category-group-header">
                <span className="category-icon">{categories[category]?.icon || '📍'}</span>
                <span className="category-name">{categories[category]?.label || category}</span>
                <span className="category-count">({categoryPlaces.length})</span>
              </div>
              <div className="category-places">
                {categoryPlaces.map((place) => (
                  <div key={place._id} className="place-item">
                    <div
                      className="place-item-content"
                      onClick={() => onPlaceSelect(place)}
                    >
                      <span className="place-name">{place.name}</span>
                      {place.description && (
                        <div className="place-item-desc">{place.description.substring(0, 40)}...</div>
                      )}
                    </div>
                    <button
                      className="place-edit-btn"
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
        <div className="empty-state">
          <p>No places found</p>
          <p className="hint">Add places to see them here</p>
        </div>
      )}
    </div>
  );
};

export default PlaceCategorizer;

