const API_URL = 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  getUser: async () => {
    try {
      console.log('🔄 Fetching user data from:', `${API_URL}/api/user`);
      const token = getToken();
      console.log('🔑 Using token:', token ? token.substring(0, 20) + '...' : 'No token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.status === 401) {
        console.log('🔄 Token expired or invalid, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication failed - token expired');
      }

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || 'Unknown error';
        } catch {
          errorText = await response.text();
        }
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to fetch user data: ${response.status} - ${errorText}`);
      }

      const userData = await response.json();
      console.log('✅ User data received:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Get user API error:', error);

      // If it's a network error, provide a more helpful message
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }

      throw error;
    }
  },

  getReviews: async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return await response.json();
    } catch (error) {
      console.error('Get reviews API error:', error);
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getToken()
        },
        body: JSON.stringify(reviewData)
      });
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      return await response.json();
    } catch (error) {
      console.error('Submit review API error:', error);
      throw error;
    }
  },

  getProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Get products API error:', error);
      throw error;
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getToken()
        },
        body: JSON.stringify(productData)
      });
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
      return await response.json();
    } catch (error) {
      console.error('Add product API error:', error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'x-auth-token': getToken()
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      return await response.json();
    } catch (error) {
      console.error('Get notifications API error:', error);
      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'x-auth-token': getToken()
        }
      });
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      return await response.json();
    } catch (error) {
      console.error('Mark notification read API error:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      console.log('🔄 Fetching dashboard stats from:', `${API_URL}/api/dashboard/stats`);
      const token = getToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('📡 Dashboard stats response status:', response.status);

      if (response.status === 401) {
        console.log('🔄 Token expired or invalid for dashboard stats');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication failed - token expired');
      }

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || 'Unknown error';
        } catch {
          errorText = await response.text();
        }
        console.error('❌ Dashboard stats API Error:', errorText);
        throw new Error(`Failed to fetch dashboard stats: ${response.status} - ${errorText}`);
      }

      const dashboardStats = await response.json();
      console.log('✅ Dashboard stats received:', dashboardStats);
      return dashboardStats;
    } catch (error) {
      console.error('❌ Get dashboard stats API error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server for dashboard stats');
      }

      throw error;
    }
  },

  getProductReviews: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/product/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product reviews');
      }
      return await response.json();
    } catch (error) {
      console.error('Get product reviews API error:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getToken()
        },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      return await response.json();
    } catch (error) {
      console.error('Update profile API error:', error);
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': getToken()
        },
        body: JSON.stringify(passwordData)
      });
      if (!response.ok) {
        throw new Error('Failed to update password');
      }
      return await response.json();
    } catch (error) {
      console.error('Update password API error:', error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      console.log('🔄 Fetching user stats from:', `${API_URL}/api/user/stats`);
      const token = getToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/user/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });

      console.log('📡 User stats response status:', response.status);

      if (response.status === 401) {
        console.log('🔄 Token expired or invalid for user stats');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication failed - token expired');
      }

      if (!response.ok) {
        let errorText;
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorData.message || 'Unknown error';
        } catch {
          errorText = await response.text();
        }
        console.error('❌ User stats API Error:', errorText);
        throw new Error(`Failed to fetch user stats: ${response.status} - ${errorText}`);
      }

      const userStats = await response.json();
      console.log('✅ User stats received:', userStats);
      return userStats;
    } catch (error) {
      console.error('❌ Get user stats API error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server for user stats');
      }

      throw error;
    }
  },

  getProduct: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error('Get product API error:', error);
      throw error;
    }
  },

  getProductAnalytics: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}/analytics`);
      if (!response.ok) {
        throw new Error('Failed to fetch product analytics');
      }
      return await response.json();
    } catch (error) {
      console.error('Get product analytics API error:', error);
      throw error;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}