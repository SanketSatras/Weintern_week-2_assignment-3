/**
 * Protected Dashboard Controller (Vanilla JavaScript)
 * Validates active session with GET /api/auth/me, displays user information,
 * and manages secure logout via POST /api/auth/logout.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const dashboardContent = document.getElementById('dashboardContent');
  const alertBanner = document.getElementById('alertBanner');

  const welcomeTitle = document.getElementById('welcomeTitle');
  const navUserBadge = document.getElementById('navUserBadge');
  const navUsername = document.getElementById('navUsername');
  const profileUsername = document.getElementById('profileUsername');
  const profileEmail = document.getElementById('profileEmail');
  const profileMemberSince = document.getElementById('profileMemberSince');

  const logoutBtn = document.getElementById('logoutBtn');
  const logoutBtnText = document.getElementById('logoutBtnText');
  const footerLogoutBtn = document.getElementById('footerLogoutBtn');

  // Helper: Display Alert Banner
  const showAlert = (message, type = 'error') => {
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner active ${type}`;
  };

  // Helper: Redirect to Login
  const redirectToLogin = (message) => {
    if (message) {
      // Store session flash message for login page
      sessionStorage.setItem('auth_flash', message);
    }
    // Use location.replace to prevent back-button loops
    window.location.replace('login.html');
  };

  /**
   * Fetch authenticated user profile from protected endpoint
   */
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        credentials: 'include', // Includes HttpOnly cookie
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Populate UI with verified data
        const { username, email, createdAt } = data.user;

        welcomeTitle.textContent = `Welcome back, ${username}!`;
        navUsername.textContent = username;
        navUserBadge.style.display = 'inline-flex';

        profileUsername.textContent = username;
        profileEmail.textContent = email;

        if (createdAt) {
          const dateObj = new Date(createdAt);
          profileMemberSince.textContent = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } else {
          profileMemberSince.textContent = 'Active Member';
        }

        // Reveal content and hide loading state
        loadingState.style.display = 'none';
        dashboardContent.style.display = 'block';
      } else {
        // Token expired, missing, or unauthorized
        const message = data.message || 'Please log in to access this page.';
        redirectToLogin(message);
      }
    } catch (networkError) {
      showAlert('Could not reach server to verify authentication session.', 'error');
      loadingState.style.display = 'none';
      setTimeout(() => {
        redirectToLogin('Session check failed. Please log in.');
      }, 2000);
    }
  };

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    logoutBtn.disabled = true;
    footerLogoutBtn.disabled = true;
    if (logoutBtnText) logoutBtnText.textContent = 'Signing out...';

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Clear profile text immediately from DOM to avoid stale visual state
      profileUsername.textContent = '';
      profileEmail.textContent = '';
      welcomeTitle.textContent = '';
      dashboardContent.style.display = 'none';

      // Redirect cleanly to login page
      window.location.replace('login.html');
    } catch (error) {
      showAlert('Logout request encountered an error, redirecting...', 'error');
      window.location.replace('login.html');
    }
  };

  // Event Listeners for Logout
  logoutBtn.addEventListener('click', handleLogout);
  footerLogoutBtn.addEventListener('click', handleLogout);

  // Security check on browser back/forward cache (pageshow)
  window.addEventListener('pageshow', (event) => {
    // If loaded from back/forward cache, re-verify with backend immediately
    if (event.persisted) {
      fetchUserProfile();
    }
  });

  // Initial authentication check on load
  fetchUserProfile();
});
