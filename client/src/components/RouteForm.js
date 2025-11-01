import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RouteForm.css';

const RouteForm = ({ route, onSave, onCancel, onDrawingModeChange, onMapClickCallbackChange }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    waypoints: []
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name || '',
        description: route.description || '',
        color: route.color || '#3b82f6',
        waypoints: route.waypoints || []
      });
    }
  }, [route]);

  // Set up map click handler when drawing mode is enabled
  useEffect(() => {
    if (isDrawing && onMapClickCallbackChange) {
      onMapClickCallbackChange((lng, lat) => {
        handleAddWaypointFromMap(lat, lng);
      });
    } else if (!isDrawing && onMapClickCallbackChange) {
      onMapClickCallbackChange(null);
    }
    // Update drawing mode in parent
    if (onDrawingModeChange) {
      onDrawingModeChange(isDrawing);
    }
  }, [isDrawing, onMapClickCallbackChange, onDrawingModeChange]);

  const handleAddWaypointFromMap = (latitude, longitude) => {
    setFormData(prev => ({
      ...prev,
      waypoints: [
        ...prev.waypoints,
        {
          latitude: latitude,
          longitude: longitude,
          name: '',
          order: prev.waypoints.length
        }
      ]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddWaypoint = () => {
    setFormData(prev => ({
      ...prev,
      waypoints: [
        ...prev.waypoints,
        {
          latitude: 0,
          longitude: 0,
          name: '',
          order: prev.waypoints.length
        }
      ]
    }));
  };

  const handleWaypointChange = (index, field, value) => {
    setFormData(prev => {
      const newWaypoints = [...prev.waypoints];
      newWaypoints[index] = {
        ...newWaypoints[index],
        [field]: field === 'latitude' || field === 'longitude' ? parseFloat(value) || 0 : value
      };
      return {
        ...prev,
        waypoints: newWaypoints
      };
    });
  };

  const handleRemoveWaypoint = (index) => {
    setFormData(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index).map((wp, i) => ({ ...wp, order: i }))
    }));
  };

  const handleMoveWaypoint = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.waypoints.length - 1)
    ) {
      return;
    }

    const newWaypoints = [...formData.waypoints];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newWaypoints[index], newWaypoints[newIndex]] = [newWaypoints[newIndex], newWaypoints[index]];
    
    // Update order
    newWaypoints.forEach((wp, i) => {
      wp.order = i;
    });

    setFormData(prev => ({
      ...prev,
      waypoints: newWaypoints
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Route name is required';
    }

    if (formData.waypoints.length < 2) {
      newErrors.waypoints = 'At least 2 waypoints are required';
    }

    formData.waypoints.forEach((wp, index) => {
      if (wp.latitude === 0 && wp.longitude === 0) {
        newErrors[`waypoint_${index}`] = 'Waypoint coordinates cannot be (0, 0)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/routes`;
      
      if (route) {
        // Update existing route
        await axios.put(`${apiUrl}/${route._id}`, formData);
      } else {
        // Create new route
        await axios.post(apiUrl, formData);
      }

      // Disable drawing mode after saving
      setIsDrawing(false);
      if (onMapClickCallbackChange) {
        onMapClickCallbackChange(null);
      }
      if (onDrawingModeChange) {
        onDrawingModeChange(false);
      }

      onSave();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Failed to save route. Please check your input and try again.');
    }
  };

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Route Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter route name"
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter route description (optional)"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label htmlFor="color">Route Color</label>
        <div className="color-input-group">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
          <input
            type="text"
            value={formData.color}
            onChange={handleChange}
            name="color"
            placeholder="#3b82f6"
            className="color-text-input"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="waypoints-header">
          <label>Waypoints *</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn-toggle-draw ${isDrawing ? 'active' : ''}`}
              onClick={() => setIsDrawing(!isDrawing)}
              title={isDrawing ? 'Click on map to add waypoints' : 'Enable map clicking'}
            >
              {isDrawing ? '🖱️ Clicking ON' : '🖱️ Click Map'}
            </button>
            <button
              type="button"
              className="btn-add-waypoint"
              onClick={handleAddWaypoint}
            >
              + Add Manually
            </button>
          </div>
        </div>
        {isDrawing && (
          <div className="drawing-hint" style={{ 
            padding: '8px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '4px', 
            marginBottom: '8px',
            fontSize: '0.9em',
            color: '#1976d2'
          }}>
            💡 Click anywhere on the map to add waypoints
          </div>
        )}
        {errors.waypoints && (
          <span className="error-message">{errors.waypoints}</span>
        )}

        <div className="waypoints-list">
          {formData.waypoints.map((waypoint, index) => (
            <div key={index} className="waypoint-item">
              <div className="waypoint-header">
                <span className="waypoint-number">Point {index + 1}</span>
                <div className="waypoint-actions">
                  <button
                    type="button"
                    onClick={() => handleMoveWaypoint(index, 'up')}
                    disabled={index === 0}
                    className="btn-move"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveWaypoint(index, 'down')}
                    disabled={index === formData.waypoints.length - 1}
                    className="btn-move"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveWaypoint(index)}
                    className="btn-remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="waypoint-fields">
                <div className="field-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={waypoint.name || ''}
                    onChange={(e) => handleWaypointChange(index, 'name', e.target.value)}
                    placeholder={`Point ${index + 1}`}
                  />
                </div>
                <div className="field-group">
                  <label>Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={waypoint.latitude || ''}
                    onChange={(e) => handleWaypointChange(index, 'latitude', e.target.value)}
                    placeholder="40.7128"
                    className={errors[`waypoint_${index}`] ? 'error' : ''}
                  />
                </div>
                <div className="field-group">
                  <label>Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={waypoint.longitude || ''}
                    onChange={(e) => handleWaypointChange(index, 'longitude', e.target.value)}
                    placeholder="-74.0060"
                    className={errors[`waypoint_${index}`] ? 'error' : ''}
                  />
                </div>
              </div>
              {errors[`waypoint_${index}`] && (
                <span className="error-message">{errors[`waypoint_${index}`]}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn-cancel" 
          onClick={() => {
            setIsDrawing(false);
            if (onMapClickCallbackChange) {
              onMapClickCallbackChange(null);
            }
            if (onDrawingModeChange) {
              onDrawingModeChange(false);
            }
            onCancel();
          }}
        >
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          {route ? 'Update Route' : 'Create Route'}
        </button>
      </div>
    </form>
  );
};

export default RouteForm;

