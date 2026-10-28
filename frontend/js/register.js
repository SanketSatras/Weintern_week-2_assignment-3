/**
 * Registration Controller (Vanilla JavaScript)
 * Handles client-side validation, password strength visualization,
 * asynchronous Fetch API submission, and UI state updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const registerForm = document.getElementById('registerForm');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const alertBanner = document.getElementById('alertBanner');

  const usernameError = document.getElementById('usernameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  const passwordStrength = document.getElementById('passwordStrength');
  const strengthBarFill = document.getElementById('strengthBarFill');
  const strengthText = document.getElementById('strengthText');

  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');

  // Password Visibility Toggles
  const setupToggle = (button, input) => {
    button.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? 'Hide' : 'Show';
      button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  };

  setupToggle(togglePasswordBtn, passwordInput);
  setupToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

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

  // Field Validation Rules
  const validateUsername = () => {
    const val = usernameInput.value.trim();
    if (!val) {
      setFieldError(usernameInput, usernameError, 'Username is required.');
      return false;
    }
    if (val.length < 3 || val.length > 30) {
      setFieldError(usernameInput, usernameError, 'Username must be 3–30 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setFieldError(usernameInput, usernameError, 'Only letters, numbers, and underscores allowed.');
      return false;
    }
    clearFieldError(usernameInput, usernameError);
    return true;
  };

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

  // Password Strength Evaluation
  const evaluatePasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '', color: '#e2e8f0' };

    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score, label: 'Weak (min 8 chars required)', color: '#ef4444', percent: '25%' };
      case 2:
        return { score, label: 'Fair (add uppercase & digits)', color: '#f59e0b', percent: '50%' };
      case 3:
        return { score, label: 'Good', color: '#3b82f6', percent: '75%' };
      case 4:
        return { score, label: 'Strong', color: '#10b981', percent: '100%' };
      default:
        return { score: 0, label: 'Too short', color: '#ef4444', percent: '10%' };
    }
  };

  const validatePassword = () => {
    const val = passwordInput.value;
    if (!val) {
      setFieldError(passwordInput, passwordError, 'Password is required.');
      passwordStrength.classList.remove('active');
      return false;
    }

    // Update real-time strength meter
    passwordStrength.classList.add('active');
    const strength = evaluatePasswordStrength(val);
    strengthBarFill.style.width = strength.percent;
    strengthBarFill.style.backgroundColor = strength.color;
    strengthText.textContent = `Strength: ${strength.label}`;
    strengthText.style.color = strength.color;

    if (val.length < 8) {
      setFieldError(passwordInput, passwordError, 'Password must be at least 8 characters long.');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val)) {
      setFieldError(passwordInput, passwordError, 'Include at least 1 uppercase, 1 lowercase, and 1 number.');
      return false;
    }

    clearFieldError(passwordInput, passwordError);
    return true;
  };

  const validateConfirmPassword = () => {
    const pwd = passwordInput.value;
    const confirmPwd = confirmPasswordInput.value;

    if (!confirmPwd) {
      setFieldError(confirmPasswordInput, confirmPasswordError, 'Please confirm your password.');
      return false;
    }
    if (pwd !== confirmPwd) {
      setFieldError(confirmPasswordInput, confirmPasswordError, 'Passwords do not match.');
      return false;
    }
    clearFieldError(confirmPasswordInput, confirmPasswordError);
    return true;
  };

  // Real-time Validation Listeners
  usernameInput.addEventListener('blur', validateUsername);
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('input', () => {
    validatePassword();
    if (confirmPasswordInput.value) validateConfirmPassword();
  });
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);

  // Set Loading State
  const setLoading = (loading) => {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      submitBtnText.textContent = 'Creating Account...';
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtnText.textContent = 'Create Account';
    }
  };

  // Handle Form Submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmValid = validateConfirmPassword();

    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      showAlert('Please fix the errors indicated below before submitting.', 'error');
      return;
    }

    const payload = {
      username: usernameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
    };

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Permits cookies across origin if needed
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showAlert('Registration successful! Redirecting to login...', 'success');
        registerForm.reset();
        passwordStrength.classList.remove('active');
        usernameInput.classList.remove('is-valid');
        emailInput.classList.remove('is-valid');
        passwordInput.classList.remove('is-valid');
        confirmPasswordInput.classList.remove('is-valid');

        // Automatic redirect after displaying success message
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1600);
      } else {
        const errorMsg = data.message || 'Registration failed. Please try again.';
        showAlert(errorMsg, 'error');
      }
    } catch (networkError) {
      showAlert('Unable to connect to the authentication server. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  });
});
