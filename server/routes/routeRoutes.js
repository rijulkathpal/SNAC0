const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { body, validationResult } = require('express-validator');

// Get all routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single route by ID
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new route
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Route name is required'),
    body('waypoints').isArray({ min: 2 }).withMessage('At least 2 waypoints are required'),
    body('waypoints.*.latitude').isFloat().withMessage('Valid latitude is required'),
    body('waypoints.*.longitude').isFloat().withMessage('Valid longitude is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const route = new Route(req.body);
      // Ensure waypoints have order
      route.waypoints = route.waypoints.map((waypoint, index) => ({
        ...waypoint,
        order: waypoint.order !== undefined ? waypoint.order : index
      }));

      await route.save();
      res.status(201).json(route);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Update a route
router.put('/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a route
router.delete('/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully', route });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

