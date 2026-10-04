const blocksModule = {
  async init() {
    await this.loadBlocks();
  },

  async loadBlocks() {
    const container = document.getElementById('blocks-grid');
    if (!container) return;

    try {
      const data = await api.get('/blocks');
      if (!data.success) return;

      if (data.blocks.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400">No blocks found</div>`;
        return;
      }

      const user = api.getUser();

      container.innerHTML = data.blocks
        .map(
          (b) => `
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 font-extrabold text-xl flex items-center justify-center border border-cyan-100 shadow-xs">
                ${b.name.replace('Block ', '')}
              </div>
              ${
                user.role === 'admin'
                  ? `
                <div class="flex space-x-2">
                  <button onclick="blocksModule.openAssignModal('${b._id}', '${b.name}')" class="p-2 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-slate-50 transition-colors" title="Assign Secretary">
                    <i class="lucide-user-plus text-base"></i>
                  </button>
                  <button onclick="blocksModule.deleteBlock('${b._id}')" class="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-50 transition-colors" title="Delete Block">
                    <i class="lucide-trash-2 text-base"></i>
                  </button>
                </div>
              `
                  : ''
              }
            </div>

            <h3 class="text-lg font-bold text-slate-900 mb-1">${b.name}</h3>
            <p class="text-xs text-slate-500 mb-4">${b.description || 'Residential Block'}</p>

            <div class="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Block Secretary:</span>
                <span class="font-bold text-slate-800">${b.secretary ? b.secretary.fullName : '<span class="text-amber-600 font-medium">Unassigned</span>'}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Total Flats:</span>
                <span class="font-bold text-slate-800">${b.totalFlats} / ${b.totalFlatsCount || 40}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Residents:</span>
                <span class="font-bold text-slate-800">${b.totalResidents}</span>
              </div>
            </div>

            <!-- Payment Collection Progress -->
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between font-semibold">
                <span class="text-slate-600">Paid Maintenance:</span>
                <span class="text-cyan-700">${b.paidFlatsCount} Paid | ${b.pendingFlatsCount} Pending</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-cyan-500 h-2 rounded-full" style="width: ${b.totalFlats > 0 ? (b.paidFlatsCount / b.totalFlats) * 100 : 0}%"></div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <a href="flats.html?blockId=${b._id}" class="text-cyan-600 font-bold hover:underline flex items-center">
              View Flats <i class="lucide-chevron-right text-sm ml-1"></i>
            </a>
            <a href="residents.html?blockId=${b._id}" class="text-slate-500 hover:text-slate-700 font-medium">
              View Residents
            </a>
          </div>
        </div>
      `
        )
        .join('');
    } catch (err) {
      ui.showToast(err.message, 'error');
    }
  },

  async createBlock() {
    const name = document.getElementById('block-name-input').value;
    const totalFlatsCount = document.getElementById('block-flats-input').value;
    const description = document.getElementById('block-desc-input').value;

    if (!name) return ui.showToast('Please enter a block name', 'error');

    try {
      const res = await api.post('/blocks', { name, totalFlatsCount, description });
      if (res.success) {
        ui.showToast('Block created successfully', 'success');
        document.getElementById('create-block-modal').classList.add('hidden');
        await this.loadBlocks();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  openAssignModal(blockId, blockName) {
    document.getElementById('assign-block-id').value = blockId;
    document.getElementById('assign-block-title').innerText = `Assign Secretary for ${blockName}`;
    this.loadSecretaryOptions();
    document.getElementById('assign-secretary-modal').classList.remove('hidden');
  },

  async loadSecretaryOptions() {
    try {
      const data = await api.get('/residents');
      const select = document.getElementById('assign-user-select');
      if (!select || !data.success) return;

      select.innerHTML = data.residents
        .map((r) => `<option value="${r._id}">${r.fullName} (${r.email}) - ${r.role}</option>`)
        .join('');
    } catch (e) {
      console.warn(e);
    }
  },

  async submitAssignSecretary() {
    const blockId = document.getElementById('assign-block-id').value;
    const secretaryId = document.getElementById('assign-user-select').value;

    try {
      const res = await api.put(`/blocks/${blockId}/assign-secretary`, { secretaryId });
      if (res.success) {
        ui.showToast(res.message, 'success');
        document.getElementById('assign-secretary-modal').classList.add('hidden');
        await this.loadBlocks();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },

  async deleteBlock(id) {
    if (!confirm('Are you sure you want to delete this block?')) return;
    try {
      const res = await api.delete(`/blocks/${id}`);
      if (res.success) {
        ui.showToast('Block deleted successfully', 'success');
        await this.loadBlocks();
      }
    } catch (e) {
      ui.showToast(e.message, 'error');
    }
  },
};
