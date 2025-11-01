# Places Import Guide

Since Mapbox API isn't returning good results for your campus, we've set up a system to use only database places. Here's how to add places:

## Method 1: Bulk Import via API (Recommended)

### Step 1: Prepare your places JSON
Create a JSON file with all your places. See `PLACES_IMPORT_EXAMPLE.json` for format.

Each place needs:
- `name` (required)
- `latitude` (required)
- `longitude` (required)
- `category` (optional, defaults to 'other')
- `description` (optional)
- `openingHours` (optional)
- `contactInfo` (optional)

### Step 2: Send POST request
Use curl, Postman, or any HTTP client:

```bash
curl -X POST http://localhost:5000/api/places/bulk-import \
  -H "Content-Type: application/json" \
  -d @PLACES_IMPORT_EXAMPLE.json
```

Or using fetch in browser console:
```javascript
fetch('http://localhost:5000/api/places/bulk-import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    places: [
      {
        name: "Mega Hostel",
        category: "hostel",
        description: "Mega Hostel - Boys hostel",
        latitude: 17.9808,
        longitude: 79.5328
      },
      // ... more places
    ]
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

### Step 3: Verify
Check the Places panel in your app - the imported places should appear!

## Method 2: Add Places via UI

1. Open your app
2. Go to the Places panel
3. Click "+ Add Place"
4. Fill in:
   - Name (required)
   - Category (required)
   - Latitude & Longitude (required) - get these from your map
   - Description (optional)
   - Opening hours (optional)
   - Contact info (optional)
5. Click "Create Place"

## Method 3: Add via API directly

```bash
curl -X POST http://localhost:5000/api/places \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mega Hostel",
    "category": "hostel",
    "description": "Mega Hostel - Boys hostel",
    "latitude": 17.9808,
    "longitude": 79.5328
  }'
```

## Getting Coordinates from Map

1. Open your map in the app
2. Right-click on a location → Copy coordinates (if available)
3. Or check the map markers - they have coordinates in their popups
4. Or use browser dev tools to inspect map click events

## Example Places from Your Map

Based on the map you showed, here are places you can add:
- Mega Hostel, Ultra Mega Hostel
- 1st-14th Blocks (hostels)
- Central Library
- Vaishnavi NITW Canteen, Shinu Point, Food Street
- State Bank of India
- Director's Bungalow
- Hostel Office
- Various Departments
- St Ann's Hospital
- Bishop Berata High School

See `PLACES_IMPORT_EXAMPLE.json` for a complete example.

## After Importing

Once places are in the database:
- They'll automatically appear in search results
- They'll show up on the map
- They'll be searchable in NavigationPanel
- No more Mapbox API dependency!

## Notes

- Places with same name will be skipped (won't duplicate)
- Coordinates should be accurate (use exact lat/lng from map)
- Category must be one of: eateries, recreation, educational, administration, staff_quarters, hostel, library, other

