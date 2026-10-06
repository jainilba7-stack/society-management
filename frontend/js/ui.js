const ui = {
  // Render Toast Message
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const borderColors = {
      success: 'border-emerald-500 bg-white text-slate-800 shadow-emerald-100',
      error: 'border-rose-500 bg-white text-slate-800 shadow-rose-100',
      info: 'border-cyan-500 bg-white text-slate-800 shadow-cyan-100',
      warning: 'border-amber-500 bg-white text-slate-800 shadow-amber-100',
    };

    const icons = {
      success: '<i class="lucide-check-circle text-emerald-500 text-lg"></i>',
      error: '<i class="lucide-alert-circle text-rose-500 text-lg"></i>',
      info: '<i class="lucide-info text-cyan-500 text-lg"></i>',
      warning: '<i class="lucide-alert-triangle text-amber-500 text-lg"></i>',
    };

    toast.className = `flex items-center gap-3 p-4 rounded-xl border-l-4 shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 ${borderColors[type] || borderColors.info}`;
    toast.innerHTML = `
      <div>${icons[type] || icons.info}</div>
      <div class="text-sm font-medium flex-1">${message}</div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
        <i class="lucide-x text-sm"></i>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Format Currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  },

  // Format Date
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  // Format Status Badge
  getStatusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'paid' || s === 'resolved' || s === 'active') {
      return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full badge-paid">● ${status}</span>`;
    }
    if (s === 'pending' || s === 'in progress') {
      return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full badge-pending">● ${status}</span>`;
    }
    if (s === 'overdue' || s === 'rejected' || s === 'failed') {
      return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full badge-overdue">● ${status}</span>`;
    }
    return `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">● ${status}</span>`;
  },

  // Render Sidebar and Navbar according to Role (Section 34)
  initLayout(activePage) {
    const user = api.getUser();
    if (!user) return;

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // Sidebar Menus by Role
    const menus = {
      admin: [
        { label: 'Dashboard', icon: 'layout-dashboard', link: 'admin-dashboard.html' },
        { label: 'Blocks', icon: 'building-2', link: 'blocks.html' },
        { label: 'Flats', icon: 'home', link: 'flats.html' },
        { label: 'Residents', icon: 'users', link: 'residents.html' },
        { label: 'Maintenance', icon: 'receipt', link: 'maintenance.html' },
        { label: 'Electricity Bills', icon: 'zap', link: 'electricity.html' },
        { label: 'Announcements', icon: 'megaphone', link: 'announcements.html' },
        { label: 'Complaints', icon: 'alert-circle', link: 'complaints.html' },
        { label: 'Reports', icon: 'bar-chart-3', link: 'reports.html' },
        { label: 'Activity Logs', icon: 'history', link: 'activity-logs.html' },
        { label: 'Profile & Settings', icon: 'user-cog', link: 'profile.html' },
      ],
      secretary: [
        { label: 'Dashboard', icon: 'layout-dashboard', link: 'secretary-dashboard.html' },
        { label: 'My Block', icon: 'building-2', link: 'blocks.html' },
        { label: 'Flats', icon: 'home', link: 'flats.html' },
        { label: 'Residents', icon: 'users', link: 'residents.html' },
        { label: 'Maintenance', icon: 'receipt', link: 'maintenance.html' },
        { label: 'Electricity Bills', icon: 'zap', link: 'electricity.html' },
        { label: 'Announcements', icon: 'megaphone', link: 'announcements.html' },
        { label: 'Complaints', icon: 'alert-circle', link: 'complaints.html' },
        { label: 'Profile & Settings', icon: 'user-cog', link: 'profile.html' },
      ],
      resident: [
        { label: 'Dashboard', icon: 'layout-dashboard', link: 'resident-dashboard.html' },
        { label: 'My Flat & Block', icon: 'home', link: 'flats.html' },
        { label: 'Maintenance Bills', icon: 'receipt', link: 'maintenance.html' },
        { label: 'Electricity Bills', icon: 'zap', link: 'electricity.html' },
        { label: 'Announcements', icon: 'megaphone', link: 'announcements.html' },
        { label: 'My Complaints', icon: 'alert-circle', link: 'complaints.html' },
        { label: 'Profile & Settings', icon: 'user-cog', link: 'profile.html' },
      ],
    };

    const roleMenu = menus[user.role] || menus.resident;

    // Build Sidebar HTML
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
      sidebarContainer.className = 'w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between hidden md:flex shrink-0 shadow-sm';
      sidebarContainer.innerHTML = `
        <div>
          <!-- Society Header -->
          <div class="h-16 flex items-center px-6 border-b border-slate-100">
            <div class="w-9 h-9 rounded-xl bg-aqua-gradient flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-200">
              S
            </div>
            <div class="ml-3">
              <h1 class="font-extrabold text-slate-900 text-base leading-tight tracking-tight">SocietyOS</h1>
              <p class="text-xs text-slate-400 font-medium">Smart Residential Portal</p>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="p-4 space-y-1.5">
            ${roleMenu
              .map((item) => {
                const isActive = currentPath === item.link || activePage === item.link;
                return `
                <a href="${item.link}" class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 font-semibold border-r-4 border-cyan-500 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-cyan-600'
                }">
                  <i class="lucide-${item.icon} text-lg mr-3 ${isActive ? 'text-cyan-600' : 'text-slate-400'}"></i>
                  ${item.label}
                </a>
              `;
              })
              .join('')}
          </nav>
        </div>

        <!-- User Profile Quick Card & Logout -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 overflow-hidden">
              <img src="${user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" class="w-9 h-9 rounded-full object-cover border-2 border-cyan-200" alt="Avatar">
              <div class="truncate">
                <p class="text-xs font-bold text-slate-800 truncate">${user.fullName}</p>
                <span class="inline-block px-2 py-0.5 text-[10px] font-semibold bg-cyan-100 text-cyan-800 rounded-full capitalize">${user.role}</span>
              </div>
            </div>
            <button onclick="auth.logout()" title="Logout" class="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors">
              <i class="lucide-log-out text-lg"></i>
            </button>
          </div>
        </div>
      `;
    }

    // Build Navbar HTML
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
      navbarContainer.className = 'h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs';
      navbarContainer.innerHTML = `
        <div class="flex items-center space-x-4">
          <button id="mobile-menu-toggle" class="md:hidden text-slate-600 hover:text-cyan-600">
            <i class="lucide-menu text-2xl"></i>
          </button>
          <div>
            <h2 class="text-lg font-bold text-slate-900 capitalize">${user.role === 'admin' ? 'Main Secretary Command Center' : user.role === 'secretary' ? `Secretary Dashboard (${user.blockName || 'Block Portal'})` : `Resident Hub (${user.flatNumber || 'My Flat'})`}</h2>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Notification Bell -->
          <div class="relative">
            <button id="notif-btn" onclick="ui.toggleNotificationDropdown()" class="relative p-2 text-slate-500 hover:text-cyan-600 rounded-full hover:bg-slate-100 transition-colors">
              <i class="lucide-bell text-xl"></i>
              <span id="notif-badge" class="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white hidden"></span>
            </button>

            <!-- Dropdown -->
            <div id="notif-dropdown" class="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 hidden z-50 animate-fadeIn">
              <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 class="font-bold text-slate-900 text-sm">Notifications</h3>
                <button onclick="ui.markAllNotificationsRead()" class="text-xs text-cyan-600 hover:underline font-semibold">Mark all read</button>
              </div>
              <div id="notif-list" class="space-y-2 max-h-80 overflow-y-auto pr-1 text-sm text-slate-600">
                <div class="p-3 text-center text-slate-400 text-xs">Loading notifications...</div>
              </div>
            </div>
          </div>

          <!-- User Badge -->
          <a href="profile.html" class="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <img src="${user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" class="w-8 h-8 rounded-full border border-cyan-400 object-cover" alt="User">
            <span class="text-xs font-semibold text-slate-700 hidden sm:inline-block">${user.fullName}</span>
          </a>
        </div>
      `;
    }

    // Load Notifications
    this.loadNotifications();
  },

  async loadNotifications() {
    try {
      const data = await api.get('/notifications');
      const badge = document.getElementById('notif-badge');
      const list = document.getElementById('notif-list');

      if (!data.success) return;

      if (data.unreadCount > 0 && badge) {
        badge.classList.remove('hidden');
      } else if (badge) {
        badge.classList.add('hidden');
      }

      if (list) {
        if (data.notifications.length === 0) {
          list.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No notifications yet</div>`;
          return;
        }

        list.innerHTML = data.notifications
          .map(
            (n) => `
            <div class="p-3 rounded-xl ${n.isRead ? 'bg-slate-50/50' : 'bg-cyan-50/60 border-l-2 border-cyan-500'} transition-all text-xs">
              <div class="font-bold text-slate-800 mb-0.5">${n.title}</div>
              <div class="text-slate-600 leading-snug">${n.message}</div>
              <div class="text-[10px] text-slate-400 mt-1">${this.formatDate(n.createdAt)}</div>
            </div>
          `
          )
          .join('');
      }
    } catch (e) {
      console.warn('[Notifications Load Warning]:', e.message);
    }
  },

  toggleNotificationDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
    }
  },

  async markAllNotificationsRead() {
    try {
      await api.put('/notifications/read-all');
      this.loadNotifications();
      this.showToast('All notifications marked as read', 'success');
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  },

  showImageModal(imageUrl, title = 'Bill Proof Image') {
    if (!imageUrl) return;
    let modal = document.getElementById('global-image-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-image-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-backdrop hidden p-4';
      modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 w-full max-w-2xl modal-content space-y-4 shadow-2xl relative">
          <div class="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 id="global-image-modal-title" class="font-extrabold text-slate-900 text-lg">Bill Proof</h3>
            <button onclick="document.getElementById('global-image-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 p-1">
              <i class="lucide-x text-xl"></i>
            </button>
          </div>
          <div class="flex justify-center items-center bg-slate-900/5 rounded-2xl p-2 min-h-[300px]">
            <img id="global-image-modal-img" src="" alt="Proof Image" class="max-h-[70vh] w-auto object-contain rounded-xl shadow-sm">
          </div>
          <div class="flex justify-end pt-2">
            <a id="global-image-modal-download" href="" target="_blank" class="btn-aqua text-xs py-2 px-4 flex items-center">
              <i class="lucide-external-link text-sm mr-1.5"></i> Open Full Image
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    document.getElementById('global-image-modal-title').innerText = title;
    document.getElementById('global-image-modal-img').src = imageUrl;
    document.getElementById('global-image-modal-download').href = imageUrl;
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
};
