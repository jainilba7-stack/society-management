const dashboard = {
  async init() {
    try {
      const data = await api.get('/reports/stats');
      if (!data.success) return;

      const { stats, charts, recentPayments, recentComplaints } = data;

      // Fill Stat Cards
      this.setStat('stat-blocks', stats.totalBlocks);
      this.setStat('stat-flats', stats.totalFlats);
      this.setStat('stat-residents', stats.totalResidents);
      this.setStat('stat-collected', ui.formatCurrency(stats.totalCollected));
      this.setStat('stat-pending', ui.formatCurrency(stats.totalPending));
      this.setStat('stat-complaints', stats.totalComplaints);
      this.setStat('stat-secretaries', stats.activeSecretaries);

      // Render Charts if elements exist
      if (document.getElementById('chart-monthly-collection')) {
        this.renderMonthlyCollectionChart(charts.monthlyCollection);
      }
      if (document.getElementById('chart-paid-vs-pending')) {
        this.renderPaidVsPendingChart(charts.paidVsPending);
      }
      if (document.getElementById('chart-block-collection')) {
        this.renderBlockCollectionChart(charts.blockWiseCollection);
      }
      if (document.getElementById('chart-complaint-categories')) {
        this.renderComplaintCategoryChart(charts.complaintsByCategory);
      }

      // Render Recent Payments & Complaints
      this.renderRecentPayments(recentPayments);
      this.renderRecentComplaints(recentComplaints);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
      ui.showToast('Failed to load dashboard statistics', 'error');
    }
  },

  setStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val !== undefined ? val : '0';
  },

  renderMonthlyCollectionChart(dataArr) {
    const ctx = document.getElementById('chart-monthly-collection').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dataArr.map((d) => d.month),
        datasets: [
          {
            label: 'Collection (₹)',
            data: dataArr.map((d) => d.collected),
            borderColor: '#00b4d8',
            backgroundColor: 'rgba(0, 180, 216, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#00b4d8',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans' } } },
        },
      },
    });
  },

  renderPaidVsPendingChart(dataObj) {
    const ctx = document.getElementById('chart-paid-vs-pending').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Paid', 'Pending'],
        datasets: [
          {
            data: [dataObj.paid, dataObj.pending],
            backgroundColor: ['#00b4d8', '#f59e0b'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' } } } },
        cutout: '70%',
      },
    });
  },

  renderBlockCollectionChart(dataArr) {
    const ctx = document.getElementById('chart-block-collection').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dataArr.map((d) => d.blockName),
        datasets: [
          {
            label: 'Collection (₹)',
            data: dataArr.map((d) => d.amount),
            backgroundColor: '#00b4d8',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });
  },

  renderComplaintCategoryChart(dataArr) {
    const ctx = document.getElementById('chart-complaint-categories').getContext('2d');
    new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: dataArr.map((d) => d.category),
        datasets: [
          {
            data: dataArr.map((d) => d.count),
            backgroundColor: ['#00b4d8', '#0284c7', '#38bdf8', '#7dd3fc', '#06b6d4', '#0891b2', '#0e7490', '#164e63'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  },

  renderRecentPayments(payments) {
    const container = document.getElementById('recent-payments-list');
    if (!container) return;

    if (!payments || payments.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No recent payments recorded</div>`;
      return;
    }

    container.innerHTML = payments
      .map(
        (p) => `
        <div class="flex items-center justify-between p-3 border-b border-slate-100 hover:bg-slate-50 rounded-xl transition-all text-xs">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <i class="lucide-receipt text-sm"></i>
            </div>
            <div>
              <p class="font-bold text-slate-800">${p.resident ? p.resident.fullName : 'Resident'}</p>
              <p class="text-slate-400">${p.block ? p.block.name : ''} - Flat ${p.flat ? p.flat.flatNumber : ''}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-bold text-slate-900">${ui.formatCurrency(p.totalPaid)}</p>
            ${ui.getStatusBadge(p.status)}
          </div>
        </div>
      `
      )
      .join('');
  },

  renderRecentComplaints(complaints) {
    const container = document.getElementById('recent-complaints-list');
    if (!container) return;

    if (!complaints || complaints.length === 0) {
      container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">No recent complaints filed</div>`;
      return;
    }

    container.innerHTML = complaints
      .map(
        (c) => `
        <div class="p-3 border-b border-slate-100 hover:bg-slate-50 rounded-xl transition-all text-xs">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-slate-800 truncate max-w-[200px]">${c.title}</span>
            ${ui.getStatusBadge(c.status)}
          </div>
          <p class="text-slate-500 line-clamp-1">${c.description}</p>
          <div class="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span>${c.block ? c.block.name : ''} (${c.flatNumber})</span>
            <span>${ui.formatDate(c.createdAt)}</span>
          </div>
        </div>
      `
      )
      .join('');
  },
};
