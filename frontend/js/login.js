/**
 * Login Controller (Vanilla JavaScript)
 * Handles input validation, Fetch API submission with HttpOnly cookie credentials,
 * error presentation, and dashboard redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const alertBanner = document.getElementById('alertBanner');

  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Password Visibility Toggle
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.textContent = isPassword ? 'Hide' : 'Show';
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  // Check for session flash messages (e.g. redirected from protected page)
  const flashMessage = sessionStorage.getItem('auth_flash');
  if (flashMessage) {
    sessionStorage.removeItem('auth_flash');
    alertBanner.textContent = flashMessage;
    alertBanner.className = 'alert-banner active info';
  }

  // Helper: Display Alert Banner
  const showAlert = (message, type = 'error') => {
    alertBanner.textContent = message;
    alertBanner.className = `alert-banner active ${type}`;
    alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const clearAlert = () => {
    alertBanner.textContent = '';
    alertBanner.className = 'alert-banner';
  };

  // Helper: Show & Clear Field Errors
  const setFieldError = (input, errorEl, message) => {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorEl.textContent = message;
    errorEl.classList.add('active');
  };

  const clearFieldError = (input, errorEl) => {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    errorEl.textContent = '';
    errorEl.classList.remove('active');
  };

  // Validation Rules
  const validateEmail = () => {
    const val = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) {
      setFieldError(emailInput, emailError, 'Email address is required.');
      return false;
    }
    if (!emailRegex.test(val)) {
      setFieldError(emailInput, emailError, 'Please enter a valid email address.');
      return false;
    }
    clearFieldError(emailInput, emailError);
    return true;
  };

  const validatePassword = () => {
    const val = passwordInput.value;
    if (!val) {
      setFieldError(passwordInput, passwordError, 'Password is required.');
      return false;
    }
    clearFieldError(passwordInput, passwordError);
    return true;
  };

  // Real-time Event Listeners
  emailInput.addEventListener('blur', validateEmail);
  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-invalid')) validateEmail();
  });
  passwordInput.addEventListener('input', () => {
    if (passwordInput.classList.contains('is-invalid')) validatePassword();
  });

  // Set Button Loading State
  const setLoading = (loading) => {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtnText.textContent = 'Authenticating...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtnText.textContent = 'Sign In';
    }
  };

  // Handle Form Submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      showAlert('Please enter both your email address and password.', 'error');
      return;
    }

    const payload = {
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
    };

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Automatically saves the HttpOnly cookie in the browser
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert('Login successful! Redirecting to your dashboard...', 'success');
        // Redirect to protected dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        // Generic or rate limit error presentation
        const errorMsg = data.message || 'Invalid email or password.';
        showAlert(errorMsg, 'error');
      }
    } catch (networkError) {
      showAlert('Unable to reach the authentication server. Please verify your connection.', 'error');
    } finally {
      setLoading(false);
    }
  });
});
