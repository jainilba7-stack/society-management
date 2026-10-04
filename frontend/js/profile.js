const profileModule = {
  async init() {
    const user = api.getUser();
    if (!user) return;

    document.getElementById('prof-name').value = user.fullName || '';
    document.getElementById('prof-email').value = user.email || '';
    document.getElementById('prof-phone').value = user.phone || '';
    document.getElementById('prof-role').innerText = user.role.toUpperCase();
    document.getElementById('prof-block').innerText = user.blockName || 'N/A';
    document.getElementById('prof-flat').innerText = user.flatNumber || 'N/A';
    document.getElementById('prof-img').src = user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  },

  async updateProfile() {
    const fullName = document.getElementById('prof-name').value;
    const phone = document.getElementById('prof-phone').value;

    try {
      const res = await api.put('/auth/profile', { fullName, phone });
      if (res.success) {
        api.setUser(res.user);
        ui.showToast('Profile updated successfully', 'success');
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async changePassword() {
    const currentPassword = document.getElementById('pass-current').value;
    const newPassword = document.getElementById('pass-new').value;
    const confirmPassword = document.getElementById('pass-confirm').value;

    if (!currentPassword || !newPassword) return ui.showToast('Please enter current and new password', 'error');
    if (newPassword !== confirmPassword) return ui.showToast('New passwords do not match', 'error');

    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      if (res.success) {
        ui.showToast('Password changed successfully', 'success');
        document.getElementById('pass-current').value = '';
        document.getElementById('pass-new').value = '';
        document.getElementById('pass-confirm').value = '';
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
