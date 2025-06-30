# FeedbackHub Admin Panel Guide

## Overview

The FeedbackHub Admin Panel provides comprehensive administrative functionality for managing users, products, reviews, system analytics, bulk operations, and system monitoring. This enhanced admin panel includes advanced features for efficient platform management.

## 🆕 New Features in v1.1.0

- **Enhanced Authentication**: Improved login flow with better error handling
- **Moderator Role**: New user role with limited admin privileges
- **Bulk Operations**: Mass actions for users, products, and reviews
- **System Health Monitoring**: Real-time system status and performance metrics
- **Data Export**: Export functionality for users, products, and reviews (JSON/CSV)
- **Activity Logs**: System activity monitoring and logging
- **Advanced Analytics**: Enhanced reporting with configurable time periods
- **System Settings**: Centralized system configuration management

## Getting Started

### Creating an Admin User

1. **Run the admin creation script:**
   ```bash
   npm run create-admin
   ```

2. **Custom admin user (with arguments):**
   ```bash
   node scripts/createAdmin.js "John" "Doe" "john@example.com" "securepassword" "New York" "Lead Administrator"
   ```

3. **Default admin credentials:**
   - Email: `admin@feedbackhub.com`
   - Password: `admin123`
   - **⚠️ Important:** Change the password after first login

4. **Test admin functionality:**
   ```bash
   npm run test-admin
   ```

### Accessing the Admin Panel

1. **Login with admin credentials** at `/login.html`
2. **Navigate to admin panel** at `/admin.html` or use the "Admin Panel" link in the profile dropdown
3. **Admin access is restricted** - only users with `role: 'admin'` can access the panel

## Admin Panel Features

### 1. Dashboard Overview

**Location:** `/admin.html` (Dashboard section)

**Features:**
- **System Statistics:** Total users, products, reviews, and average rating
- **Activity Metrics:** Active users, recent registrations, and weekly activity
- **Recent Activity:** Latest user registrations and reviews
- **Quick Navigation:** Direct links to detailed management sections

**Key Metrics:**
- Total Users with active user count
- Total Products with weekly additions
- Total Reviews with weekly submissions
- Average Rating across all products

### 2. User Management

**Location:** Admin Panel → Users section

**Features:**
- **User Listing:** Paginated table of all users
- **Search & Filter:** By name, email, role, and status
- **User Details:** Profile information, registration date, last login
- **Role Management:** Promote/demote users (user ↔ admin)
- **Account Status:** Activate/deactivate user accounts
- **User Deletion:** Remove users and associated data

**Available Actions:**
- Edit user role and status
- Delete user account (removes reviews and notifications)
- View user activity and statistics

**Search Options:**
- Text search: Name, email
- Role filter: User, Admin
- Status filter: Active, Inactive

### 3. Product Management

**Location:** Admin Panel → Products section

**Features:**
- **Product Listing:** All products with statistics
- **Search & Filter:** By name, description, category
- **Product Details:** Name, description, price, category, image
- **Review Statistics:** Review count and average rating per product
- **Product Editing:** Update product information
- **Product Deletion:** Remove products and associated reviews

**Available Actions:**
- Edit product details (name, description, price, category, image)
- Delete product (removes all associated reviews)
- View product analytics and reviews

**Product Information:**
- Basic details (name, description, price)
- Category and image URL
- Review count and average rating
- Creation date

### 4. Review Management

**Location:** Admin Panel → Reviews section

**Features:**
- **Review Listing:** All reviews with user and product information
- **Search & Filter:** By content, rating, verification status
- **Review Moderation:** Verify/unverify reviews
- **Review Details:** Full content, user info, product info
- **Review Deletion:** Remove inappropriate reviews

**Available Actions:**
- Toggle review verification status
- Delete reviews
- View full review content and context

**Filter Options:**
- Text search: Review content
- Rating filter: 1-5 stars
- Verification status: Verified, Unverified

### 5. Analytics & Reports

**Location:** Admin Panel → Analytics section

**Features:**
- **User Registration Trends:** Track user growth over time
- **Review Activity:** Monitor review submission patterns
- **Top Categories:** Most popular product categories
- **Rating Distribution:** Breakdown of review ratings
- **Time Period Selection:** 7, 30, or 90-day views

**Analytics Data:**
- User registration trends by date
- Review submission patterns
- Category popularity rankings
- Rating distribution (1-5 stars)

### 6. Bulk Operations

**Location:** Admin Panel → Bulk Operations section

**Features:**
- **Bulk User Operations:** Mass actions on multiple users
- **Bulk Product Operations:** Mass actions on multiple products
- **Bulk Review Operations:** Mass actions on multiple reviews
- **ID-based Operations:** Use comma-separated IDs for targeted actions

**User Bulk Actions:**
- Activate/Deactivate multiple users
- Update user roles (user, moderator, admin)
- Delete multiple users and associated data

**Product Bulk Actions:**
- Update categories for multiple products
- Apply price multipliers (bulk price changes)
- Delete multiple products and associated reviews

**Review Bulk Actions:**
- Verify/unverify multiple reviews
- Delete multiple reviews

### 7. System Management

**Location:** Admin Panel → System section

**Features:**
- **System Health Monitoring:** Real-time system status
- **Data Export:** Download data in JSON or CSV format
- **System Settings:** View and manage system configuration

