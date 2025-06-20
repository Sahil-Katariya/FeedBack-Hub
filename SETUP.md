# FeedbackHub Setup Guide

## Quick Start

Follow these steps to get FeedbackHub running on your local machine:

### 1. Prerequisites

Make sure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)

### 2. Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start MongoDB:**
   - **Windows:** Open MongoDB Compass or start MongoDB service
   - **macOS:** `brew services start mongodb-community`
   - **Linux:** `sudo systemctl start mongod`

3. **Set up environment variables:**
   The `.env` file is already configured with default values. For production, update:
   ```
   JWT_SECRET=your_secure_jwt_secret_here
   MONGODB_URI=your_mongodb_connection_string
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

5. **Start the application:**
   ```bash
   npm start
   ```

6. **Open your browser:**
   Navigate to `http://localhost:5000`

## Features Available

### For Guests (Not Logged In)
- Browse the landing page
- View product information
- Read about FeedbackHub

### For Registered Users
- **Sign Up:** Create a new account
- **Login:** Access your profile page
- **Profile:** Unified page with dashboard functionality, personal info, and statistics
- **Add Reviews:** Submit reviews for products
- **Add Products:** Add new products to the platform
- **Profile Settings:** Edit profile information and change password
- **Notifications:** View system notifications

## Test the Application

1. **Create an account:**
   - Click "Sign Up" on the homepage
   - Fill in your details
   - Submit the form

2. **Login:**
   - Use your email and password
   - You'll be redirected to the dashboard

3. **Explore the profile page:**
   - View your personal information and statistics
   - Browse available products
   - Add reviews for products
   - Add new products
   - Edit your profile settings

## File Structure

```
FeedBack Hub v1.1.0/
├── server.js              # Main server file
├── profile.html           # Unified profile page with dashboard functionality
├── login.html             # Login page
├── signup.html            # Registration page
├── index.html             # Landing page
├── js/
│   ├── api.js            # API communication
│   ├── profile-menu.js   # Profile dropdown menu and settings
│   └── profile.js        # Unified profile page functionality
├── css/
│   └── dashboard.css     # Dashboard styles
├── scripts/
│   ├── seedData.js       # Database seeding
│   └── start.js          # Startup script
└── README.md             # Detailed documentation
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify MongoDB is accessible on port 27017

### Port Already in Use
- Change the PORT in `.env` file
- Or stop the process using port 5000

### Dependencies Issues
- Delete `node_modules` folder
- Run `npm install` again

### Browser Issues
- Clear browser cache
- Check browser console for errors
- Ensure JavaScript is enabled

## Next Steps

After setup, you can:
1. Customize the styling in CSS files
2. Add more product categories
3. Implement additional features
4. Deploy to a cloud platform

## Support

If you encounter any issues:
1. Check the console logs
2. Verify all prerequisites are installed
3. Ensure MongoDB is running
4. Check the README.md for detailed documentation

Happy coding! 🚀
