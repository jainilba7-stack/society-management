const complaintsModule = {
  async init() {
    await this.loadComplaints();
  },

  async loadComplaints() {
    const container = document.getElementById('complaints-list');
    if (!container) return;

    const category = document.getElementById('filter-category')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';

    try {
      const query = new URLSearchParams();
      if (category) query.append('category', category);
      if (status) query.append('status', status);

      const data = await api.get(`/complaints?${query.toString()}`);
      if (!data.success) return;

      if (data.complaints.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-400 text-sm">No complaints found</div>`;
        return;
      }

      const user = api.getUser();

      container.innerHTML = data.complaints.map(c => `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 text-xs font-bold rounded-full bg-cyan-100 text-cyan-800">
                ${c.category}
              </span>
              <span class="text-xs text-slate-500 font-semibold">
                ${c.block ? c.block.name : ''} - Flat ${c.flatNumber}
              </span>
            </div>
            <div>${ui.getStatusBadge(c.status)}</div>
          </div>

          <div>
            <h3 class="text-lg font-bold text-slate-900 mb-1">${c.title}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${c.description}</p>
          </div>

          ${c.imageUrl ? `
            <div>
              <img src="${c.imageUrl}" class="w-48 h-32 object-cover rounded-xl border border-slate-200" alt="Attachment">
            </div>
          ` : ''}

          ${c.resolutionNote ? `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span class="font-bold text-slate-800">Resolution Note:</span> ${c.resolutionNote}
              ${c.resolvedBy ? `<span class="text-slate-400"> (By ${c.resolvedBy.fullName})</span>` : ''}
            </div>
          ` : ''}

          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>Filed by <span class="font-bold text-slate-700">${c.resident ? c.resident.fullName : 'Resident'}</span> on ${ui.formatDate(c.createdAt)}</div>

            ${user.role !== 'resident' ? `
              <button onclick="complaintsModule.openStatusModal('${c._id}', '${c.status}', '${c.resolutionNote || ''}')" class="btn-aqua-outline py-1 px-3 text-xs">
                Update Status
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async submitComplaint() {
    const title = document.getElementById('comp-title').value;
    const category = document.getElementById('comp-category').value;
    const priority = document.getElementById('comp-priority').value;
    const description = document.getElementById('comp-desc').value;
    const fileInput = document.getElementById('comp-file');

    if (!title || !description || !category) return ui.showToast('Please fill all required complaint fields', 'error');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('priority', priority);
    formData.append('description', description);
    if (fileInput && fileInput.files[0]) {
      formData.append('image', fileInput.files[0]);
    }

    try {
      const res = await api.post('/complaints', formData, true);
      if (res.success) {
        ui.showToast('Complaint submitted successfully!', 'success');
        document.getElementById('submit-complaint-modal').classList.add('hidden');
        await this.loadComplaints();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  openStatusModal(id, currentStatus, currentNote) {
    document.getElementById('update-comp-id').value = id;
    document.getElementById('update-comp-status').value = currentStatus || 'In Progress';
    document.getElementById('update-comp-note').value = currentNote || '';
    document.getElementById('update-status-modal').classList.remove('hidden');
  },

  async submitUpdateStatus() {
    const id = document.getElementById('update-comp-id').value;
    const status = document.getElementById('update-comp-status').value;
    const resolutionNote = document.getElementById('update-comp-note').value;

    try {
      const res = await api.put(`/complaints/${id}/status`, { status, resolutionNote });
      if (res.success) {
        ui.showToast(`Complaint status updated to ${status}`, 'success');
        document.getElementById('update-status-modal').classList.add('hidden');
        await this.loadComplaints();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
