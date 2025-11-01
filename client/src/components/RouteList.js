import React from 'react';

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
      <div className="text-center py-12 px-4 text-gray-500">
        <p>No routes created yet.</p>
        <p className="text-sm text-gray-400 mt-2">Click "New Route" to create your first route.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {safeRoutes.map((route) => (
        <div
          key={route._id}
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 bg-white ${
            selectedRoute && selectedRoute._id === route._id
              ? 'border-primary bg-gray-100 shadow-lg shadow-primary/25'
              : 'border-gray-200 hover:border-primary hover:shadow-md hover:shadow-primary/15 hover:-translate-y-0.5'
          }`}
          onClick={() => onSelectRoute(route)}
        >
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0" 
              style={{ backgroundColor: route.color || '#3b82f6' }}
            ></div>
            <h3 className="text-base font-semibold text-gray-900 m-0">{route.name}</h3>
          </div>
          {route.description && (
            <p className="text-sm text-gray-500 my-2 leading-relaxed">{route.description}</p>
          )}
          <div className="my-2 text-xs text-gray-400">
            <span>
              {route.waypoints ? route.waypoints.length : 0} waypoint{route.waypoints && route.waypoints.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            <button
              className="flex-1 py-2 border border-primary text-primary rounded-md bg-white cursor-pointer text-sm transition-all duration-200 hover:bg-primary hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(route);
              }}
            >
              Edit
            </button>
            <button
              className="flex-1 py-2 border border-red-500 text-red-500 rounded-md bg-white cursor-pointer text-sm transition-all duration-200 hover:bg-red-500 hover:text-white"
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

