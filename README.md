# FeedBack Hub 

A comprehensive platform for product reviews and feedback aggregation.

## Features

- **Product Reviews**: Browse and read detailed product reviews
- **User Authentication**: Secure login and registration system
- **Review Submission**: Submit your own product reviews
- **Unified Profile**: Combined profile and dashboard functionality in one comprehensive page
- **AI Product Review Aggregator**: Advanced AI-powered analysis of product reviews
- **Profile Settings**: Edit profile information, change password, and upload avatar
- **Profile Menu**: Dropdown menu with quick access to dashboard, profile, settings
- **Admin Panel**: Comprehensive administrative interface for managing users, products, and reviews
- **Role-Based Access**: User and admin roles with appropriate permissions
- **System Analytics**: Detailed analytics and reporting for administrators
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Bootstrap, Custom CSS

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. Clone the repository:

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/feedbackhub
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start MongoDB service (if running locally)

5. Seed the database with sample data:
```bash
node scripts/seedData.js
```

6. Create an admin user (optional):
```bash
npm run create-admin
```
Default admin credentials: `admin@feedbackhub.com` / `admin123`

7. Start the development server:
```bash
npm run dev
```

8. Open your browser and navigate to `http://localhost:5000`

## Usage

1. **Registration**: Create a new account using the signup form
2. **Login**: Access your account with email and password
3. **Profile**: Unified page with dashboard functionality, personal info, and statistics
5. **AI Product Analysis**: View detailed AI-powered analysis of product reviews
6. **Profile Settings**: Edit your profile information and change password
7. **Profile Menu**: Access quick actions via the profile icon dropdown
8. **Submit Reviews**: Add reviews for products you've used
9. **View Reviews**: Read reviews from other users
10. **Admin Panel**: Access comprehensive admin functionality (admin users only)
    - User management and role assignment
    - Product management and moderation
    - Review management and verification
    - System analytics and reporting

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/user` - Get current user profile (protected)
- `PUT /api/user/profile` - Update user profile information (protected)
- `PUT /api/user/password` - Update user password (protected)
- `GET /api/user/stats` - Get user statistics and activity (protected)

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product (protected)
- `GET /api/products/:id` - Get specific product

### Reviews
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Submit new review (protected)
- `GET /api/reviews/product/:productId` - Get reviews for specific product

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (protected)

### Notifications
- `GET /api/notifications` - Get user notifications (protected)
- `PUT /api/notifications/:id/read` - Mark notification as read (protected)

### AI Product Analysis
- `GET /api/products/:id/analytics` - Get comprehensive product analytics and review insights

### Admin (Admin Role Required)
- `GET /api/admin/stats` - Get admin dashboard statistics
- `GET /api/admin/users` - Get all users with pagination and filtering
- `PUT /api/admin/users/:id` - Update user role and status
- `DELETE /api/admin/users/:id` - Delete user account
- `GET /api/admin/products` - Get all products with admin details
- `PUT /api/admin/products/:id` - Update product information
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/reviews` - Get all reviews with admin details
- `PUT /api/admin/reviews/:id` - Update review verification status
- `DELETE /api/admin/reviews/:id` - Delete review
- `GET /api/admin/analytics` - Get system analytics and trends

## Project Structure

```
FeedBack Hub v1.1.0/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
├── index.html            # Main landing page
├── login.html            # Login page
├── signup.html           # Registration page
├── profile.html          # Unified profile page with dashboard functionality
├── product.html          # AI-powered product review analysis page
├── admin.html            # Admin panel for system management
├── css/
│   ├── dashboard.css     # Dashboard-specific styles
│   ├── profile-menu.css  # Profile menu and settings styles
│   ├── product.css       # Product page and AI analysis styles
│   └── admin.css         # Admin panel styles
├── js/
│   ├── api.js           # API communication functions
│   ├── profile-menu.js  # Profile dropdown menu and settings
│   ├── profile.js       # Unified profile page with dashboard functionality
│   ├── ai-analysis.js   # AI review analysis engine
│   ├── product.js       # Product page functionality
│   └── admin.js         # Admin panel functionality
├── scripts/
│   ├── seedData.js      # Database seeding script
│   └── createAdmin.js   # Admin user creation script
└── images/              # Static images and assets
```

## Admin Panel

The FeedbackHub admin panel provides comprehensive administrative functionality for managing the platform.

### Admin Features

- **Dashboard Overview**: System statistics and recent activity
- **User Management**: View, edit, and manage user accounts and roles
- **Product Management**: Add, edit, and remove products
- **Review Management**: Moderate and verify user reviews
- **Analytics**: View system analytics and trends

### Admin Access

1. **Create Admin User**: Run `npm run create-admin` to create an admin account
2. **Login**: Use admin credentials to log in
3. **Access Panel**: Navigate to `/admin.html` or use the "Admin Panel" link in the profile dropdown

### Default Admin Credentials

- **Email**: `admin@feedbackhub.com`
- **Password**: `admin123`
- **⚠️ Important**: Change the password after first login

For detailed admin documentation, see [ADMIN_GUIDE.md](ADMIN_GUIDE.md).

