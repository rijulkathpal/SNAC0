import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlaceForm.css';

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
    <form className="place-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Place Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select name="category" value={formData.category} onChange={handleChange}>
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

      <div className="form-group">
        <label>Coordinates *</label>
        <div className="coord-inputs">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={formData.latitude}
            onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
            className={errors.latitude ? 'error' : ''}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={formData.longitude}
            onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
            className={errors.longitude ? 'error' : ''}
          />
        </div>
        {errors.latitude && <span className="error-message">{errors.latitude}</span>}
        {errors.longitude && <span className="error-message">{errors.longitude}</span>}
      </div>

      <div className="form-section">
        <h4>Opening Hours</h4>
        {days.map(day => (
          <div key={day} className="hours-row">
            <label className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
            <input
              type="checkbox"
              checked={formData.openingHours[day].closed}
              onChange={(e) => handleOpeningHoursChange(day, 'closed', e.target.checked)}
            />
            <span className="closed-label">Closed</span>
            {!formData.openingHours[day].closed && (
              <>
                <input
                  type="time"
                  value={formData.openingHours[day].open || ''}
                  onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  value={formData.openingHours[day].close || ''}
                  onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="form-section">
        <h4>Contact Information (Optional)</h4>
        <input
          type="text"
          placeholder="Phone"
          value={formData.contactInfo.phone}
          onChange={(e) => handleContactChange('phone', e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.contactInfo.email}
          onChange={(e) => handleContactChange('email', e.target.value)}
        />
        <input
          type="url"
          placeholder="Website"
          value={formData.contactInfo.website}
          onChange={(e) => handleContactChange('website', e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">{place ? 'Update' : 'Create'} Place</button>
      </div>
    </form>
  );
};

export default PlaceForm;

