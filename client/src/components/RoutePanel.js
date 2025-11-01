import React, { useState } from 'react';
import RouteForm from './RouteForm';
import RouteList from './RouteList';
import './RoutePanel.css';

const RoutePanel = ({
  isOpen,
  routes,
  selectedRoute,
  onSelectRoute,
  onRouteCreated,
  onRouteDeleted,
  onRouteUpdated,
  onDrawingModeChange,
  onMapClickCallbackChange
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingRoute(null);
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingRoute(null);
    // Disable drawing mode when canceling
    if (onDrawingModeChange) {
      onDrawingModeChange(false);
    }
    if (onMapClickCallbackChange) {
      onMapClickCallbackChange(null);
    }
  };

  const handleSave = () => {
    setIsCreating(false);
    setEditingRoute(null);
    onRouteCreated();
  };

  const handleUpdate = () => {
    setEditingRoute(null);
    onRouteUpdated();
  };

  if (!isOpen) return null;

  return (
    <div className="route-panel">
      <div className="route-panel-header">
        <h2>Routes</h2>
        <button className="btn-primary" onClick={handleCreate}>
          + New Route
        </button>
      </div>

      <div className="route-panel-content">
        {isCreating ? (
          <RouteForm
            onSave={handleSave}
            onCancel={handleCancel}
            onDrawingModeChange={onDrawingModeChange}
            onMapClickCallbackChange={onMapClickCallbackChange}
          />
        ) : editingRoute ? (
          <RouteForm
            route={editingRoute}
            onSave={handleUpdate}
            onCancel={handleCancel}
            onDrawingModeChange={onDrawingModeChange}
            onMapClickCallbackChange={onMapClickCallbackChange}
          />
        ) : (
          <RouteList
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={onSelectRoute}
            onEdit={handleEdit}
            onDelete={onRouteDeleted}
          />
        )}
      </div>
    </div>
  );
};

export default RoutePanel;

