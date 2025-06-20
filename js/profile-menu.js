class ProfileMenu {
  constructor() {
    this.isOpen = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadUserInfo();
  }

  setupEventListeners() {
    const profileBtn = document.getElementById('profile-menu-btn');
    const dropdown = document.getElementById('profile-dropdown');
    const settingsBtn = document.getElementById('settings-btn');
    const notificationsBtn = document.getElementById('notifications-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && !profileBtn?.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Settings button
    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDropdown();
        this.showSettingsModal();
      });
    }

    // Notifications button
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDropdown();
        this.showNotifications();
      });
    }

    // Logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  async loadUserInfo() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const user = await api.getUser();
      this.updateUserInfo(user);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  }

  updateUserInfo(user) {
    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const profileAvatar = document.getElementById('profile-avatar');

    if (dropdownName) {
      dropdownName.textContent = `${user.firstName} ${user.lastName}`;
    }
    if (dropdownEmail) {
      dropdownEmail.textContent = user.email;
    }
    if (profileAvatar && user.profilePicture) {
      profileAvatar.src = user.profilePicture;
    }
  }

  toggleDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;

    dropdown.classList.add('show');
    this.isOpen = true;
  }

  closeDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;

    dropdown.classList.remove('show');
    this.isOpen = false;
  }

  showSettingsModal() {
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
            <img src="profile photo.svg" alt="Profile Avatar" class="profile-avatar-preview" id="avatar-preview">
            <br>
            <button class="avatar-upload-btn" id="avatar-upload-btn">Change Avatar</button>
            <input type="file" id="avatar-input" accept="image/*" style="display: none;">
          </div>
          
          <form id="profile-form">
            <div class="profile-form-row">
              <div class="profile-form-group">
                <label for="edit-firstName">First Name</label>
                <input type="text" id="edit-firstName" required>
              </div>
              <div class="profile-form-group">
                <label for="edit-lastName">Last Name</label>
                <input type="text" id="edit-lastName" required>
              </div>
            </div>
            
            <div class="profile-form-group">
              <label for="edit-email">Email</label>
              <input type="email" id="edit-email" required>
            </div>
            
            <div class="profile-form-group">
              <label for="edit-location">Location</label>
              <input type="text" id="edit-location" placeholder="City, Country">
            </div>
            
            <div class="profile-form-group">
              <label for="edit-bio">Bio</label>
              <textarea id="edit-bio" rows="3" placeholder="Tell us about yourself..."></textarea>
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
    this.setupSettingsModal(modal);
  }

  async setupSettingsModal(modal) {
    // Load current user data
    try {
      const user = await api.getUser();
      document.getElementById('edit-firstName').value = user.firstName || '';
      document.getElementById('edit-lastName').value = user.lastName || '';
      document.getElementById('edit-email').value = user.email || '';
      document.getElementById('edit-location').value = user.location || '';
      document.getElementById('edit-bio').value = user.bio || '';
      
      const avatarPreview = document.getElementById('avatar-preview');
      if (user.profilePicture) {
        avatarPreview.src = user.profilePicture;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

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

      const result = await api.updateProfile(profileData);
      
      if (result.success) {
        this.showMessage(modal, 'Profile updated successfully!', 'success');
        this.updateUserInfo(result.user);
        
        // Update localStorage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({...currentUser, ...result.user}));
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

      const result = await api.updatePassword(passwordData);
      
      if (result.success) {
        this.showMessage(modal, 'Password updated successfully!', 'success');
        modal.getElementById('password-form').reset();
      }
    } catch (error) {
      console.error('Error updating password:', error);
      this.showMessage(modal, 'Failed to update password. Please check your current password.', 'error');
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

  async showNotifications() {
    // Use the unified profile page notifications functionality
    if (window.UnifiedProfilePage) {
      try {
        const notifications = await api.getNotifications();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Notifications</h2>
            <div class="notifications-list">
              ${notifications.length ?
                notifications.map(notification => `
                  <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                    <p>${notification.message}</p>
                    <small>${new Date(notification.createdAt).toLocaleDateString()}</small>
                    ${!notification.read ? `<button class="mark-read-btn" data-id="${notification._id}">Mark as Read</button>` : ''}
                  </div>
                `).join('') :
                '<p>No notifications available.</p>'
              }
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close').addEventListener('click', () => {
          document.body.removeChild(modal);
        });

        // Mark as read functionality
        modal.querySelectorAll('.mark-read-btn').forEach(button => {
          button.addEventListener('click', async (e) => {
            const notificationId = e.target.dataset.id;
            try {
              await api.markNotificationRead(notificationId);
              e.target.parentElement.classList.add('read');
              e.target.remove();
            } catch (error) {
              console.error('Error marking notification as read:', error);
            }
          });
        });

      } catch (error) {
        console.error('Error fetching notifications:', error);
        alert('Failed to load notifications.');
      }
    } else {
      alert('Notifications feature will be available soon!');
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  }
}

// Initialize profile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    new ProfileMenu();
  }
});
