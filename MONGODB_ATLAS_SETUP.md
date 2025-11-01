# MongoDB Atlas Setup Guide

## Step-by-Step Instructions

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (no credit card required for free tier)
3. Verify your email address

### Step 2: Create a Free Cluster
1. After logging in, you'll see "Create a Deployment" or "Build a Database"
2. Choose **FREE** (M0) tier
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Give your cluster a name (e.g., "Cluster0") - default name is fine
6. Click **"Create Deployment"**

**Note:** Cluster creation takes 3-5 minutes

### Step 3: Create Database User
1. While the cluster is creating, you'll be asked to create a database user
2. **Username:** Create a username (e.g., "admin" or your name)
3. **Password:** Create a strong password (SAVE THIS - you'll need it!)
4. Click **"Create Database User"**

### Step 4: Set Network Access
1. You'll see "Where would you like to connect from?"
2. Click **"Add My Current IP Address"** (for development)
3. Or click **"Allow Access from Anywhere"** and enter `0.0.0.0/0` (less secure but easier)
4. Click **"Add Entry"**

### Step 5: Get Connection String
1. After cluster is created, click **"Connect"** button
2. Choose **"Connect your application"**
3. Select **"Node.js"** as driver
4. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANT:** Replace `<username>` and `<password>` with your actual username and password
6. **IMPORTANT:** Add your database name at the end, like this:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/campus_navigation?retryWrites=true&w=majority
   ```

### Step 6: Complete Connection String Format
Your final connection string should look like:
```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/campus_navigation?retryWrites=true&w=majority
```

Where:
- `myuser` = your database username
- `mypassword` = your database password (URL-encode special characters if any)
- `cluster0.abc123.mongodb.net` = your cluster address
- `campus_navigation` = database name

## Quick Checklist
- [ ] MongoDB Atlas account created
- [ ] Free cluster created (M0 tier)
- [ ] Database user created (username & password saved)
- [ ] Network access configured (IP address added)
- [ ] Connection string copied with username/password replaced
- [ ] Database name added to connection string

## Next Steps
Once you have your connection string, paste it here and I'll update your `server/.env` file!

