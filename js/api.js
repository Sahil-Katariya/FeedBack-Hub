const API_URL = "http://localhost:5000";

const getToken = () => localStorage.getItem("token");

const api = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error("Register API error:", error);
      throw error;
    }
  },

  getUser: async () => {
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        headers: {
          "x-auth-token": getToken(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      return await response.json();
    } catch (error) {
      console.error("Get user API error:", error);
      throw error;
    }
  },

  getReviews: async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return await response.json();
    } catch (error) {
      console.error("Get reviews API error:", error);
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken(),
        },
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) {
        throw new Error("Failed to submit review");
      }
      return await response.json();
    } catch (error) {
      console.error("Submit review API error:", error);
      throw error;
    }
  },

  getProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return await response.json();
    } catch (error) {
      console.error("Get products API error:", error);
      throw error;
    }
  },

  addProduct: async (productData) => {
    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken(),
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error("Failed to add product");
      }
      return await response.json();
    } catch (error) {
      console.error("Add product API error:", error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          "x-auth-token": getToken(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return await response.json();
    } catch (error) {
      console.error("Get notifications API error:", error);
      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "x-auth-token": getToken(),
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      return await response.json();
    } catch (error) {
      console.error("Mark notification read API error:", error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          "x-auth-token": getToken(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return await response.json();
    } catch (error) {
      console.error("Get dashboard stats API error:", error);
      throw error;
    }
  },

  getProductReviews: async (productId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/reviews/product/${productId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch product reviews");
      }
      return await response.json();
    } catch (error) {
      console.error("Get product reviews API error:", error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken(),
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      return await response.json();
    } catch (error) {
      console.error("Update profile API error:", error);
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": getToken(),
        },
        body: JSON.stringify(passwordData),
      });
      if (!response.ok) {
        throw new Error("Failed to update password");
      }
      return await response.json();
    } catch (error) {
      console.error("Update password API error:", error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/stats`, {
        headers: {
          "x-auth-token": getToken(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }
      return await response.json();
    } catch (error) {
      console.error("Get user stats API error:", error);
      throw error;
    }
  },

  getProduct: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return await response.json();
    } catch (error) {
      console.error("Get product API error:", error);
      throw error;
    }
  },

  getProductAnalytics: async (productId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/products/${productId}/analytics`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch product analytics");
      }
      return await response.json();
    } catch (error) {
      console.error("Get product analytics API error:", error);
      throw error;
    }
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