**Health Metrics:**
- System status and uptime
- Database connectivity and response time
- Memory usage and performance
- Node.js version and platform info

**Export Options:**
- Users data (with privacy considerations)
- Products data (complete product catalog)
- Reviews data (with user and product context)
- Multiple formats: JSON, CSV

**System Settings:**
- Site configuration
- User registration settings
- Security parameters
- Feature toggles

### 8. Activity Logs

**Location:** Admin Panel → Activity Logs section

**Features:**
- **System Activity Monitoring:** Track user and admin actions
- **Log Filtering:** Filter by log type and time period
- **Security Monitoring:** Monitor login attempts and admin actions

**Log Types:**
- User login events
- Admin actions and changes
- System errors and warnings
- Security-related events

**Log Information:**
- Timestamp and event type
- User ID and IP address
- Action description and context
- System-generated events

## API Endpoints

### Admin Authentication
All admin endpoints require authentication with admin role.

**Headers Required:**
```
x-auth-token: <JWT_TOKEN>
```

### Dashboard Stats
```
GET /api/admin/stats
```
Returns overview statistics and recent activity metrics.

### User Management
```
GET /api/admin/users?page=1&limit=10&search=&role=&status=
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
```

### Product Management
```
GET /api/admin/products?page=1&limit=10&search=&category=
PUT /api/admin/products/:id
DELETE /api/admin/products/:id
```

### Review Management
```
GET /api/admin/reviews?page=1&limit=10&search=&rating=&verified=
PUT /api/admin/reviews/:id
DELETE /api/admin/reviews/:id
```

### Analytics
```
GET /api/admin/analytics?period=30
```

### Bulk Operations (Admin Only)
```
POST /api/admin/bulk/users
POST /api/admin/bulk/products
POST /api/admin/bulk/reviews
```

### System Management (Admin Only)
```
GET /api/admin/settings
GET /api/admin/health
GET /api/admin/export/:type?format=json|csv
GET /api/admin/logs?page=1&limit=50&type=all
```

### User Info
```
GET /api/auth/me
```

## User Roles

### Role Hierarchy
1. **User** - Standard user with basic access
2. **Moderator** - Limited admin access for content moderation
3. **Admin** - Full administrative access

### Role Permissions

**User Role:**
- View and submit reviews
- Manage own profile
- Access public content

**Moderator Role:**
- All user permissions
- Access admin panel (limited)
- Manage reviews (verify/delete)
- View user and product data
- Access analytics and logs

**Admin Role:**
- All moderator permissions
- Full user management (create/edit/delete)
- Full product management
- Bulk operations
- System settings and health
- Data export functionality

## Security Features

### Role-Based Access Control
- **Admin/Moderator Required:** Admin endpoints check for appropriate roles
- **JWT Authentication:** Secure token-based authentication
- **Route Protection:** Admin pages redirect unauthorized users
- **Granular Permissions:** Different access levels for different roles

### Data Protection
- **Input Validation:** All inputs are validated and sanitized
- **Secure Deletion:** Cascading deletes for data integrity
- **Audit Trail:** Actions are logged for security monitoring

### User Account Security
- **Password Hashing:** bcryptjs with salt rounds
- **Account Status:** Ability to deactivate compromised accounts
- **Session Management:** JWT token expiration and validation

## Best Practices

### User Management
1. **Regular Review:** Periodically review user accounts and roles
2. **Inactive Accounts:** Deactivate unused accounts for security
3. **Role Assignment:** Only assign admin roles to trusted users
4. **Data Cleanup:** Remove test accounts and inactive users

### Content Moderation
1. **Review Verification:** Verify legitimate reviews to build trust
2. **Spam Detection:** Remove fake or spam reviews promptly
3. **Content Guidelines:** Enforce community standards consistently
4. **User Feedback:** Respond to user reports about inappropriate content

### System Monitoring
1. **Regular Analytics Review:** Monitor trends and patterns
2. **Performance Tracking:** Watch for unusual activity spikes
3. **Data Backup:** Ensure regular database backups
4. **Security Updates:** Keep system dependencies updated

## Troubleshooting

### Common Issues

**Admin Access Denied:**
- Verify user has `role: 'admin'` in database
- Check JWT token validity
- Ensure proper authentication headers

**Data Not Loading:**
- Check server connection and database status
- Verify API endpoints are responding
- Check browser console for JavaScript errors

**Permission Errors:**
- Confirm admin role assignment
- Verify token hasn't expired
- Check middleware authentication

### Support

For technical support or questions about the admin panel:
1. Check server logs for error details
2. Verify database connectivity
3. Review API response codes and messages
4. Contact system administrator for access issues

## Future Enhancements

### Planned Features
- **Advanced Analytics:** More detailed reporting and charts
- **Bulk Operations:** Mass user/product management
- **Export Functionality:** Data export to CSV/Excel
- **Notification System:** Admin alerts and notifications
- **Audit Logs:** Detailed action logging and history

### Integration Opportunities
- **Email Notifications:** Automated admin alerts
- **Third-party Analytics:** Google Analytics integration
- **Backup Systems:** Automated data backup solutions
- **Monitoring Tools:** System health monitoring

---

**Built for FeedbackHub v1.1.0** - Comprehensive admin functionality for effective platform management.
