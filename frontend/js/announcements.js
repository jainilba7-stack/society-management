const announcementsModule = {
  async init() {
    await this.loadAnnouncements();
  },

  async loadAnnouncements() {
    const container = document.getElementById('announcements-container');
    if (!container) return;

    try {
      const data = await api.get('/announcements');
      if (!data.success) return;

      if (data.announcements.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No announcements active</div>`;
        return;
      }

      const user = api.getUser();

      container.innerHTML = data.announcements.map(a => `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 text-xs font-bold rounded-full ${a.scope === 'society' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-700'} capitalize">
                ${a.scope === 'society' ? '🌐 Society Announcement' : `🏢 ${a.targetBlocks && a.targetBlocks[0] ? a.targetBlocks[0].name : 'Block Notice'}`}
              </span>
              ${a.priority === 'urgent' || a.priority === 'high' ? '<span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">HIGH PRIORITY</span>' : ''}
              ${a.isForwarded ? '<span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">FORWARDED</span>' : ''}
            </div>
            <span class="text-xs text-slate-400 font-medium">${ui.formatDate(a.createdAt)}</span>
          </div>

          <h3 class="text-lg font-bold text-slate-900">${a.title}</h3>
          <p class="text-sm text-slate-600 leading-relaxed">${a.description}</p>

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Posted by <span class="font-bold text-slate-700">${a.createdBy ? a.createdBy.fullName : 'Admin'}</span>
              ${a.forwardedBy ? ` | Forwarded by <span class="font-bold text-slate-700">${a.forwardedBy.fullName}</span>` : ''}
            </div>

            ${user.role === 'secretary' && a.scope === 'society' && !a.isForwarded ? `
              <button onclick="announcementsModule.forwardAnnouncement('${a._id}')" class="btn-aqua-outline py-1 px-3 text-xs flex items-center">
                <i class="lucide-share-2 text-sm mr-1"></i> Forward to My Block Residents
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async createAnnouncement() {
    const title = document.getElementById('announce-title').value;
    const description = document.getElementById('announce-desc').value;
    const scope = document.getElementById('announce-scope')?.value || 'society';
    const priority = document.getElementById('announce-priority').value;

    if (!title || !description) return ui.showToast('Title and description are required', 'error');

    try {
      const res = await api.post('/announcements', { title, description, scope, priority });
      if (res.success) {
        ui.showToast('Announcement posted & notifications sent!', 'success');
        document.getElementById('create-announce-modal').classList.add('hidden');
        await this.loadAnnouncements();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async forwardAnnouncement(id) {
    try {
      const res = await api.post(`/announcements/${id}/forward`);
      if (res.success) {
        ui.showToast('Announcement forwarded to your block residents!', 'success');
        await this.loadAnnouncements();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
