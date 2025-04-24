# MongoDB Atlas Setup Guide for SportNexus Hub

This guide will help you set up a free MongoDB Atlas cluster for use with the SportNexus Hub application.

## Step 1: Create a MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Complete the registration process

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose the "FREE" option (M0 Sandbox)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose the region closest to you
5. Click "Create Cluster" (this may take a few minutes to provision)

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access" under SECURITY
2. Click "Add New Database User"
3. Create a new user with a strong password
   - Authentication Method: Password
   - Password Authentication: Choose a secure password
   - Database User Privileges: "Read and write to any database"
4. Click "Add User"

## Step 4: Configure Network Access

1. In the left sidebar, click "Network Access" under SECURITY
2. Click "Add IP Address"
3. For development, you can choose "Allow Access from Anywhere" (not recommended for production)
   - Or add your specific IP address for better security
4. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to the "Database" section
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as your driver and the latest version
5. Copy the connection string provided

## Step 6: Update Your Environment Variables

1. Open the `.env` file in the `backend` directory
2. Replace the `MONGODB_URI` value with your connection string
3. Make sure to replace `<password>` with your actual database user password
4. Replace `<dbname>` with `sportnexus` (or your preferred database name)

Example:
```
MONGODB_URI=mongodb+srv://username:your_password@cluster0.abcd123.mongodb.net/sportnexus?retryWrites=true&w=majority
```

## Step 7: Restart Your Application

1. Stop your backend server if it's running
2. Start it again with `npm run dev`
3. Your application should now connect to MongoDB Atlas

## Troubleshooting

- **Connection Timeout**: Make sure your IP address is allowed in the Network Access settings
- **Authentication Failed**: Double-check your username and password in the connection string
- **Connection String Format**: Ensure your connection string has the correct format

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Node.js Driver Documentation](https://docs.mongodb.com/drivers/node/) 