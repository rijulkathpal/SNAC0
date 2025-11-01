# Campus Navigation System - Setup Guide

## ✅ Project Status

Your full-stack campus navigation system is ready! All dependencies are installed and the codebase has been enhanced with map-clicking functionality.

## 📋 What You Need

Before running the application, you need:

1. **Mapbox API Key** - You mentioned you'll provide this later
2. **MongoDB** - Either:
   - Local MongoDB installation, OR
   - MongoDB Atlas (cloud database) connection string

## 🚀 Quick Setup Steps

### Step 1: Create Environment Files

Create two `.env` files (they're ignored by git for security):

#### 1. `server/.env`
Create this file with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus_navigation
MAPBOX_API_KEY=your_mapbox_api_key_here
```

#### 2. `client/.env`
Create this file with:
```env
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_api_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

**Important:** Replace `your_mapbox_api_key_here` with your actual Mapbox API key in both files.

### Step 2: Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB on your machine
- Start MongoDB service: `mongod` (or start it as a Windows service)
- The default connection string `mongodb://localhost:27017/campus_navigation` will work

**Option B: MongoDB Atlas (Cloud)**
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string
- Replace `MONGODB_URI` in `server/.env` with your Atlas connection string

### Step 3: Get Your Mapbox API Key

1. Sign up at [Mapbox](https://www.mapbox.com/) (free account available)
2. Go to your account page → "Access Tokens"
3. Copy your default public token
4. Add it to both `.env` files

### Step 4: Run the Application

You have two options:

**Option 1: Run both together (Recommended)**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## 🎯 Features

Your campus navigation system includes:

✅ **Interactive Mapbox Map** - Full map integration with Mapbox GL JS
✅ **Create Custom Routes** - Add routes with multiple waypoints
✅ **Edit Routes** - Update route details, waypoints, and colors
✅ **Delete Routes** - Remove routes you no longer need
✅ **Map Clicking** - Click on the map to add waypoints (NEW!)
✅ **Manual Waypoint Entry** - Or enter coordinates manually
✅ **Route Visualization** - See all routes on the map with custom colors
✅ **Route Selection** - Click routes to highlight and zoom
✅ **Responsive Design** - Works on desktop and mobile

## 📝 How to Use

### Creating a Route (Method 1: Map Clicking)
1. Click "New Route" button
2. Enter route name and description (optional)
3. Click "🖱️ Click Map" button to enable map clicking
4. Click anywhere on the map to add waypoints
5. Optionally add names to waypoints
6. Choose a color for your route
7. Click "Create Route"

### Creating a Route (Method 2: Manual Entry)
1. Click "New Route" button
2. Enter route name and description
3. Click "+ Add Manually" to add waypoints
4. Enter latitude and longitude for each waypoint
5. Reorder waypoints using ↑ ↓ buttons if needed
6. Choose a color
7. Click "Create Route"

### Viewing Routes
- All routes appear in the left panel
- Click a route to view it on the map
- The map automatically zooms to show the selected route
- Routes are displayed with their custom colors

### Editing Routes
- Click "Edit" on any route
- Modify the details, waypoints, or color
- Use map clicking or manual entry to add more waypoints
- Click "Update Route"

### Deleting Routes
- Click "Delete" on any route
- Confirm deletion

## 🔧 Troubleshooting

### Mapbox Not Loading
- Check that `REACT_APP_MAPBOX_ACCESS_TOKEN` is set in `client/.env`
- Make sure your Mapbox API key is valid
- Restart the React development server after changing `.env`

### MongoDB Connection Error
- Ensure MongoDB is running (if using local)
- Check your `MONGODB_URI` in `server/.env`
- Verify network connectivity (if using Atlas)
- Check MongoDB connection logs in the server console

### CORS Errors
- Ensure the server is running on port 5000
- Check that `REACT_APP_API_URL` in `client/.env` matches your server URL

### Routes Not Saving
- Check that MongoDB is connected (look for "MongoDB connected successfully" in server logs)
- Verify server is running and accessible
- Check browser console for errors

## 📁 Project Structure

```
SNACO/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapComponent.js    # Mapbox map component
│   │   │   ├── RouteForm.js       # Route creation/editing form
│   │   │   ├── RouteList.js       # List of routes
│   │   │   └── RoutePanel.js      # Side panel container
│   │   ├── App.js
│   │   └── index.js
│   └── .env         # Frontend environment variables
├── server/          # Node.js/Express backend
│   ├── models/
│   │   └── Route.js          # MongoDB schema
│   ├── routes/
│   │   └── routeRoutes.js    # API endpoints
│   ├── index.js
│   └── .env         # Backend environment variables
└── README.md
```

## 🎨 Customization

### Default Map Location
To change the default map center (currently set to NYC), edit `client/src/components/MapComponent.js`:
```javascript
center: [-74.006, 40.7128], // Change to your campus coordinates
zoom: 15 // Adjust zoom level
```

### Default Route Color
Change the default route color in `server/models/Route.js`:
```javascript
default: '#3b82f6' // Change to your preferred color
```

## 📚 API Endpoints

- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get a specific route
- `POST /api/routes` - Create a new route
- `PUT /api/routes/:id` - Update a route
- `DELETE /api/routes/:id` - Delete a route
- `GET /api/health` - Health check

## 🔒 Security Notes

- Never commit `.env` files to git (they're already in `.gitignore`)
- Keep your Mapbox API key secure
- Use environment-specific configurations for production

## 📞 Next Steps

1. Create the `.env` files as described above
2. Add your Mapbox API key to both files
3. Set up MongoDB (local or Atlas)
4. Run `npm run dev` to start the application
5. Open http://localhost:3000 in your browser

If you encounter any issues, check the console logs (both browser and terminal) for error messages.

---

**Note:** The SRS document (Smart_Campus_Navigation_SRS.docx) is in your project folder. Review it for additional requirements that may need to be implemented.

