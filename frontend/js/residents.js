const residentsModule = {
  async init() {
    await this.loadResidents();
  },

  async loadResidents() {
    const tableBody = document.getElementById('residents-table-body');
    if (!tableBody) return;

    const blockInput = document.getElementById('filter-block')?.value || '';
    const search = document.getElementById('search-resident')?.value || '';

    try {
      const query = new URLSearchParams();
      if (blockInput) query.append('block', blockInput);
      if (search) query.append('search', search);

      const data = await api.get(`/residents?${query.toString()}`);
      if (!data.success) return;

      if (data.residents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 text-sm">No residents found</td></tr>`;
        return;
      }

      const user = api.getUser();

      tableBody.innerHTML = data.residents.map(r => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4">
            <div class="flex items-center space-x-3">
              <img src="${r.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" class="w-8 h-8 rounded-full border border-cyan-300 object-cover" alt="User">
              <div>
                <p class="font-bold text-slate-900">${r.fullName}</p>
                <p class="text-xs text-slate-400">${r.email}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 font-semibold text-slate-800">${r.block ? r.block.name : 'N/A'}</td>
          <td class="px-6 py-4 font-bold text-slate-900">${r.flatNumber || 'N/A'}</td>
          <td class="px-6 py-4 text-slate-600">${r.phone || 'N/A'}</td>
          <td class="px-6 py-4"><span class="px-2.5 py-1 text-xs font-bold rounded-full bg-cyan-50 text-cyan-700 capitalize">${r.role}</span></td>
          <td class="px-6 py-4">${ui.getStatusBadge(r.accountStatus)}</td>
          <td class="px-6 py-4 text-right">
            ${user.role === 'admin' ? `
              <button onclick="residentsModule.openEditModal('${r._id}', '${r.fullName}', '${r.phone}', '${r.role}', '${r.accountStatus}')" class="text-cyan-600 hover:text-cyan-800 font-semibold text-xs mr-3">Edit</button>
              <button onclick="residentsModule.deleteResident('${r._id}')" class="text-rose-500 hover:text-rose-700 font-semibold text-xs">Remove</button>
            ` : '<span class="text-slate-400 text-xs">Read Only</span>'}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  openEditModal(id, name, phone, role, status) {
    document.getElementById('edit-res-id').value = id;
    document.getElementById('edit-res-name').innerText = name;
    document.getElementById('edit-res-phone').value = phone || '';
    document.getElementById('edit-res-role').value = role || 'resident';
    document.getElementById('edit-res-status').value = status || 'active';
    document.getElementById('edit-res-modal').classList.remove('hidden');
  },

  async submitEditResident() {
    const id = document.getElementById('edit-res-id').value;
    const phone = document.getElementById('edit-res-phone').value;
    const role = document.getElementById('edit-res-role').value;
    const accountStatus = document.getElementById('edit-res-status').value;

    try {
      const res = await api.put(`/residents/${id}`, { phone, role, accountStatus });
      if (res.success) {
        ui.showToast('Resident updated successfully', 'success');
        document.getElementById('edit-res-modal').classList.add('hidden');
        await this.loadResidents();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async deleteResident(id) {
    if (!confirm('Are you sure you want to remove this resident?')) return;
    try {
      const res = await api.delete(`/residents/${id}`);
      if (res.success) {
        ui.showToast('Resident removed', 'success');
        await this.loadResidents();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
