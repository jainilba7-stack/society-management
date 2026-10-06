const maintenanceModule = {
  async init() {
    await this.loadBills();
    await this.loadPayments();
  },

  async loadBills() {
    const container = document.getElementById('bills-list');
    if (!container) return;

    try {
      const data = await api.get('/maintenance/bills');
      if (!data.success) return;

      if (data.bills.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">No maintenance bills created yet</div>`;
        return;
      }

      container.innerHTML = data.bills.map(b => `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between card-hover">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 font-extrabold flex items-center justify-center text-lg">
              <i class="lucide-calendar"></i>
            </div>
            <div>
              <h4 class="font-extrabold text-slate-900 text-base">${b.month} ${b.year} Maintenance</h4>
              <p class="text-xs text-slate-500">${b.description} | Due Date: <span class="font-semibold text-slate-700">${ui.formatDate(b.dueDate)}</span></p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-extrabold text-slate-900 text-lg">${ui.formatCurrency(b.amount)}</p>
            <p class="text-[11px] text-amber-600 font-medium">Late fee: ₹${b.lateFee}</p>
          </div>
        </div>
      `).join('');
    } catch (e) { console.warn(e); }
  },

  async loadPayments() {
    const tableBody = document.getElementById('payments-table-body');
    if (!tableBody) return;

    try {
      const data = await api.get('/maintenance/payments');
      if (!data.success) return;

      if (data.payments.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 text-sm">No payment records found</td></tr>`;
        return;
      }

      const user = api.getUser();

      tableBody.innerHTML = data.payments.map(p => `
        <tr class="border-b border-slate-100 table-row-hover text-sm">
          <td class="px-6 py-4 font-bold text-slate-900">${p.bill ? `${p.bill.month} ${p.bill.year}` : 'Maintenance'}</td>
          <td class="px-6 py-4 font-semibold text-slate-800">${p.resident ? p.resident.fullName : 'Resident'}</td>
          <td class="px-6 py-4 font-bold text-slate-900">${p.block ? p.block.name : ''} - ${p.flat ? p.flat.flatNumber : ''}</td>
          <td class="px-6 py-4 font-extrabold text-slate-900">${ui.formatCurrency(p.totalPaid)}</td>
          <td class="px-6 py-4">${ui.getStatusBadge(p.status)}</td>
          <td class="px-6 py-4 text-xs text-slate-500 font-mono">${p.transactionId || 'Pending'}</td>
          <td class="px-6 py-4 text-right">
            ${p.status === 'pending' ? `
              <button onclick="maintenanceModule.payOnline('${p._id}', ${p.totalPaid})" class="btn-aqua text-xs py-1.5 px-3">Pay Now</button>
            ` : `
              <button onclick="maintenanceModule.downloadReceipt('${p._id}')" class="text-cyan-600 hover:text-cyan-800 font-bold text-xs flex items-center justify-end">
                <i class="lucide-download text-sm mr-1"></i> Receipt
              </button>
            `}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async createBill() {
    const month = document.getElementById('bill-month').value;
    const year = document.getElementById('bill-year').value;
    const amount = document.getElementById('bill-amount').value;
    const dueDate = document.getElementById('bill-duedate').value;
    const lateFee = document.getElementById('bill-latefee').value;
    const description = document.getElementById('bill-desc').value;

    if (!month || !amount || !dueDate) return ui.showToast('Please fill all required bill fields', 'error');

    try {
      const res = await api.post('/maintenance/bills', { month, year, amount, dueDate, lateFee, description });
      if (res.success) {
        ui.showToast('Maintenance bill issued to all residents!', 'success');
        document.getElementById('create-bill-modal').classList.add('hidden');
        await this.init();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async payOnline(paymentId, amount) {
    ui.showToast('Opening Razorpay Payment Portal (GPay, Cards, UPI, Netbanking)...', 'info');

    try {
      // 1. Create official Razorpay Order
      const orderRes = await api.post('/maintenance/create-order', { paymentId, amount });
      if (!orderRes.success) return;

      const user = api.getUser();

      // Launch Razorpay Checkout Popup
      if (typeof Razorpay !== 'undefined') {
        const options = {
          key: orderRes.key,
          amount: orderRes.order.amount,
          currency: 'INR',
          name: 'Society Management System',
          description: 'Monthly Maintenance Payment',
          order_id: orderRes.order.id,
          prefill: {
            name: user ? user.fullName : '',
            email: user ? user.email : '',
            contact: user && user.phone ? user.phone : '9876543210',
          },
          theme: { color: '#00b4d8' },
          handler: async (response) => {
            await maintenanceModule.verifyPayment(paymentId, response);
          },
          modal: {
            ondismiss: function () {
              ui.showToast('Payment window closed', 'warning');
            },
          },
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        ui.showToast('Razorpay Checkout SDK not loaded in browser', 'error');
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async verifyPayment(paymentId, rzpDetails) {
    try {
      const res = await api.post('/maintenance/verify-payment', {
        paymentId,
        razorpayOrderId: rzpDetails.razorpay_order_id,
        razorpayPaymentId: rzpDetails.razorpay_payment_id,
        razorpaySignature: rzpDetails.razorpay_signature,
        paymentMethod: 'razorpay',
      });

      if (res.success) {
        ui.showToast('Payment verified & marked PAID! Receipt generated.', 'success');
        await this.loadPayments();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async downloadReceipt(paymentId) {
    try {
      const res = await api.get(`/maintenance/receipt/${paymentId}`);
      if (!res.success) return;

      const r = res.receipt;
      const receiptWindow = window.open('', '_blank');
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Payment Receipt - ${r.transactionId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: #f8fafc; }
              .card { background: white; max-width: 600px; margin: auto; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
              .header { text-align: center; border-bottom: 2px solid #00b4d8; padding-bottom: 15px; margin-bottom: 25px; }
              .header h2 { color: #00b4d8; margin: 0; }
              .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
              .label { font-weight: bold; color: #64748b; }
              .value { font-weight: bold; color: #0f172a; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
              .btn { display: inline-block; background: #00b4d8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h2>Society Management System</h2>
                <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">OFFICIAL MAINTENANCE PAYMENT RECEIPT</p>
              </div>
              <div class="row"><span class="label">Transaction ID:</span><span class="value">${r.transactionId}</span></div>
              <div class="row"><span class="label">Resident Name:</span><span class="value">${r.resident ? r.resident.fullName : 'Resident'}</span></div>
              <div class="row"><span class="label">Block & Flat:</span><span class="value">${r.block ? r.block.name : ''} - Flat ${r.flat ? r.flat.flatNumber : ''}</span></div>
              <div class="row"><span class="label">Amount Paid:</span><span class="value">₹${r.totalPaid}</span></div>
              <div class="row"><span class="label">Payment Date:</span><span class="value">${new Date(r.paymentDate).toLocaleDateString()}</span></div>
              <div class="row"><span class="label">Status:</span><span class="value" style="color:#059669;">PAID</span></div>
              <div style="text-align: center;">
                <a href="javascript:window.print()" class="btn">Print / Save as PDF</a>
              </div>
              <div class="footer">Thank you for your timely maintenance payment!</div>
            </div>
          </body>
        </html>
      `);
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },
};
