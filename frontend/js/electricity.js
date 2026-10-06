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
        tableBody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 text-sm">No electricity bills found</td></tr>`;
        return;
      }

      const user = api.getUser();

      tableBody.innerHTML = data.bills.map(b => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4 font-bold text-slate-900">${b.month} ${b.year}</td>
          <td class="px-6 py-4 font-extrabold text-cyan-700">Flat ${b.flatNumber || (b.flat ? b.flat.flatNumber : 'N/A')}</td>
          <td class="px-6 py-4 text-xs font-medium text-slate-700">
            <div><span class="font-bold text-slate-900">${b.unitsConsumed || 0}</span> kWh</div>
            <div class="text-[11px] text-slate-400">${b.meterReading ? `Reading: ${b.meterReading}` : ''}</div>
          </td>
          <td class="px-6 py-4 font-extrabold text-slate-900">${ui.formatCurrency(b.amount)}</td>
          <td class="px-6 py-4 text-slate-600">${ui.formatDate(b.dueDate)}</td>
          <td class="px-6 py-4">
            ${b.billImageUrl ? `
              <button onclick="ui.showImageModal('${b.billImageUrl}', 'Flat ${b.flatNumber} Meter Proof')" class="btn-aqua-outline text-xs py-1 px-2.5 flex items-center">
                <i class="lucide-image text-xs mr-1"></i> View Photo
              </button>
            ` : '<span class="text-slate-400 text-xs font-normal">No photo</span>'}
          </td>
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
    const flatNumber = document.getElementById('elec-flatnumber')?.value || '';
    const month = document.getElementById('elec-month').value;
    const year = document.getElementById('elec-year').value;
    const unitsConsumed = document.getElementById('elec-units')?.value || '0';
    const meterReading = document.getElementById('elec-reading')?.value || '';
    const amount = document.getElementById('elec-amount').value;
    const dueDate = document.getElementById('elec-duedate').value;
    const description = document.getElementById('elec-desc').value;
    const fileInput = document.getElementById('elec-bill-image');

    if (!flatNumber.trim() || !amount || !dueDate) return ui.showToast('Please specify Flat Number, Amount and Due Date', 'error');

    try {
      const formData = new FormData();
      formData.append('flatNumber', flatNumber.trim());
      formData.append('month', month);
      formData.append('year', year);
      formData.append('unitsConsumed', unitsConsumed);
      formData.append('meterReading', meterReading);
      formData.append('amount', amount);
      formData.append('dueDate', dueDate);
      formData.append('description', description);
      if (fileInput && fileInput.files[0]) {
        formData.append('billImage', fileInput.files[0]);
      }

      const res = await api.post('/electricity', formData, true);
      if (res.success) {
        ui.showToast(res.message || 'Electricity bill issued to flat successfully!', 'success');
        document.getElementById('create-elec-modal').classList.add('hidden');
        if (document.getElementById('elec-flatnumber')) document.getElementById('elec-flatnumber').value = '';
        if (document.getElementById('elec-amount')) document.getElementById('elec-amount').value = '';
        if (document.getElementById('elec-units')) document.getElementById('elec-units').value = '';
        if (document.getElementById('elec-reading')) document.getElementById('elec-reading').value = '';
        if (fileInput) fileInput.value = '';
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
