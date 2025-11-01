# Extract Places from Mapbox Map

Since Mapbox Geocoding API returns 0 results, here's a better approach:

## Method 1: Extract from Browser Console (Recommended)

When you look at your map, you can extract place names directly:

1. Open your map in browser
2. Open DevTools (F12)
3. Click on any place label/marker on the map
4. In Console, run this script to extract all visible place names:

```javascript
// This extracts place names from the map layer data
const extractPlacesFromMap = () => {
  // If you're using Mapbox GL JS, places might be in the map sources
  // This is a helper function - you'll need to adapt based on your map setup
  
  const places = [];
  
  // Option: Right-click on map markers and get coordinates
  // Then manually compile the list
  
  return places;
};
```

## Method 2: Manual Collection (Easiest)

Based on your map, here are the places visible:
- Mega Hostel
- Ultra Mega Hostel  
- 1st Block, 2nd Block, 7th Block, 8th Block, 13th Block, 14th Block
- Central Library
- Vaishnavi NITW Canteen
- Shinu Point
- Food Street
- State Bank of India
- Director's Bungalow
- Hostel Office
- Department of Civil Engineering
- Department of Physical Education
- St Ann's Hospital
- Bishop Berata High School
- And more...

**Solution:** Manually add them with coordinates from your map!

## Method 3: Use Browser DevTools to Get Coordinates

1. Right-click on any place on your Mapbox map
2. Copy coordinates (if available)
3. Or use the map's click handler to log coordinates
4. Compile into JSON and import

## Quick Add Script

Paste this in browser console when your map is open:

```javascript
// Get coordinates by clicking on map
let places = [];
window.mapClickCoords = [];

// Listen for map clicks (if your map component supports this)
// Then compile the coordinates with place names manually
```

## The Real Issue

Mapbox Geocoding API ≠ Mapbox Map Tiles

The places you see on the map come from:
- Mapbox Vector Tiles (not accessible via Geocoding API)
- Custom map style data
- Local annotations

The Geocoding API only searches Mapbox's searchable POI database, which doesn't include all campus places.

## Best Solution

Since Mapbox API isn't returning results, manually add places:
1. Click places on your map to get coordinates
2. Use the "Add Place" button in UI
3. Or use the bulk import with coordinates you collect

This is more reliable than depending on Mapbox API!

