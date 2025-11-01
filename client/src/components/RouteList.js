import React from 'react';
import './RouteList.css';

const RouteList = ({ routes = [], selectedRoute, onSelectRoute, onEdit, onDelete }) => {
  // Ensure routes is always an array
  const safeRoutes = Array.isArray(routes) ? routes : [];
  
  const handleDelete = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/routes/${routeId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          onDelete();
        } else {
          alert('Failed to delete route');
        }
      } catch (error) {
        console.error('Error deleting route:', error);
        alert('Error deleting route');
      }
    }
  };

  if (safeRoutes.length === 0) {
    return (
      <div className="empty-state">
        <p>No routes created yet.</p>
        <p className="empty-state-hint">Click "New Route" to create your first route.</p>
      </div>
    );
  }

  return (
    <div className="route-list">
      {safeRoutes.map((route) => (
        <div
          key={route._id}
          className={`route-item ${selectedRoute && selectedRoute._id === route._id ? 'selected' : ''}`}
          onClick={() => onSelectRoute(route)}
        >
          <div className="route-item-header">
            <div className="route-color" style={{ backgroundColor: route.color || '#3b82f6' }}></div>
            <h3 className="route-name">{route.name}</h3>
          </div>
          {route.description && (
            <p className="route-description">{route.description}</p>
          )}
          <div className="route-meta">
            <span className="route-waypoints-count">
              {route.waypoints ? route.waypoints.length : 0} waypoint{route.waypoints && route.waypoints.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="route-actions">
            <button
              className="btn-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(route);
              }}
            >
              Edit
            </button>
            <button
              className="btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(route._id);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RouteList;

