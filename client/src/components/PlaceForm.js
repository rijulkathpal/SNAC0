import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PlaceForm = ({ place, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    latitude: '',
    longitude: '',
    openingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: false }
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '',
        description: place.description || '',
        category: place.category || 'other',
        latitude: place.latitude || '',
        longitude: place.longitude || '',
        openingHours: place.openingHours || formData.openingHours,
        contactInfo: place.contactInfo || formData.contactInfo
      });
    }
  }, [place]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOpeningHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: field === 'closed' ? value : value
        }
      }
    }));
  };

  const handleContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.latitude || isNaN(formData.latitude)) newErrors.latitude = 'Valid latitude is required';
    if (!formData.longitude || isNaN(formData.longitude)) newErrors.longitude = 'Valid longitude is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/places`;
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };

      if (place) {
        await axios.put(`${apiUrl}/${place._id}`, payload);
      } else {
        await axios.post(apiUrl, payload);
      }

      onSave();
    } catch (error) {
      console.error('Error saving place:', error);
      alert('Failed to save place. Please check your input.');
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Place Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            errors.name ? 'border-red-500' : 'border-gray-300 focus:border-primary'
          }`}
        />
        {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Category *</label>
        <select 
          name="category" 
          value={formData.category} 
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="eateries">🍽️ Eateries</option>
          <option value="recreation">⚽ Recreation</option>
          <option value="educational">📚 Educational</option>
          <option value="administration">🏛️ Administration</option>
          <option value="staff_quarters">🏠 Staff Quarters</option>
          <option value="hostel">🏘️ Hostel</option>
          <option value="library">📖 Library</option>
          <option value="other">📍 Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Coordinates *</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.latitude ? 'border-red-500' : 'border-gray-300 focus:border-primary'
            }`}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.longitude ? 'border-red-500' : 'border-gray-300 focus:border-primary'
            }`}
          />
        </div>
        {errors.latitude && <span className="text-xs text-red-500">{errors.latitude}</span>}
        {errors.longitude && <span className="text-xs text-red-500">{errors.longitude}</span>}
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Opening Hours</h4>
        {days.map(day => (
          <div key={day} className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-medium text-gray-600 min-w-[80px]">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
            <input
              type="checkbox"
              checked={formData.openingHours[day].closed}
              onChange={(e) => handleOpeningHoursChange(day, 'closed', e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-xs text-gray-600">Closed</span>
            {!formData.openingHours[day].closed && (
              <>
                <input
                  type="time"
                  value={formData.openingHours[day].open || ''}
                  onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-xs text-gray-500">to</span>
                <input
                  type="time"
                  value={formData.openingHours[day].close || ''}
                  onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information (Optional)</h4>
        <input
          type="text"
          placeholder="Phone"
          value={formData.contactInfo.phone}
          onChange={(e) => handleContactChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.contactInfo.email}
          onChange={(e) => handleContactChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <input
          type="url"
          placeholder="Website"
          value={formData.contactInfo.website}
          onChange={(e) => handleContactChange('website', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 px-4 py-2 bg-primary text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:bg-[#5568d3] transition-colors"
        >
          {place ? 'Update' : 'Create'} Place
        </button>
      </div>
    </form>
  );
};

export default PlaceForm;

