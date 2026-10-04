const flatsModule = {
  async init() {
    await this.loadFlats();
  },

  async loadFlats() {
    const tableBody = document.getElementById('flats-table-body');
    if (!tableBody) return;

    const blockId = document.getElementById('filter-block')?.value || '';
    const occupancy = document.getElementById('filter-occupancy')?.value || '';
    const search = document.getElementById('search-flat')?.value || '';

    try {
      const query = new URLSearchParams();
      if (blockId) query.append('block', blockId);
      if (occupancy) query.append('occupancyStatus', occupancy);
      if (search) query.append('search', search);

      const data = await api.get(`/flats?${query.toString()}`);
      if (!data.success) return;

      if (data.flats.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 text-sm">No flats found</td></tr>`;
        return;
      }

      const user = api.getUser();

      tableBody.innerHTML = data.flats.map(f => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4 font-bold text-slate-900">${f.flatNumber}</td>
          <td class="px-6 py-4 font-medium text-slate-700">${f.block ? f.block.name : 'N/A'}</td>
          <td class="px-6 py-4 font-semibold text-slate-800">${f.ownerName || 'Unassigned'}</td>
          <td class="px-6 py-4 text-slate-500">${f.phone || 'N/A'}</td>
          <td class="px-6 py-4">${ui.getStatusBadge(f.occupancyStatus)}</td>
          <td class="px-6 py-4">${ui.getStatusBadge(f.maintenanceStatus)}</td>
          <td class="px-6 py-4 text-right">
            ${user.role !== 'resident' ? `
              <button onclick="flatsModule.openEditModal('${f._id}', '${f.flatNumber}', '${f.ownerName}', '${f.phone}', '${f.email}', '${f.familyMembers}', '${f.occupancyStatus}')" class="text-cyan-600 hover:text-cyan-800 font-semibold text-xs mr-3">Edit</button>
              ${user.role === 'admin' ? `<button onclick="flatsModule.deleteFlat('${f._id}')" class="text-rose-500 hover:text-rose-700 font-semibold text-xs">Delete</button>` : ''}
            ` : '<span class="text-slate-400 text-xs">View Only</span>'}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async createFlat() {
    const flatNumber = document.getElementById('create-flat-number').value;
    const blockInput = document.getElementById('create-flat-block').value;
    const ownerName = document.getElementById('create-flat-owner').value;
    const phone = document.getElementById('create-flat-phone').value;
    const email = document.getElementById('create-flat-email').value;

    if (!flatNumber || !blockInput) return ui.showToast('Flat number and block letter are required', 'error');

    try {
      const res = await api.post('/flats', { flatNumber, block: blockInput, ownerName, phone, email });
      if (res.success) {
        ui.showToast('Flat added successfully', 'success');
        document.getElementById('create-flat-modal').classList.add('hidden');
        document.getElementById('create-flat-number').value = '';
        document.getElementById('create-flat-block').value = '';
        document.getElementById('create-flat-owner').value = '';
        await this.loadFlats();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  openEditModal(id, number, owner, phone, email, members, status) {
    document.getElementById('edit-flat-id').value = id;
    document.getElementById('edit-flat-number').innerText = number;
    document.getElementById('edit-flat-owner').value = owner || '';
    document.getElementById('edit-flat-phone').value = phone || '';
    document.getElementById('edit-flat-email').value = email || '';
    document.getElementById('edit-flat-status').value = status || 'occupied';
    document.getElementById('edit-flat-modal').classList.remove('hidden');
  },

  async submitEditFlat() {
    const id = document.getElementById('edit-flat-id').value;
    const ownerName = document.getElementById('edit-flat-owner').value;
    const phone = document.getElementById('edit-flat-phone').value;
    const email = document.getElementById('edit-flat-email').value;
    const occupancyStatus = document.getElementById('edit-flat-status').value;

    try {
      const res = await api.put(`/flats/${id}`, { ownerName, phone, email, occupancyStatus });
      if (res.success) {
        ui.showToast('Flat updated successfully', 'success');
        document.getElementById('edit-flat-modal').classList.add('hidden');
        await this.loadFlats();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async deleteFlat(id) {
    if (!confirm('Are you sure you want to delete this flat?')) return;
    try {
      const res = await api.delete(`/flats/${id}`);
      if (res.success) {
        ui.showToast('Flat deleted', 'success');
        await this.loadFlats();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
