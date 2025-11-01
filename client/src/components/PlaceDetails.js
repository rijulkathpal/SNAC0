import React from 'react';
import WeatherWidget from './WeatherWidget';
import './PlaceDetails.css';

const PlaceDetails = ({ place, onClose }) => {
  if (!place) return null;

  const getDayStatus = (day) => {
    if (day.closed) return 'Closed';
    if (!day.open || !day.close) return 'Hours not set';
    return `${day.open} - ${day.close}`;
  };

  const getCurrentDayStatus = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayHours = place.openingHours?.[today];
    if (!todayHours) return 'Hours not available';
    
    if (todayHours.closed) return 'Closed today';
    
    if (todayHours.open && todayHours.close) {
      const now = new Date();
      const [openHour, openMin] = todayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
      const openTime = new Date();
      openTime.setHours(openHour, openMin, 0);
      const closeTime = new Date();
      closeTime.setHours(closeHour, closeMin, 0);
      
      const isOpen = now >= openTime && now <= closeTime;
      return isOpen ? `🟢 Open now (until ${todayHours.close})` : `🔴 Closed (opens ${todayHours.open})`;
    }
    
    return getDayStatus(todayHours);
  };

  const categoryLabels = {
    eateries: '🍽️ Eateries',
    recreation: '⚽ Recreation',
    educational: '📚 Educational',
    administration: '🏛️ Administration',
    staff_quarters: '🏠 Staff Quarters',
    hostel: '🏘️ Hostel',
    library: '📖 Library',
    other: '📍 Other'
  };

  return (
    <div className="place-details-overlay" onClick={onClose}>
      <div className="place-details" onClick={(e) => e.stopPropagation()}>
        <button className="place-details-close" onClick={onClose}>✕</button>
        
        <div className="place-details-header">
          <h2>{place.name}</h2>
          <span className="place-category-badge">
            {categoryLabels[place.category] || categoryLabels.other}
          </span>
        </div>

        <WeatherWidget latitude={place.latitude} longitude={place.longitude} />

        {place.description && (
          <div className="place-description">
            <h3>Description</h3>
            <p>{place.description}</p>
          </div>
        )}

        <div className="place-status">
          <h3>Current Status</h3>
          <p className="status-text">{getCurrentDayStatus()}</p>
        </div>

        <div className="place-opening-hours">
          <h3>Opening Hours</h3>
          <div className="hours-list">
            {Object.entries(place.openingHours || {}).map(([day, hours]) => (
              <div key={day} className="hours-item">
                <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                <span className="day-hours">{getDayStatus(hours)}</span>
              </div>
            ))}
          </div>
        </div>

        {place.contactInfo && (place.contactInfo.phone || place.contactInfo.email || place.contactInfo.website) && (
          <div className="place-contact">
            <h3>Contact Information</h3>
            {place.contactInfo.phone && (
              <div>📞 {place.contactInfo.phone}</div>
            )}
            {place.contactInfo.email && (
              <div>📧 {place.contactInfo.email}</div>
            )}
            {place.contactInfo.website && (
              <div>🌐 <a href={place.contactInfo.website} target="_blank" rel="noopener noreferrer">{place.contactInfo.website}</a></div>
            )}
          </div>
        )}

        <div className="place-location">
          <h3>Location</h3>
          <div className="coordinates">
            {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;

