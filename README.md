# Campus Navigation System

A full-stack web application for campus navigation with Mapbox integration, allowing users to create and manage custom routes.

## Features

- 🗺️ Interactive Mapbox map integration
- 🛣️ Create, edit, and delete custom routes
- 📍 Multiple waypoint support for each route
- 🎨 Customizable route colors
- 📱 Responsive design
- 🔄 Real-time route visualization

## Tech Stack

### Frontend
- React 18
- Mapbox GL JS
- Axios for API calls
- Modern CSS with responsive design

### Backend
- Node.js with Express
- MongoDB with Mongoose
- RESTful API

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Mapbox API key

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies** for all packages:
   ```bash
   npm run install-all
   ```
   
   Or install them separately:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Set up environment variables:**

   **Server (.env file in `/server` directory):**
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/campus_navigation
   MAPBOX_API_KEY=your_mapbox_api_key_here
   ```

   **Client (.env file in `/client` directory):**
   ```env
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_api_key_here
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB** (if using local MongoDB):
   ```bash
   mongod
   ```

5. **Run the application:**
   
   **Option 1: Run both server and client together**
   ```bash
   npm run dev
   ```
   
   **Option 2: Run separately**
   ```bash
   # Terminal 1 - Start server
   npm run server
   
   # Terminal 2 - Start client
   npm run client
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Usage

1. **Create a Route:**
   - Click "New Route" button
   - Enter route name and description
   - Add waypoints with latitude and longitude coordinates
   - Choose a color for the route
   - Click "Create Route"

2. **View Routes:**
   - Routes are displayed in the left panel
   - Click on a route to view it on the map
   - The map will automatically fit to show the selected route

3. **Edit Route:**
   - Click "Edit" on any route
   - Modify the details
   - Click "Update Route"

4. **Delete Route:**
   - Click "Delete" on any route
   - Confirm the deletion

## API Endpoints

- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get a specific route
- `POST /api/routes` - Create a new route
- `PUT /api/routes/:id` - Update a route
- `DELETE /api/routes/:id` - Delete a route
- `GET /api/health` - Health check

## Project Structure

```
campus-navigation-system/
├── server/
│   ├── models/
│   │   └── Route.js
│   ├── routes/
│   │   └── routeRoutes.js
│   ├── index.js
│   ├── package.json
│   └── .env
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapComponent.js
│   │   │   ├── RoutePanel.js
│   │   │   ├── RouteList.js
│   │   │   └── RouteForm.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── .env
├── package.json
└── README.md
```

## Getting Mapbox API Key

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Go to your account page
3. Navigate to "Access Tokens"
4. Copy your default public token or create a new one
5. Add it to both `.env` files as shown above

## Customization

### Default Map Location

Update the default map center in `client/src/components/MapComponent.js`:
```javascript
center: [-74.006, 40.7128], // Update with your campus coordinates
```

## Troubleshooting

- **MongoDB Connection Error:** Ensure MongoDB is running and the connection string in `.env` is correct
- **Mapbox Not Loading:** Verify your API key is correctly set in `client/.env`
- **CORS Errors:** Ensure the server is running and the proxy in `client/package.json` is correctly set

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

