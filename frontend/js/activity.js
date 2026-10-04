const activityModule = {
  async init() {
    await this.loadLogs();
  },

  async loadLogs() {
    const container = document.getElementById('activity-logs-list');
    if (!container) return;

    try {
      const data = await api.get('/activity-logs');
      if (!data.success) return;

      if (data.logs.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No activity logs recorded</div>`;
        return;
      }

      container.innerHTML = data.logs.map(l => `
        <div class="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all text-xs">
          <div class="w-9 h-9 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold text-sm shrink-0">
            <i class="lucide-activity text-sm"></i>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold text-slate-900 text-sm">${l.action}</span>
              <span class="text-slate-400 text-[11px] font-medium">${ui.formatDate(l.createdAt)}</span>
            </div>
            <p class="text-slate-600 font-medium mb-1">${l.details}</p>
            <div class="flex items-center space-x-2 text-[10px] text-slate-400">
              <span>By: <strong class="text-slate-700">${l.user ? l.user.fullName : 'System'}</strong></span>
              <span>• Role: <strong class="text-cyan-700 capitalize">${l.userRole}</strong></span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
