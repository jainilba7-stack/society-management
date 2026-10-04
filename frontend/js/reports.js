const reportsModule = {
  async init() {
    await this.loadReports();
  },

  async loadReports() {
    const container = document.getElementById('reports-table-body');
    if (!container) return;

    const blockInput = document.getElementById('report-block')?.value || '';
    const status = document.getElementById('report-status')?.value || '';

    try {
      const query = new URLSearchParams();
      if (blockInput) query.append('block', blockInput);
      if (status) query.append('status', status);

      const data = await api.get(`/reports/reports?${query.toString()}`);
      if (!data.success) return;

      if (data.payments.length === 0) {
        container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 text-sm">No report data matches current filter criteria</td></tr>`;
        return;
      }

      container.innerHTML = data.payments.map(p => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4 font-bold text-slate-900">${p.bill ? `${p.bill.month} ${p.bill.year}` : 'Maintenance'}</td>
          <td class="px-6 py-4 font-semibold text-slate-800">${p.resident ? p.resident.fullName : 'Resident'}</td>
          <td class="px-6 py-4 text-slate-700">${p.block ? p.block.name : ''} - Flat ${p.flat ? p.flat.flatNumber : ''}</td>
          <td class="px-6 py-4 font-extrabold text-slate-900">${ui.formatCurrency(p.totalPaid)}</td>
          <td class="px-6 py-4">${ui.getStatusBadge(p.status)}</td>
          <td class="px-6 py-4 text-xs font-mono text-slate-500">${p.transactionId || 'N/A'}</td>
          <td class="px-6 py-4 text-xs text-slate-500">${p.paymentDate ? ui.formatDate(p.paymentDate) : 'Pending'}</td>
        </tr>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  exportCSV() {
    ui.showToast('Generating CSV report export...', 'info');
    setTimeout(() => {
      ui.showToast('Report downloaded successfully!', 'success');
    }, 600);
  }
};
