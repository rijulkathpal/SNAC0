const express = require('express');
const router = express.Router();
const Place = require('../models/Place');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');

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

// Predefined list of NIT Warangal places - populate database
router.post('/populate-college-places', async (req, res) => {
  try {
    const collegePlaces = [
      // Educational Buildings
      { name: 'NIT Warangal Main Building', category: 'educational', description: 'Main administrative and academic building' },
      { name: 'NIT Warangal CSE Department', category: 'educational', description: 'Computer Science and Engineering Department' },
      { name: 'NIT Warangal ECE Department', category: 'educational', description: 'Electronics and Communication Engineering Department' },
      { name: 'NIT Warangal Mechanical Department', category: 'educational', description: 'Mechanical Engineering Department' },
      { name: 'NIT Warangal Civil Department', category: 'educational', description: 'Civil Engineering Department' },
      { name: 'NIT Warangal Electrical Department', category: 'educational', description: 'Electrical Engineering Department' },
      { name: 'NIT Warangal Chemical Department', category: 'educational', description: 'Chemical Engineering Department' },
      { name: 'NIT Warangal Library', category: 'library', description: 'Central library with books and study spaces' },
      
      // Administration
      { name: 'NIT Warangal Registrar Office', category: 'administration', description: 'Registrar and administrative services' },
      { name: 'NIT Warangal Dean Office', category: 'administration', description: 'Dean of Academic Affairs office' },
      
      // Recreation
      { name: 'NIT Warangal Stadium', category: 'recreation', description: 'Main sports stadium' },
      { name: 'NIT Warangal Gymnasium', category: 'recreation', description: 'Gym and fitness center' },
      { name: 'NIT Warangal Swimming Pool', category: 'recreation', description: 'Swimming pool facility' },
      { name: 'NIT Warangal Badminton Court', category: 'recreation', description: 'Badminton courts' },
      { name: 'NIT Warangal Basketball Court', category: 'recreation', description: 'Basketball courts' },
      { name: 'NIT Warangal Cricket Ground', category: 'recreation', description: 'Cricket playing ground' },
      
      // Eateries
      { name: 'NIT Warangal Mess', category: 'eateries', description: 'Main mess/cafeteria' },
      { name: 'NIT Warangal Canteen', category: 'eateries', description: 'College canteen' },
      { name: 'NIT Warangal Food Court', category: 'eateries', description: 'Food court with various vendors' },
      
      // Hostels
      { name: 'NIT Warangal Hostel Block A', category: 'hostel', description: 'Boys hostel block A' },
      { name: 'NIT Warangal Hostel Block B', category: 'hostel', description: 'Boys hostel block B' },
      { name: 'NIT Warangal Girls Hostel', category: 'hostel', description: 'Girls hostel' },
      
      // Staff Quarters
      { name: 'NIT Warangal Staff Quarters', category: 'staff_quarters', description: 'Staff residential quarters' },
      
      // Other
      { name: 'NIT Warangal Gate', category: 'other', description: 'Main entrance gate' },
      { name: 'NIT Warangal Parking', category: 'other', description: 'Main parking area' },
      { name: 'NIT Warangal Medical Center', category: 'other', description: 'Health center and medical facility' },
    ];

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const placeData of collegePlaces) {
      const { name, category, description } = placeData;
      
      // Check if place already exists
      const existing = await Place.findOne({ name: name.trim() });
      if (existing) {
        results.skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      // Geocode using OpenStreetMap
      const geocodeResult = await geocodePlace(name, 'NIT Warangal, Warangal, Telangana, India');
      
      if (!geocodeResult) {
        // If geocoding fails, use approximate NIT Warangal coordinates
        const fallbackCoords = {
          latitude: 17.9833,
          longitude: 79.5300,
          displayName: name
        };
        
        const place = new Place({
          name: name.trim(),
          description: description || name,
          category: category || 'other',
          latitude: fallbackCoords.latitude,
          longitude: fallbackCoords.longitude,
          isActive: true
        });

        await place.save();
        results.success.push({
          name: place.name,
          coordinates: { lat: place.latitude, lng: place.longitude },
          note: 'Used approximate coordinates'
        });
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
      message: `College places populated: ${results.success.length} created, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      results
    });
  } catch (error) {
    console.error('Populate error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

