// Universal Authentication and Profile Menu Handler
class UniversalAuth {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('token');
    this.init();
  }

  init() {
    // Check authentication status
    this.checkAuthStatus();
    
    // Setup profile menu if user is authenticated
    if (this.token) {
      this.setupProfileMenu();
    }
    
    // Setup event listeners
    this.setupEventListeners();
  }

  checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.email) {
      this.currentUser = user;
      this.showUserInterface();
    } else {
      this.showGuestInterface();
    }
  }

  showUserInterface() {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    
    if (guestActions) guestActions.style.display = 'none';
    if (userActions) userActions.style.display = 'flex';
    
    // Update user info in dropdown
    this.updateUserInfo();
  }

  showGuestInterface() {
    const guestActions = document.getElementById('guest-actions');
    const userActions = document.getElementById('user-actions');
    
    if (guestActions) guestActions.style.display = 'flex';
    if (userActions) userActions.style.display = 'none';
  }

  updateUserInfo() {
    if (!this.currentUser) return;
    
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const dropdownAvatar = document.querySelector('.dropdown-avatar');
    
    if (dropdownName) {
      dropdownName.textContent = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 'User';
    }
    
    if (dropdownEmail) {
      dropdownEmail.textContent = this.currentUser.email || '';
    }
    
    // Update avatar if user has profile picture
    if (this.currentUser.profilePicture && this.currentUser.profilePicture !== 'profile photo.svg') {
      if (profileAvatar) profileAvatar.src = this.currentUser.profilePicture;
      if (dropdownAvatar) dropdownAvatar.src = this.currentUser.profilePicture;
    }
  }

  setupProfileMenu() {
    const profileBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (!profileBtn || !profileDropdown) return;
    
    // Toggle dropdown on click
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
    
    // Handle dropdown menu items
    const settingsBtn = document.getElementById('settings-btn');
    const notificationsBtn = document.getElementById('notifications-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSettingsModal();
        profileDropdown.classList.remove('show');
      });
    }
    
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNotificationsModal();
        profileDropdown.classList.remove('show');
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  setupEventListeners() {
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' || e.key === 'user') {
        this.checkAuthStatus();
      }
    });
    
    // Listen for custom auth events
    window.addEventListener('userLoggedIn', (e) => {
      this.currentUser = e.detail.user;
      this.token = e.detail.token;
      this.showUserInterface();
      this.setupProfileMenu();
    });
    
    window.addEventListener('userLoggedOut', () => {
      this.currentUser = null;
      this.token = null;
      this.showGuestInterface();
    });
  }

  showSettingsModal() {
    // Create settings modal
    const modal = document.createElement('div');
    modal.className = 'modal profile-settings-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Profile Settings</h2>
        
        <div class="profile-settings-tabs">
          <button class="profile-tab active" data-tab="profile">Profile</button>
          <button class="profile-tab" data-tab="security">Security</button>
        </div>

        <div class="tab-content active" id="profile-tab">
          <div class="profile-avatar-section">
            <img src="${this.currentUser.profilePicture || 'profile photo.svg'}" alt="Profile Avatar" class="profile-avatar-preview" id="avatar-preview">
            <br>
            <button class="avatar-upload-btn" id="avatar-upload-btn">Change Avatar</button>
            <input type="file" id="avatar-input" accept="image/*" style="display: none;">
          </div>
          
          <form id="profile-form">
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label for="edit-firstName">First Name</label>
                <input type="text" id="edit-firstName" value="${this.currentUser.firstName || ''}" required>
              </div>
              <div class="profile-form-group">
                <label for="edit-lastName">Last Name</label>
                <input type="text" id="edit-lastName" value="${this.currentUser.lastName || ''}" required>
              </div>
            </div>
            
            <div class="profile-form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" value="${this.currentUser.email || ''}" required>
            </div>
            
            <div class="profile-form-group">
              <label for="edit-location">Location</label>
              <input type="text" id="edit-location" value="${this.currentUser.location || ''}" placeholder="City, Country">
            </div>
            
            <div class="profile-form-group">
              <label for="edit-bio">Bio</label>
              <textarea id="edit-bio" rows="3" placeholder="Tell us about yourself...">${this.currentUser.bio || ''}</textarea>
            </div>
            
            <button type="submit" class="btn">Update Profile</button>
          </form>
        </div>

        <div class="tab-content" id="security-tab">
          <form id="password-form">
            <div class="profile-form-group">
              <label for="current-password">Current Password</label>
              <input type="password" id="current-password" required>
            </div>
            
            <div class="profile-form-group">
              <label for="new-password">New Password</label>
              <input type="password" id="new-password" required>
            </div>
            
            <div class="profile-form-group">
              <label for="confirm-password">Confirm New Password</label>
              <input type="password" id="confirm-password" required>
            </div>
            
            <button type="submit" class="btn">Update Password</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupSettingsModalEvents(modal);
  }

  setupSettingsModalEvents(modal) {
    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Tab switching
    modal.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        
        // Update active tab
        modal.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        modal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        modal.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });

    // Avatar upload
    const avatarUploadBtn = modal.getElementById('avatar-upload-btn');
    const avatarInput = modal.getElementById('avatar-input');
    const avatarPreview = modal.getElementById('avatar-preview');

    avatarUploadBtn.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Profile form submission
    modal.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updateProfile(modal);
    });

    // Password form submission
    modal.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updatePassword(modal);
    });
  }

  async updateProfile(modal) {
    try {
      const profileData = {
        firstName: document.getElementById('edit-firstName').value,
        lastName: document.getElementById('edit-lastName').value,
        email: document.getElementById('edit-email').value,
        location: document.getElementById('edit-location').value,
        bio: document.getElementById('edit-bio').value,
        profilePicture: document.getElementById('avatar-preview').src
      };

      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showMessage(modal, 'Profile updated successfully!', 'success');
        
        // Update local user data
        this.currentUser = { ...this.currentUser, ...result.user };
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        
        // Update UI
        this.updateUserInfo();
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: { user: this.currentUser } 
        }));
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showMessage(modal, 'Failed to update profile. Please try again.', 'error');
    }
  }

  async updatePassword(modal) {
    try {
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        this.showMessage(modal, 'New passwords do not match.', 'error');
        return;
      }

      const passwordData = {
        currentPassword: document.getElementById('current-password').value,
        newPassword: newPassword
      };

      const response = await fetch('http://localhost:5000/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': this.token
        },
        body: JSON.stringify(passwordData)
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showMessage(modal, 'Password updated successfully!', 'success');
        modal.getElementById('password-form').reset();
      } else {
        throw new Error(result.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      this.showMessage(modal, 'Failed to update password. Please check your current password.', 'error');
    }
  }

  showNotificationsModal() {
    // Create notifications modal
    const modal = document.createElement('div');
    modal.className = 'modal notifications-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Notifications</h2>
        <div class="notifications-container" id="notifications-container">
          <p>Loading notifications...</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Close modal
    modal.querySelector('.close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Load notifications
    this.loadNotifications(modal);
  }

  async loadNotifications(modal) {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'x-auth-token': this.token
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        const container = modal.querySelector('#notifications-container');
        
        if (notifications.length === 0) {
          container.innerHTML = '<p>No notifications</p>';
        } else {
          container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}">
              <div class="notification-content">
                <p>${notification.message}</p>
                <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
              </div>
              ${!notification.read ? '<button class="mark-read-btn" data-id="' + notification._id + '">Mark as Read</button>' : ''}
            </div>
          `).join('');
          
          // Add mark as read functionality
          container.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const notificationId = e.target.dataset.id;
              await this.markNotificationAsRead(notificationId);
              e.target.closest('.notification-item').classList.remove('unread');
              e.target.remove();
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      modal.querySelector('#notifications-container').innerHTML = '<p>Failed to load notifications</p>';
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'x-auth-token': this.token
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  showMessage(modal, message, type) {
    // Remove existing messages
    const existingMessages = modal.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;

    // Insert at the top of the active tab content
    const activeTab = modal.querySelector('.tab-content.active');
    activeTab.insertBefore(messageDiv, activeTab.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  logout() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update UI
    this.currentUser = null;
    this.token = null;
    this.showGuestInterface();
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Redirect to home page
    window.location.href = 'index.html';
  }
}

// Initialize universal auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.universalAuth = new UniversalAuth();
});
