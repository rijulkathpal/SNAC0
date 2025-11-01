const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
require('dotenv').config();

// Custom action routes should come before parameter routes
router.delete('/actions/cleanup', async (req, res) => {
  try {
    const result = await Place.deleteMany({
      category: { $ne: 'other' }
    });
    res.json({
      message: `Successfully deleted ${result.deletedCount} places that were not in 'other' category`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting places:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get all places
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isActive: true } : { isActive: true };
    const places = await Place.find(query).sort({ name: 1 });
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get places by category
router.get('/category/:category', async (req, res) => {
  try {
    const places = await Place.find({ 
      category: req.params.category,
      isActive: true 
    }).sort({ name: 1 });
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single place by ID
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new place
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Place name is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required'),
    body('category').isIn([
      'eateries', 'recreation', 'educational', 'administration', 
      'staff_quarters', 'hostel', 'library', 'other'
    ]).withMessage('Valid category is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const place = new Place(req.body);
      await place.save();
      res.status(201).json(place);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Update a place
router.put('/:id', async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json(place);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a place
router.delete('/:id', async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ message: 'Place deleted successfully', place });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Geocode a place name using OpenStreetMap Nominatim API
const geocodePlace = async (placeName, city = 'Warangal, Telangana, India') => {
  try {
    const query = encodeURIComponent(`${placeName}, ${city}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`;
    
    // Add delay to respect Nominatim's usage policy (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Campus Navigation System' // Nominatim requires User-Agent
      }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address || {}
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error geocoding ${placeName}:`, error);
    return null;
  }
};

// Import places from OpenStreetMap - convert names to coordinates and save
router.post('/import-from-osm', async (req, res) => {
  try {
    const { places } = req.body;
    
    if (!places || !Array.isArray(places)) {
      return res.status(400).json({ error: 'Places array is required' });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const placeData of places) {
      const { name, category, description, city } = placeData;
      
      if (!name) {
        results.failed.push({ name: name || 'Unknown', error: 'Name is required' });
        continue;
      }

      // Check if place already exists
      const existing = await Place.findOne({ name: name.trim() });
      if (existing) {
        results.skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      // Geocode the place name
      const geocodeResult = await geocodePlace(name, city || 'Warangal, Telangana, India');
      
      if (!geocodeResult) {
        results.failed.push({ name, error: 'Could not find coordinates' });
        continue;
      }

      // Create place with geocoded coordinates
      const place = new Place({
        name: name.trim(),
        description: description || geocodeResult.displayName,
        category: category || 'other',
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        isActive: true
      });

      await place.save();
      results.success.push({
        name: place.name,
        coordinates: { lat: place.latitude, lng: place.longitude }
      });
    }

    res.json({
      message: `Import completed: ${results.success.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      results
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Fetch all places from Mapbox within campus area and store them
router.post('/fetch-from-mapbox', async (req, res) => {
  try {
    const mapboxToken = process.env.MAPBOX_API_KEY;
    if (!mapboxToken) {
      return res.status(500).json({ error: 'MAPBOX_API_KEY not configured in server .env' });
    }

    // Campus bounding box (NIT Warangal area)
    const bbox = '79.40,17.90,79.65,18.05'; // [minLng, minLat, maxLng, maxLat]
    const campusCenter = { lat: 17.9808, lng: 79.5328 };
    
    const allPlaces = [];
    const seenNames = new Set(); // Avoid duplicates

    console.log('Starting to fetch places from Mapbox...');
    
    // Validate API key first
    try {
      const testUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/Warangal.json?access_token=${mapboxToken}&limit=1`;
      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();
      if (testData.error || testData.message) {
        console.error('Mapbox API Error:', testData.error || testData.message);
        return res.status(500).json({ error: `Mapbox API error: ${testData.error || testData.message}` });
      }
      console.log('✅ Mapbox API key validated successfully');
    } catch (error) {
      console.error('Error validating Mapbox API key:', error);
      return res.status(500).json({ error: 'Failed to connect to Mapbox API. Check your API key.' });
    }

    // Strategy 1: Grid-based reverse geocoding - query points across campus area
    // Create a grid of points across the campus bounding box
    const gridPoints = [];
    const minLat = 17.90;
    const maxLat = 18.05;
    const minLng = 79.40;
    const maxLng = 79.65;
    
    // Create 5x5 grid (25 points)
    const gridSize = 5;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = minLat + (maxLat - minLat) * (i / (gridSize - 1));
        const lng = minLng + (maxLng - minLng) * (j / (gridSize - 1));
        gridPoints.push({ lat, lng });
      }
    }

    console.log(`Querying ${gridPoints.length} grid points...`);

    for (let idx = 0; idx < gridPoints.length; idx++) {
      const point = gridPoints[idx];
      try {
        // Reverse geocode each point - get nearby places
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lng},${point.lat}.json?access_token=${mapboxToken}&types=poi,address,place&limit=10&radius=1000`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error || data.message) {
          console.error(`Mapbox API error for point ${idx + 1}:`, data.error || data.message);
          continue;
        }

        if (data.features && data.features.length > 0) {
          console.log(`Point ${idx + 1}/${gridPoints.length}: Found ${data.features.length} features`);
          data.features.forEach(feature => {
            const name = feature.place_name;
            const [lng, lat] = feature.center;
            
            // Only add if not seen before and within reasonable distance
            if (!seenNames.has(name) && lat && lng) {
              const distance = calculateDistance(campusCenter.lat, campusCenter.lng, lat, lng);
              if (distance <= 10) { // Within 10km of campus center (more lenient)
                seenNames.add(name);
                allPlaces.push({
                  name: name,
                  latitude: lat,
                  longitude: lng,
                  placeType: feature.place_type || [],
                  context: feature.context || []
                });
                console.log(`✓ Found place: ${name} (${distance.toFixed(2)}km away)`);
              } else {
                console.log(`✗ Too far: ${name} (${distance.toFixed(2)}km away)`);
              }
            }
          });
        } else {
          console.log(`Point ${idx + 1}/${gridPoints.length}: No features found`);
        }
        
        // Delay to respect rate limits (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        console.error(`Error reverse geocoding point ${point.lat}, ${point.lng}:`, error.message);
      }
    }

    // Strategy 2: Search for specific known place names from the map
    const knownPlaces = [
      'Mega Hostel', 'Ultra Mega Hostel', '1st Block', '2nd Block', '7th Block', '8th Block',
      '13th Block', '14th Block', 'Central Library', 'Vaishnavi NITW Canteen', 'Shinu Point',
      'Food Street', 'State Bank of India', "Director's Bungalow", 'Hostel Office',
      'Department of Civil Engineering', 'Department of Physical Education',
      "St Ann's Hospital", 'Bishop Berata High School', 'NIT Warangal'
    ];

    console.log(`Searching for ${knownPlaces.length} known place names...`);

    for (let idx = 0; idx < knownPlaces.length; idx++) {
      const placeName = knownPlaces[idx];
      try {
        // Try multiple search strategies
        const searchQueries = [
          placeName + ' Warangal',
          placeName + ' NIT Warangal',
          placeName,
          'NIT Warangal ' + placeName
        ];

        for (const query of searchQueries) {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&proximity=${campusCenter.lng},${campusCenter.lat}&bbox=${bbox}&limit=5`;
          const response = await fetch(url);
          const data = await response.json();

          if (data.error || data.message) {
            console.error(`Error for "${query}":`, data.error || data.message);
            continue;
          }

          if (data.features && data.features.length > 0) {
            console.log(`✓ Found ${data.features.length} results for "${query}"`);
            let found = false;
            data.features.forEach(feature => {
              const name = feature.place_name;
              const [lng, lat] = feature.center;
              
              if (!seenNames.has(name) && lat && lng) {
                const distance = calculateDistance(campusCenter.lat, campusCenter.lng, lat, lng);
                if (distance <= 15) { // Within 15km
                  seenNames.add(name);
                  allPlaces.push({
                    name: name,
                    latitude: lat,
                    longitude: lng,
                    placeType: feature.place_type || [],
                    context: feature.context || []
                  });
                  console.log(`  → Added: ${name} (${distance.toFixed(2)}km away)`);
                  found = true;
                }
              }
            });
            if (found) break; // Found a match, try next place
          }
          
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (error) {
        console.error(`Error searching for "${placeName}":`, error.message);
      }
    }

    console.log(`Found ${allPlaces.length} unique places from Mapbox`);

    // Now save to database
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const placeData of allPlaces) {
      const { name, latitude, longitude } = placeData;
      
      // Determine category based on name/keywords
      const nameLower = name.toLowerCase();
      let category = 'other';
      
      if (nameLower.includes('hostel') || nameLower.includes('block')) {
        category = 'hostel';
      } else if (nameLower.includes('library')) {
        category = 'library';
      } else if (nameLower.includes('canteen') || nameLower.includes('food') || nameLower.includes('mess') || nameLower.includes('restaurant') || nameLower.includes('cafe')) {
        category = 'eateries';
      } else if (nameLower.includes('stadium') || nameLower.includes('gym') || nameLower.includes('pool') || nameLower.includes('court') || nameLower.includes('ground')) {
        category = 'recreation';
      } else if (nameLower.includes('department') || nameLower.includes('school')) {
        category = 'educational';
      } else if (nameLower.includes('office') || nameLower.includes('administration')) {
        category = 'administration';
      } else if (nameLower.includes('quarters') || nameLower.includes('bungalow')) {
        category = 'staff_quarters';
      }

      // Check if place already exists
      const existing = await Place.findOne({ name: name.trim() });
      if (existing) {
        results.skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      try {
        const place = new Place({
          name: name.trim(),
          description: `Imported from Mapbox`,
          category: category,
          latitude: latitude,
          longitude: longitude,
          isActive: true
        });

        await place.save();
        results.success.push({
          name: place.name,
          coordinates: { lat: place.latitude, lng: place.longitude },
          category: place.category
        });
      } catch (error) {
        results.failed.push({ name, error: error.message });
      }
    }

    res.json({
      message: `Fetched and imported from Mapbox: ${results.success.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped, ${allPlaces.length} total found`,
      results,
      placesFound: allPlaces.length
    });
  } catch (error) {
    console.error('Error fetching from Mapbox:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Bulk import places with exact coordinates (no geocoding needed)
router.post('/bulk-import', async (req, res) => {
  try {
    const { places } = req.body;
    
    if (!places || !Array.isArray(places)) {
      return res.status(400).json({ error: 'Places array is required' });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const placeData of places) {
      const { name, category, description, latitude, longitude, openingHours, contactInfo } = placeData;
      
      if (!name) {
        results.failed.push({ name: name || 'Unknown', error: 'Name is required' });
        continue;
      }

      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        results.failed.push({ name, error: 'Valid latitude and longitude are required' });
        continue;
      }

      // Check if place already exists
      const existing = await Place.findOne({ name: name.trim() });
      if (existing) {
        results.skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      // Create place with provided coordinates
      const place = new Place({
        name: name.trim(),
        description: description || '',
        category: category || 'other',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        openingHours: openingHours || {},
        contactInfo: contactInfo || {},
        isActive: true
      });

      await place.save();
      results.success.push({
        name: place.name,
        coordinates: { lat: place.latitude, lng: place.longitude }
      });
    }

    res.json({
      message: `Bulk import completed: ${results.success.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

