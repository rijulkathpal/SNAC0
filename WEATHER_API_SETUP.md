# Weather API Setup Guide

## OpenWeatherMap API Setup

To enable weather functionality, you need to get a free API key from OpenWeatherMap:

### Step 1: Sign Up
1. Go to https://openweathermap.org/api
2. Click "Sign Up" or "Sign In" if you already have an account
3. Create a free account (no credit card required)

### Step 2: Get API Key
1. After logging in, go to your API keys page: https://home.openweathermap.org/api_keys
2. You'll see a default API key, or you can generate a new one
3. Copy your API key

### Step 3: Add to Server .env
Add the following line to `server/.env`:

```
OPENWEATHER_API_KEY=your_api_key_here
```

### Step 4: Restart Server
Restart your server for the changes to take effect.

## Free Tier Limits
- 60 calls/minute
- 1,000,000 calls/month
- More than enough for development and moderate use

## Features Enabled
Once configured, weather information will show:
- Current temperature
- "Feels like" temperature
- Weather description (cloudy, sunny, etc.)
- Humidity
- Wind speed
- Location name

Weather data appears in the Place Details modal when you click on a place.

