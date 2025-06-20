# FeedBack Hub v1.1.0

A comprehensive platform for product reviews and feedback aggregation.

## Features

- **Product Reviews**: Browse and read detailed product reviews
- **User Authentication**: Secure login and registration system
- **Review Submission**: Submit your own product reviews
- **Dashboard**: Personal dashboard for managing reviews
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
```bash
git clone <repository-url>
cd "FeedBack Hub v1.1.0"
```

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

6. Start the development server:
```bash
npm run dev
```

7. Open your browser and navigate to `http://localhost:5000`

## Usage

1. **Registration**: Create a new account using the signup form
2. **Login**: Access your account with email and password
3. **Browse Products**: View available products on the dashboard
4. **Submit Reviews**: Add reviews for products you've used
5. **View Reviews**: Read reviews from other users

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/user` - Get current user profile (protected)

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
├── dashboard.html        # User dashboard
├── css/
│   └── dashboard.css     # Dashboard-specific styles
├── js/
│   ├── api.js           # API communication functions
│   └── dashboard.js     # Dashboard functionality
├── scripts/
│   └── seedData.js      # Database seeding script
└── images/              # Static images and assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email contact@feedbackhub.com or create an issue in the repository.
