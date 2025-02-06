document.addEventListener('DOMContentLoaded', () => {
    const profilePage = {
        init() {
            this.initializeComponents();
            this.setupEventListeners();
            this.initializeA11y();
            this.setupIntersectionObserver();
        },

        initializeComponents() {
            this.header = document.querySelector('.main-header');
            this.skipLink = document.querySelector('.skip-link');
            this.mainNav = document.querySelector('.main-nav');
            this.filterButton = document.querySelector('.filter-btn');
            this.notificationsBtn = document.querySelector('.notifications-btn');
            this.logoutBtn = document.querySelector('.logout-btn');
            this.privacyBtn = document.querySelector('.privacy-btn');
            this.badgesGrid = document.querySelector('.badges-grid');
        },

        setupEventListeners() {
            window.addEventListener('scroll', () => this.handleHeaderScroll());

            this.filterButton?.addEventListener('click', (e) => this.toggleFilter(e));

            this.notificationsBtn?.addEventListener('click', () => this.handleNotifications());

            this.logoutBtn?.addEventListener('click', () => this.handleLogout());

            this.privacyBtn?.addEventListener('click', () => this.handlePrivacyChoices());

            document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
        },

        initializeA11y() {
            this.setupFocusTrap();
            this.setupLiveRegions();
            this.enhanceA11yAttributes();
        },

        setupIntersectionObserver() {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, options);

            document.querySelectorAll('.badge-item').forEach(badge => {
                observer.observe(badge);
            });
        },

        handleHeaderScroll() {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                this.header.classList.add('header-scrolled');
            } else {
                this.header.classList.remove('header-scrolled');
            }
        },

        toggleFilter(event) {
            const button = event.currentTarget;
            const expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', !expanded);

            const menu = document.getElementById(button.getAttribute('aria-controls'));
            menu.hidden = expanded;

            if (!expanded) {
                requestAnimationFrame(() => {
                    menu.querySelector('button, [href], input').focus();
                });
            }
        },

        handleNotifications() {
            const notificationsEndpoint = '/api/notifications';
            fetch(notificationsEndpoint)
                .then(response => response.json())
                .then(data => this.updateNotifications(data))
                .catch(error => this.handleError(error));
        },

        updateNotifications(data) {
            const liveRegion = document.getElementById('notifications-live');
            liveRegion.textContent = `${data.unread} new notifications`;
        },

        handleLogout() {
            const logoutEndpoint = '/api/auth/logout';
            fetch(logoutEndpoint, {
                method: 'POST',
                credentials: 'include'
            })
                .then(() => {
                    window.location.href = '/login';
                })
                .catch(error => this.handleError(error));
        },

        handlePrivacyChoices() {
            const privacyDialog = document.getElementById('privacy-dialog');
            if (privacyDialog) {
                privacyDialog.showModal();
                this.trapFocus(privacyDialog);
            }
        },

        handleKeyboardNavigation(event) {
            if (event.key === 'Escape') {
                const activeDialog = document.querySelector('dialog[open]');
                if (activeDialog) {
                    activeDialog.close();
                }
            }
        },

        setupFocusTrap() {
            const dialogs = document.querySelectorAll('dialog');
            dialogs.forEach(dialog => {
                const focusableElements = dialog.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length) {
                    const firstFocusable = focusableElements[0];
                    const lastFocusable = focusableElements[focusableElements.length - 1];

                    dialog.addEventListener('keydown', (e) => {
                        if (e.key === 'Tab') {
                            if (e.shiftKey) {
                                if (document.activeElement === firstFocusable) {
                                    e.preventDefault();
                                    lastFocusable.focus();
                                }
                            } else {
                                if (document.activeElement === lastFocusable) {
                                    e.preventDefault();
                                    firstFocusable.focus();
                                }
                            }
                        }
                    });
                }
            });
        },

        setupLiveRegions() {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.id = 'notifications-live';
            liveRegion.className = 'visually-hidden';
            document.body.appendChild(liveRegion);
        },

        enhanceA11yAttributes() {
            const images = document.querySelectorAll('img:not([alt])');
            images.forEach(img => {
                if (img.getAttribute('src').includes('decorative')) {
                    img.setAttribute('alt', '');
                } else {
                    img.setAttribute('alt', this.generateAltText(img));
                }
            });

            const buttons = document.querySelectorAll('button:not([aria-label])');
            buttons.forEach(button => {
                if (!button.textContent.trim()) {
                    button.setAttribute('aria-label', this.generateButtonLabel(button));
                }
            });
        },

        generateAltText(img) {
            const filename = img.getAttribute('src').split('/').pop();
            return filename.split('.')[0].replace(/-/g, ' ');
        },

        generateButtonLabel(button) {
            const icon = button.querySelector('img');
            if (icon) {
                return icon.getAttribute('alt') || 'Interactive button';
            }
            return 'Interactive button';
        },

        handleError(error) {
            console.error('An error occurred:', error);
            const liveRegion = document.getElementById('notifications-live');
            liveRegion.textContent = 'An error occurred. Please try again later.';
        }
    };

    profilePage.init();
});