import React, { useState } from 'react';
import RouteForm from './RouteForm';
import RouteList from './RouteList';

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
    <div className="w-full bg-white shadow-md rounded-lg flex flex-col z-[100] overflow-hidden md:relative md:left-0 md:top-0 md:bottom-0 md:w-full md:max-w-[350px] md:transform md:-translate-x-full md:transition-transform md:duration-300">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-br from-primary to-secondary text-white">
        <h2 className="text-xl font-semibold">Routes</h2>
        <button 
          className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-white/30 hover:-translate-y-0.5" 
          onClick={handleCreate}
        >
          + New Route
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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

