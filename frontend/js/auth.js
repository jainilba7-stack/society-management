const auth = {
  checkAuth(requiredRoles = []) {
    const user = api.getUser();
    const token = api.getToken();

    if (!token || !user) {
      window.location.href = 'login.html';
      return false;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      // Redirect to authorized dashboard according to role
      this.redirectToDashboard(user.role);
      return false;
    }

    return user;
  },

  redirectToDashboard(role) {
    if (role === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (role === 'secretary') {
      window.location.href = 'secretary-dashboard.html';
    } else {
      window.location.href = 'resident-dashboard.html';
    }
  },

  async login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password });
      if (data.success) {
        api.setToken(data.token);
        api.setUser(data.user);
        ui.showToast('Login successful! Welcome back.', 'success');
        setTimeout(() => this.redirectToDashboard(data.user.role), 600);
      }
    } catch (err) {
      ui.showToast(err.message || 'Invalid email or password', 'error');
    }
  },

  async register(formData) {
    try {
      const data = await api.post('/auth/register', formData);
      if (data.success) {
        api.setToken(data.token);
        api.setUser(data.user);
        ui.showToast('Registration successful! Redirecting...', 'success');
        setTimeout(() => this.redirectToDashboard(data.user.role), 600);
      }
    } catch (err) {
      ui.showToast(err.message || 'Registration failed', 'error');
    }
  },

  logout() {
    api.removeToken();
    ui.showToast('Logged out successfully', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  },
};
