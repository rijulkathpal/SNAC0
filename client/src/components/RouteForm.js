import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold text-gray-700">Route Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter route name"
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            errors.name ? 'border-red-500' : 'border-gray-300 focus:border-primary'
          }`}
        />
        {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter route description (optional)"
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="color" className="text-sm font-semibold text-gray-700">Route Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={handleChange}
            name="color"
            placeholder="#3b82f6"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold text-gray-700">Waypoints *</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                isDrawing
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setIsDrawing(!isDrawing)}
              title={isDrawing ? 'Click on map to add waypoints' : 'Enable map clicking'}
            >
              {isDrawing ? '🖱️ Clicking ON' : '🖱️ Click Map'}
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
              onClick={handleAddWaypoint}
            >
              + Add Manually
            </button>
          </div>
        </div>
        {isDrawing && (
          <div className="p-2 bg-blue-50 rounded text-sm text-blue-700 mb-2">
            💡 Click anywhere on the map to add waypoints
          </div>
        )}
        {errors.waypoints && (
          <span className="text-xs text-red-500">{errors.waypoints}</span>
        )}

        <div className="space-y-3">
          {formData.waypoints.map((waypoint, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Point {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveWaypoint(index, 'up')}
                    disabled={index === 0}
                    className="px-2 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveWaypoint(index, 'down')}
                    disabled={index === formData.waypoints.length - 1}
                    className="px-2 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveWaypoint(index)}
                    className="px-2 py-1 text-red-600 border border-red-300 rounded text-sm hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Name</label>
                  <input
                    type="text"
                    value={waypoint.name || ''}
                    onChange={(e) => handleWaypointChange(index, 'name', e.target.value)}
                    placeholder={`Point ${index + 1}`}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={waypoint.latitude || ''}
                      onChange={(e) => handleWaypointChange(index, 'latitude', e.target.value)}
                      placeholder="40.7128"
                      className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 ${
                        errors[`waypoint_${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-600">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={waypoint.longitude || ''}
                      onChange={(e) => handleWaypointChange(index, 'longitude', e.target.value)}
                      placeholder="-74.0060"
                      className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 ${
                        errors[`waypoint_${index}`] ? 'border-red-500' : 'border-gray-300 focus:border-primary'
                      }`}
                    />
                  </div>
                </div>
                {errors[`waypoint_${index}`] && (
                  <span className="text-xs text-red-500">{errors[`waypoint_${index}`]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors" 
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
        <button 
          type="submit" 
          className="flex-1 px-4 py-2 bg-primary text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:bg-[#5568d3] transition-colors"
        >
          {route ? 'Update Route' : 'Create Route'}
        </button>
      </div>
    </form>
  );
};

export default RouteForm;

