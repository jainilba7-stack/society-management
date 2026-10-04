const electricityModule = {
  async init() {
    await this.loadElectricityBills();
  },

  async loadElectricityBills() {
    const tableBody = document.getElementById('electricity-table-body');
    if (!tableBody) return;

    const blockInput = document.getElementById('filter-block')?.value || '';

    try {
      const query = blockInput ? `?block=${encodeURIComponent(blockInput)}` : '';
      const data = await api.get(`/electricity${query}`);
      if (!data.success) return;

      if (data.bills.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 text-sm">No electricity bills found</td></tr>`;
        return;
      }

      const user = api.getUser();

      tableBody.innerHTML = data.bills.map(b => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4 font-bold text-slate-900">${b.month} ${b.year}</td>
          <td class="px-6 py-4 font-semibold text-slate-800">${b.block ? b.block.name : 'All Blocks'}</td>
          <td class="px-6 py-4 font-extrabold text-slate-900">${ui.formatCurrency(b.amount)}</td>
          <td class="px-6 py-4 text-slate-600">${ui.formatDate(b.dueDate)}</td>
          <td class="px-6 py-4">${ui.getStatusBadge(b.status)}</td>
          <td class="px-6 py-4 text-right">
            ${user.role !== 'resident' ? `
              <button onclick="electricityModule.toggleStatus('${b._id}', '${b.status === 'paid' ? 'pending' : 'paid'}')" class="text-cyan-600 hover:text-cyan-800 font-semibold text-xs">
                Mark ${b.status === 'paid' ? 'Pending' : 'Paid'}
              </button>
            ` : '<span class="text-slate-400 text-xs">View Only</span>'}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async createBill() {
    const month = document.getElementById('elec-month').value;
    const year = document.getElementById('elec-year').value;
    const blockInput = document.getElementById('create-bill-block').value;
    const amount = document.getElementById('elec-amount').value;
    const dueDate = document.getElementById('elec-duedate').value;
    const description = document.getElementById('elec-desc').value;

    if (!month || !blockInput || !amount || !dueDate) return ui.showToast('Please fill all required fields', 'error');

    try {
      const res = await api.post('/electricity', { month, year, block: blockInput, amount, dueDate, description });
      if (res.success) {
        ui.showToast('Electricity bill recorded successfully', 'success');
        document.getElementById('create-elec-modal').classList.add('hidden');
        document.getElementById('create-bill-block').value = '';
        document.getElementById('elec-amount').value = '';
        await this.loadElectricityBills();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async toggleStatus(id, newStatus) {
    try {
      const res = await api.put(`/electricity/${id}/status`, { status: newStatus });
      if (res.success) {
        ui.showToast(`Bill marked as ${newStatus}`, 'success');
        await this.loadElectricityBills();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  }
};
