import React from 'react';
import WeatherWidget from './WeatherWidget';

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
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" 
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 m-0">{place.name}</h2>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {categoryLabels[place.category] || categoryLabels.other}
          </span>
        </div>

        <WeatherWidget latitude={place.latitude} longitude={place.longitude} />

        {place.description && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{place.description}</p>
          </div>
        )}

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Status</h3>
          <p className="text-base font-medium">{getCurrentDayStatus()}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Opening Hours</h3>
          <div className="space-y-2">
            {Object.entries(place.openingHours || {}).map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                <span className="text-sm text-gray-600">{getDayStatus(hours)}</span>
              </div>
            ))}
          </div>
        </div>

        {place.contactInfo && (place.contactInfo.phone || place.contactInfo.email || place.contactInfo.website) && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Information</h3>
            <div className="space-y-2 text-gray-600">
              {place.contactInfo.phone && (
                <div className="text-sm">📞 {place.contactInfo.phone}</div>
              )}
              {place.contactInfo.email && (
                <div className="text-sm">📧 {place.contactInfo.email}</div>
              )}
              {place.contactInfo.website && (
                <div className="text-sm">
                  🌐 <a href={place.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{place.contactInfo.website}</a>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Location</h3>
          <div className="text-sm text-gray-600 font-mono">
            {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;

