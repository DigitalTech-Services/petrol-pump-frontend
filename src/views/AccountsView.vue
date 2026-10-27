<template>
  <div>
    <PageHeader title="Bank & Tax (CA)" subtitle="Bank statements, bank charges & tax payments for your CA" :crumbs="['Home','Accounts & Tax']">
      <template #actions>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="exportCaPack"><Download :size="14" /> Export CA Pack</button>
        <button class="btn btn-ghost flex items-center gap-1.5" @click="doPrint"><Printer :size="14" /> Print</button>
        <button v-if="auth.canWrite && tab !== 'overview'" class="btn btn-primary flex items-center gap-1.5" @click="openAdd">
          <Plus :size="14" /> {{ addLabel }}
        </button>
      </template>
    </PageHeader>

    <!-- Period -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="fy" class="form-select">
        <option v-for="y in fyOptions" :key="y" :value="y">FY {{ y }}-{{ String(y + 1).slice(2) }}</option>
      </select>
      <select v-model="month" class="form-select">
        <option value="">Full Year</option>
        <option v-for="m in fyMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
      <span class="self-center text-[12px] text-[var(--text-3)] ml-auto">{{ periodLabel }}</span>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Statements"   :value="`${summary.statements.shared}/${summary.statements.count}`" :icon="FileText" color="#3b82f6" :sub="`${summary.statements.pending} pending with CA`" />
      <KpiCard label="Bank Charges" :value="fmtCompact(summary.charges.total)" :exact="fmtINR(summary.charges.total)" :icon="Landmark" color="#ef4444" :sub="`incl. GST ${fmtINR(summary.charges.gst)}`" />
      <KpiCard label="Tax Paid"     :value="fmtCompact(summary.taxes.total)"   :exact="fmtINR(summary.taxes.total)"   :icon="ReceiptIndianRupee" color="#10b981" :sub="`${summary.taxes.count} payments`" />
      <KpiCard label="Interest + Penalty" :value="fmtCompact(summary.taxes.interest + summary.taxes.penalty)" :exact="fmtINR(summary.taxes.interest + summary.taxes.penalty)" :icon="AlertTriangle" color="#f59e0b" sub="on tax payments" />
    </div>

    <!-- Tabs -->
    <div class="tab-bar mb-6 overflow-x-auto">
      <button class="tab-btn flex items-center gap-1.5 whitespace-nowrap" :class="{ active: tab === 'overview' }"   @click="tab = 'overview'"><BarChart3 :size="14" /> Overview</button>
      <button class="tab-btn flex items-center gap-1.5 whitespace-nowrap" :class="{ active: tab === 'statements' }" @click="tab = 'statements'"><FileText :size="14" /> Bank Statements</button>
      <button class="tab-btn flex items-center gap-1.5 whitespace-nowrap" :class="{ active: tab === 'charges' }"    @click="tab = 'charges'"><Landmark :size="14" /> Bank Charges</button>
      <button class="tab-btn flex items-center gap-1.5 whitespace-nowrap" :class="{ active: tab === 'taxes' }"      @click="tab = 'taxes'"><ReceiptIndianRupee :size="14" /> Tax Payments</button>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="card card-body text-center text-[13px] text-[var(--text-3)] py-8">
      <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
    </div>
    <div v-else-if="loadError" class="card card-body text-center py-8">
      <p class="text-[#ef4444] text-[13px] mb-2">{{ loadError }}</p>
      <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadAll">Retry</button>
    </div>

    <template v-else>
      <!-- ===== OVERVIEW ===== -->
      <div v-if="tab === 'overview'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)]">Tax Paid by Type</div></div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead><tr><th>Tax</th><th>Payments</th><th>Tax (₹)</th><th>Interest</th><th>Penalty</th><th>Total (₹)</th></tr></thead>
              <tbody>
                <tr v-for="t in summary.taxes.by_type" :key="t.type">
                  <td><span class="badge badge-indigo text-[11px]">{{ t.type }}</span></td>
                  <td class="font-mono-custom text-[12px]">{{ t.count }}</td>
                  <td class="amt">{{ fmt(t.amount) }}</td>
                  <td class="amt">{{ fmt(t.interest) }}</td>
                  <td class="amt">{{ fmt(t.penalty) }}</td>
                  <td class="amt font-semibold">{{ fmt(t.total) }}</td>
                </tr>
                <tr v-if="!summary.taxes.by_type.length"><td colspan="6" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No tax payments for this period.</td></tr>
              </tbody>
              <tfoot v-if="summary.taxes.by_type.length">
                <tr><td colspan="2">TOTAL</td><td>{{ fmt(summary.taxes.amount) }}</td><td>{{ fmt(summary.taxes.interest) }}</td><td>{{ fmt(summary.taxes.penalty) }}</td><td>{{ fmt(summary.taxes.total) }}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)]">Bank Charges by Type</div></div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead><tr><th>Charge</th><th>Entries</th><th>Amount (₹)</th><th>GST (₹)</th><th>Total (₹)</th></tr></thead>
              <tbody>
                <tr v-for="c in summary.charges.by_type" :key="c.type">
                  <td><span class="badge badge-gray text-[11px]">{{ c.type }}</span></td>
                  <td class="font-mono-custom text-[12px]">{{ c.count }}</td>
                  <td class="amt">{{ fmt(c.amount) }}</td>
                  <td class="amt">{{ fmt(c.gst) }}</td>
                  <td class="amt font-semibold">{{ fmt(c.amount + c.gst) }}</td>
                </tr>
                <tr v-if="!summary.charges.by_type.length"><td colspan="5" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No bank charges for this period.</td></tr>
              </tbody>
              <tfoot v-if="summary.charges.by_type.length">
                <tr><td colspan="2">TOTAL</td><td>{{ fmt(summary.charges.amount) }}</td><td>{{ fmt(summary.charges.gst) }}</td><td>{{ fmt(summary.charges.total) }}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="card lg:col-span-2">
          <div class="card-header"><div class="font-display font-bold text-[15px] text-[var(--text)]">Statements Pending with CA</div></div>
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead><tr><th>Month</th><th>Bank</th><th>Account</th><th>Closing (₹)</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="s in pendingStatements" :key="s.id">
                  <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ fmtMonth(s.statement_month) }}</span></td>
                  <td class="text-[12.5px]">{{ s.bank_name }}</td>
                  <td class="font-mono-custom text-[12px] text-[var(--text-2)]">{{ s.account_no || '—' }}</td>
                  <td class="amt">{{ fmt(s.closing_balance) }}</td>
                  <td>
                    <button v-if="auth.canWrite" class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="toggleShared(s)"><Send :size="11" /> Mark shared</button>
                    <span v-else class="badge badge-red text-[11px]">Pending</span>
                  </td>
                </tr>
                <tr v-if="!pendingStatements.length"><td colspan="5" class="text-center text-[12.5px] text-[var(--text-3)] py-6">All statements for this period have been shared. 🎉</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===== BANK STATEMENTS ===== -->
      <div v-if="tab === 'statements'" class="card">
        <div class="card-header flex flex-wrap items-center gap-3">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Bank Statements — {{ periodLabel }}</div>
          <select v-model="bankFilter" class="form-select ml-auto">
            <option value="">All Banks</option>
            <option v-for="b in options.banks" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Month</th><th>Bank</th><th>Account</th><th v-if="auth.isOwner">Station</th><th>Opening</th><th>Credits</th><th>Debits</th><th>Closing</th><th>CA Status</th><th>File</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="s in filteredStatements" :key="s.id">
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ fmtMonth(s.statement_month) }}</span></td>
                <td class="text-[12.5px]">{{ s.bank_name }}</td>
                <td class="font-mono-custom text-[12px] text-[var(--text-2)]">{{ s.account_no || '—' }}</td>
                <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ s.station?.name || '—' }}</td>
                <td class="amt">{{ fmt(s.opening_balance) }}</td>
                <td class="amt text-positive">{{ fmt(s.total_credits) }}</td>
                <td class="amt text-negative">{{ fmt(s.total_debits) }}</td>
                <td class="amt font-semibold">{{ fmt(s.closing_balance) }}</td>
                <td>
                  <span v-if="s.shared_with_ca" class="badge badge-green text-[11px]" :title="`Shared on ${formatDate(s.shared_on)}`">Shared · {{ formatDate(s.shared_on, { year: false }) }}</span>
                  <span v-else class="badge badge-red text-[11px]">Pending</span>
                </td>
                <td>
                  <a v-if="s.statement_url" :href="s.statement_url" target="_blank" rel="noopener" class="text-[#3b82f6] hover:underline text-[12px] flex items-center gap-1"><ExternalLink :size="12" /> Open</a>
                  <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                </td>
                <td>
                  <div v-if="auth.canWrite" class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" :title="s.shared_with_ca ? 'Mark as pending' : 'Mark as shared with CA'" @click="toggleShared(s)">
                      <Undo2 v-if="s.shared_with_ca" :size="11" /><Send v-else :size="11" />
                    </button>
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(s)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(s)"><Trash2 :size="11" /></button>
                  </div>
                  <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                </td>
              </tr>
              <tr v-if="!filteredStatements.length">
                <td :colspan="auth.isOwner ? 11 : 10" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No bank statements for this period.</td>
              </tr>
            </tbody>
            <tfoot v-if="filteredStatements.length">
              <tr><td :colspan="auth.isOwner ? 5 : 4">TOTAL</td><td>{{ fmt(sum(filteredStatements, 'total_credits')) }}</td><td>{{ fmt(sum(filteredStatements, 'total_debits')) }}</td><td colspan="4">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- ===== BANK CHARGES ===== -->
      <div v-if="tab === 'charges'" class="card">
        <div class="card-header flex flex-wrap items-center gap-3">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Bank Charges — {{ periodLabel }}</div>
          <div class="flex flex-wrap gap-2 ml-auto">
            <select v-model="bankFilter" class="form-select">
              <option value="">All Banks</option>
              <option v-for="b in options.banks" :key="b" :value="b">{{ b }}</option>
            </select>
            <select v-model="chargeTypeFilter" class="form-select">
              <option value="">All Charge Types</option>
              <option v-for="c in options.charge_types" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Bank</th><th v-if="auth.isOwner">Station</th><th>Charge Type</th><th>Amount (₹)</th><th>GST (₹)</th><th>Total (₹)</th><th>Reference</th><th>Narration</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="c in filteredCharges" :key="c.id">
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(c.date) }}</span></td>
                <td class="text-[12.5px]">{{ c.bank_name }}<div v-if="c.account_no" class="font-mono-custom text-[10.5px] text-[var(--text-3)]">{{ c.account_no }}</div></td>
                <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ c.station?.name || '—' }}</td>
                <td><span class="badge badge-gray text-[11px]">{{ c.charge_type }}</span></td>
                <td class="amt">{{ fmt(c.amount) }}</td>
                <td class="amt">{{ fmt(c.gst_amount) }}</td>
                <td class="amt font-semibold text-negative">{{ fmt(c.amount + c.gst_amount) }}</td>
                <td class="font-mono-custom text-[11.5px] text-[var(--text-2)]">{{ c.reference_no || '—' }}</td>
                <td class="max-w-[220px]"><div class="text-[12px] text-[var(--text-2)] truncate" :title="c.narration">{{ c.narration || '—' }}</div></td>
                <td>
                  <div v-if="auth.canWrite" class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(c)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(c)"><Trash2 :size="11" /></button>
                  </div>
                  <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                </td>
              </tr>
              <tr v-if="!filteredCharges.length">
                <td :colspan="auth.isOwner ? 10 : 9" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No bank charges for this period.</td>
              </tr>
            </tbody>
            <tfoot v-if="filteredCharges.length">
              <tr><td :colspan="auth.isOwner ? 4 : 3">TOTAL</td><td>{{ fmt(sum(filteredCharges, 'amount')) }}</td><td>{{ fmt(sum(filteredCharges, 'gst_amount')) }}</td><td>{{ fmt(sum(filteredCharges, 'amount') + sum(filteredCharges, 'gst_amount')) }}</td><td colspan="3">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- ===== TAX PAYMENTS ===== -->
      <div v-if="tab === 'taxes'" class="card">
        <div class="card-header flex flex-wrap items-center gap-3">
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Tax Payments — {{ periodLabel }}</div>
          <select v-model="taxTypeFilter" class="form-select ml-auto">
            <option value="">All Tax Types</option>
            <option v-for="t in options.tax_types" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Paid On</th><th>Tax</th><th v-if="auth.isOwner">Station</th><th>Period</th><th>Challan / Ref</th><th>Tax (₹)</th><th>Interest</th><th>Penalty</th><th>Total (₹)</th><th>Mode</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="t in filteredTaxes" :key="t.id">
                <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ formatDate(t.date) }}</span></td>
                <td><span class="badge badge-indigo text-[11px]">{{ t.tax_type }}</span></td>
                <td v-if="auth.isOwner" class="text-[12px] text-[var(--text-2)]">{{ t.station?.name || '—' }}</td>
                <td class="text-[12px] text-[var(--text-2)]">{{ t.period || '—' }}</td>
                <td class="font-mono-custom text-[11.5px] text-[var(--text-2)]" :title="t.narration">{{ t.challan_no || '—' }}</td>
                <td class="amt">{{ fmt(t.amount) }}</td>
                <td class="amt">{{ fmt(t.interest) }}</td>
                <td class="amt" :class="t.penalty > 0 ? 'text-negative' : ''">{{ fmt(t.penalty) }}</td>
                <td class="amt font-semibold">{{ fmt(taxTotal(t)) }}</td>
                <td class="text-[12px] text-[var(--text-2)]">{{ t.payment_mode || '—' }}</td>
                <td>
                  <div v-if="auth.canWrite" class="flex gap-1.5">
                    <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(t)"><Pencil :size="11" /></button>
                    <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(t)"><Trash2 :size="11" /></button>
                  </div>
                  <span v-else class="text-[11px] text-[var(--text-3)]">—</span>
                </td>
              </tr>
              <tr v-if="!filteredTaxes.length">
                <td :colspan="auth.isOwner ? 11 : 10" class="text-center text-[12.5px] text-[var(--text-3)] py-6">No tax payments for this period.</td>
              </tr>
            </tbody>
            <tfoot v-if="filteredTaxes.length">
              <tr><td :colspan="auth.isOwner ? 5 : 4">TOTAL</td><td>{{ fmt(sum(filteredTaxes, 'amount')) }}</td><td>{{ fmt(sum(filteredTaxes, 'interest')) }}</td><td>{{ fmt(sum(filteredTaxes, 'penalty')) }}</td><td>{{ fmt(filteredTaxes.reduce((a, t) => a + taxTotal(t), 0)) }}</td><td colspan="2">—</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>

    <datalist id="bank-names"><option v-for="b in options.banks" :key="b" :value="b" /></datalist>

    <!-- ═══ STATEMENT MODAL ═══ -->
    <AppModal v-model="showStatement" :title="form.id ? 'Edit Bank Statement' : 'Add Bank Statement'" subtitle="Monthly summary of one bank account" :icon="FileText" max-width="560px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Bank Name *</label><input v-model="form.bank_name" list="bank-names" class="form-input w-full" placeholder="e.g. SBI Current A/c" /></div>
          <div><label class="field-label">Account No.</label><input v-model="form.account_no" class="form-input w-full" placeholder="Last 4 digits is fine" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Statement Month *</label><input type="month" v-model="form.statement_month" class="form-input w-full" /></div>
          <div><label class="field-label">Opening Balance (₹)</label><input type="number" step="0.01" v-model.number="form.opening_balance" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Total Credits (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.total_credits" class="form-input w-full" /></div>
          <div><label class="field-label">Total Debits (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.total_debits" class="form-input w-full" /></div>
        </div>
        <div>
          <label class="field-label">Closing Balance (₹)</label>
          <input type="number" step="0.01" v-model.number="form.closing_balance" class="form-input w-full" />
          <p v-if="balanceMismatch" class="text-[11.5px] text-[#f59e0b] mt-1">
            Opening + credits − debits = ₹{{ fmt(expectedClosing) }}.
            <button class="underline" @click="form.closing_balance = expectedClosing">Use this</button>
          </p>
        </div>
        <div><label class="field-label">Statement Link (PDF / Drive)</label><input type="url" v-model="form.statement_url" class="form-input w-full" placeholder="https://…" /></div>
        <label class="flex items-center gap-2 text-[13px] text-[var(--text-2)] cursor-pointer">
          <input type="checkbox" v-model="form.shared_with_ca" /> Shared with CA
        </label>
        <div><label class="field-label">Notes</label><textarea v-model="form.notes" class="form-input w-full" rows="2" /></div>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ CHARGE MODAL ═══ -->
    <AppModal v-model="showCharge" :title="form.id ? 'Edit Bank Charge' : 'Add Bank Charge'" subtitle="Fees & charges debited by the bank" :icon="Landmark" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Date *</label><input type="date" v-model="form.date" class="form-input w-full" /></div>
          <div>
            <label class="field-label">Charge Type</label>
            <select v-model="form.charge_type" class="form-select w-full"><option v-for="c in options.charge_types" :key="c">{{ c }}</option></select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Bank Name *</label><input v-model="form.bank_name" list="bank-names" class="form-input w-full" /></div>
          <div><label class="field-label">Account No.</label><input v-model="form.account_no" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">Charge Amount (₹) *</label><input type="number" step="0.01" min="0" v-model.number="form.amount" class="form-input w-full" placeholder="0.00" /></div>
          <div>
            <label class="field-label">GST on Charge (₹)</label>
            <input type="number" step="0.01" min="0" v-model.number="form.gst_amount" class="form-input w-full" />
            <button v-if="form.amount" class="text-[11px] text-[#f59e0b] underline mt-1" @click="form.gst_amount = Math.round(form.amount * 18) / 100">Apply 18%</button>
          </div>
        </div>
        <div><label class="field-label">Reference / Txn No.</label><input v-model="form.reference_no" class="form-input w-full" /></div>
        <div><label class="field-label">Narration</label><textarea v-model="form.narration" class="form-input w-full" rows="2" placeholder="As shown on the bank statement" /></div>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ TAX MODAL ═══ -->
    <AppModal v-model="showTax" :title="form.id ? 'Edit Tax Payment' : 'Add Tax Payment'" subtitle="GST, VAT, TDS, advance tax & other dues" :icon="ReceiptIndianRupee" max-width="520px">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="field-label">Tax Type *</label>
            <select v-model="form.tax_type" class="form-select w-full"><option v-for="t in options.tax_types" :key="t">{{ t }}</option></select>
          </div>
          <div><label class="field-label">Payment Date *</label><input type="date" v-model="form.date" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="field-label">For Period</label><input v-model="form.period" class="form-input w-full" placeholder="e.g. Sep 2026 / Q2 FY 26-27" /></div>
          <div><label class="field-label">Challan / CIN / Ref</label><input v-model="form.challan_no" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div><label class="field-label">Tax (₹) *</label><input type="number" step="0.01" min="0" v-model.number="form.amount" class="form-input w-full" placeholder="0.00" /></div>
          <div><label class="field-label">Interest (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.interest" class="form-input w-full" /></div>
          <div><label class="field-label">Penalty / Fee (₹)</label><input type="number" step="0.01" min="0" v-model.number="form.penalty" class="form-input w-full" /></div>
        </div>
        <div>
          <label class="field-label">Payment Mode</label>
          <select v-model="form.payment_mode" class="form-select w-full"><option v-for="m in options.payment_modes" :key="m">{{ m }}</option></select>
        </div>
        <div><label class="field-label">Narration</label><textarea v-model="form.narration" class="form-input w-full" rows="2" /></div>
        <div class="text-[12.5px] text-[var(--text-2)] text-right">Total paid: <span class="font-semibold text-[var(--text)]">₹{{ fmt(taxTotal(form)) }}</span></div>
      </div>
      <template #footer><ModalFooter /></template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" :title="`Delete ${entity.noun}`" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[var(--text)] mb-2">Delete this {{ entity.noun.toLowerCase() }}?</p>
        <p class="text-[12px] text-[var(--text-3)]">{{ deleteLabel }}</p>
        <p class="text-[12px] text-negative mt-3">This action cannot be undone.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete = false">Cancel</button>
          <button class="btn btn-danger px-8" @click="confirmDelete" :disabled="saving">
            <RotateCw v-if="saving" :size="14" class="animate-spin mr-1" /><Trash2 v-else :size="14" class="mr-1" /> Delete
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { fmt, fmtINR, fmtCompact, formatDate } from '@/utils/format'
import { exportCSV, printTable } from '@/utils/export'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { accountsApi } from '@/services/api'
import {
  Download, Printer, Plus, FileText, Landmark, ReceiptIndianRupee, AlertTriangle, BarChart3,
  RotateCw, Save, Pencil, Trash2, Send, Undo2, ExternalLink
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()

const tab = ref('overview')

// ── Period: Indian financial year (Apr–Mar), optionally one month ──
const today     = new Date()
const currentFy = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
const fy        = ref(currentFy)
const month     = ref('')  // '' = full year, else YYYY-MM
const fyOptions = Array.from({ length: 6 }, (_, i) => currentFy - i)

const fyMonths = computed(() => Array.from({ length: 12 }, (_, i) => {
  const d = new Date(fy.value, 3 + i, 1)
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
  }
}))

const range = computed(() => {
  if (month.value) {
    const [y, m] = month.value.split('-').map(Number)
    const last   = new Date(y, m, 0).getDate()
    return { from: `${month.value}-01`, to: `${month.value}-${String(last).padStart(2, '0')}` }
  }
  return { from: `${fy.value}-04-01`, to: `${fy.value + 1}-03-31` }
})

const periodLabel = computed(() => month.value
  ? fyMonths.value.find(m => m.value === month.value)?.label
  : `FY ${fy.value}-${String(fy.value + 1).slice(2)} (Apr ${fy.value} – Mar ${fy.value + 1})`)

watch(fy, () => { month.value = '' })

// ── Helpers ───────────────────────────────────────────────────────
const sum      = (rows, key) => rows.reduce((a, r) => a + Number(r[key] || 0), 0)
const taxTotal = (t) => Number(t.amount || 0) + Number(t.interest || 0) + Number(t.penalty || 0)

function fmtMonth(ym) {
  if (!ym) return '—'
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' })
}

// ── Data ──────────────────────────────────────────────────────────
const emptySummary = () => ({
  statements: { count: 0, shared: 0, pending: 0, total_credits: 0, total_debits: 0 },
  charges:    { count: 0, amount: 0, gst: 0, total: 0, by_type: [] },
  taxes:      { count: 0, amount: 0, interest: 0, penalty: 0, total: 0, by_type: [] },
})

const statements = ref([])
const charges    = ref([])
const taxes      = ref([])
const summary    = ref(emptySummary())
const options    = ref({ charge_types: [], tax_types: [], payment_modes: [], banks: [] })
const loading    = ref(false)
const loadError  = ref('')

async function loadAll() {
  loading.value   = true
  loadError.value = ''
  try {
    const station = selectedStation.selectedStationId ? { station_id: selectedStation.selectedStationId } : {}
    const params  = { ...range.value, ...station }
    const [sumRes, stRes, chRes, txRes, optRes] = await Promise.all([
      accountsApi.getSummary(params),
      accountsApi.getStatements(params),
      accountsApi.getCharges(params),
      accountsApi.getTaxes(params),
      accountsApi.getOptions(station),
    ])
    summary.value    = sumRes.data?.summary || emptySummary()
    statements.value = stRes.data?.statements || []
    charges.value    = chRes.data?.charges || []
    taxes.value      = txRes.data?.taxes || []
    options.value    = optRes.data || options.value
  } catch (e) {
    loadError.value = e?.message || 'Failed to load accounts data.'
  } finally {
    loading.value = false
  }
}

watch(range, loadAll)
watch(() => selectedStation.selectedStationId, loadAll)
onMounted(loadAll)

// ── Filters (client-side within loaded period) ────────────────────
const bankFilter       = ref('')
const chargeTypeFilter = ref('')
const taxTypeFilter    = ref('')

const filteredStatements = computed(() => statements.value.filter(s => !bankFilter.value || s.bank_name === bankFilter.value))
const filteredCharges    = computed(() => charges.value.filter(c =>
  (!bankFilter.value || c.bank_name === bankFilter.value) && (!chargeTypeFilter.value || c.charge_type === chargeTypeFilter.value)))
const filteredTaxes      = computed(() => taxes.value.filter(t => !taxTypeFilter.value || t.tax_type === taxTypeFilter.value))
const pendingStatements  = computed(() => statements.value.filter(s => !s.shared_with_ca))

// ── Entity config per tab ─────────────────────────────────────────
const ENTITIES = {
  statements: {
    noun: 'Bank Statement', add: 'Add Statement', create: accountsApi.createStatement, update: accountsApi.updateStatement, remove: accountsApi.deleteStatement,
    blank: () => ({ bank_name: '', account_no: '', statement_month: today.toISOString().slice(0, 7), opening_balance: 0, total_credits: 0, total_debits: 0, closing_balance: 0, statement_url: '', shared_with_ca: false, notes: '' }),
    required: (f) => f.bank_name && f.statement_month,
    label: (r) => `${r.bank_name} — ${fmtMonth(r.statement_month)}`,
  },
  charges: {
    noun: 'Bank Charge', add: 'Add Charge', create: accountsApi.createCharge, update: accountsApi.updateCharge, remove: accountsApi.deleteCharge,
    blank: () => ({ date: today.toISOString().slice(0, 10), bank_name: options.value.banks[0] || '', account_no: '', charge_type: 'Other', amount: null, gst_amount: 0, reference_no: '', narration: '' }),
    required: (f) => f.date && f.bank_name && f.amount !== null && f.amount !== '',
    label: (r) => `${r.charge_type} · ₹${fmt(r.amount)} on ${formatDate(r.date)}`,
  },
  taxes: {
    noun: 'Tax Payment', add: 'Add Tax Payment', create: accountsApi.createTax, update: accountsApi.updateTax, remove: accountsApi.deleteTax,
    blank: () => ({ date: today.toISOString().slice(0, 10), tax_type: 'GST', period: '', challan_no: '', amount: null, interest: 0, penalty: 0, payment_mode: 'Net Banking', narration: '' }),
    required: (f) => f.date && f.tax_type && f.amount !== null && f.amount !== '',
    label: (r) => `${r.tax_type} · ₹${fmt(taxTotal(r))} on ${formatDate(r.date)}`,
  },
}

// Overview has no own entity; delete/edit always act on the active tab
const entity   = computed(() => ENTITIES[tab.value] || ENTITIES.statements)
const addLabel = computed(() => entity.value.add)

// ── Add / Edit ────────────────────────────────────────────────────
const showStatement = ref(false)
const showCharge    = ref(false)
const showTax       = ref(false)
const saving        = ref(false)
const form          = ref({})

const modalFor = { statements: showStatement, charges: showCharge, taxes: showTax }

function openAdd() {
  form.value = entity.value.blank()
  modalFor[tab.value].value = true
}

function openEdit(row) {
  form.value = { ...row, statement_url: row.statement_url || '' }
  modalFor[tab.value].value = true
}

const expectedClosing = computed(() =>
  Math.round((Number(form.value.opening_balance || 0) + Number(form.value.total_credits || 0) - Number(form.value.total_debits || 0)) * 100) / 100)
const balanceMismatch = computed(() =>
  (form.value.total_credits || form.value.total_debits) && Math.abs(expectedClosing.value - Number(form.value.closing_balance || 0)) > 0.009)

// Strip server-only fields before sending
const STRIP = ['id', 'user_id', 'station_id', 'station', 'created_at', 'updated_at', 'shared_on',
  'created_by_id', 'created_by_name', 'created_host_name', 'created_ip',
  'updated_by_id', 'updated_by_name', 'updated_host_name', 'updated_ip']

async function save() {
  const e = entity.value
  if (!e.required(form.value)) {
    ui.error('Please fill in the required (*) fields')
    return
  }
  const payload = Object.fromEntries(Object.entries(form.value)
    .filter(([k]) => !STRIP.includes(k))
    .map(([k, v]) => [k, v === '' ? null : v]))

  saving.value = true
  try {
    if (form.value.id) await e.update(form.value.id, payload)
    else               await e.create(payload)
    modalFor[tab.value].value = false
    ui.success(`${e.noun} ${form.value.id ? 'updated' : 'added'}!`)
    await loadAll()
  } catch (err) {
    ui.error(err?.message || `Failed to save ${e.noun.toLowerCase()}.`)
  } finally {
    saving.value = false
  }
}

const ModalFooter = () => h('div', { class: 'flex justify-end gap-3' }, [
  h('button', { class: 'btn btn-ghost px-6', onClick: () => { modalFor[tab.value].value = false } }, 'Cancel'),
  h('button', { class: 'btn btn-primary px-8', disabled: saving.value, onClick: save }, [
    h(saving.value ? RotateCw : Save, { size: 14, class: saving.value ? 'animate-spin mr-1' : 'mr-1' }),
    form.value.id ? ' Update' : ' Save',
  ]),
])

async function toggleShared(s) {
  try {
    await accountsApi.updateStatement(s.id, { shared_with_ca: !s.shared_with_ca })
    ui.success(s.shared_with_ca ? 'Marked as pending' : 'Marked as shared with CA')
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to update statement.')
  }
}

// ── Delete ────────────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)
const deleteLabel  = computed(() => deleteTarget.value ? entity.value.label(deleteTarget.value) : '')

function openDelete(row) {
  deleteTarget.value = row
  showDelete.value   = true
}

async function confirmDelete() {
  saving.value = true
  try {
    await entity.value.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success(`${entity.value.noun} deleted!`)
    await loadAll()
  } catch (e) {
    ui.error(e?.message || 'Failed to delete.')
  } finally {
    saving.value = false
  }
}

// ── Export / Print ────────────────────────────────────────────────
const statementRows = () => statements.value.map(s => [fmtMonth(s.statement_month), s.bank_name, s.account_no || '', s.opening_balance, s.total_credits, s.total_debits, s.closing_balance, s.shared_with_ca ? `Shared ${s.shared_on || ''}` : 'Pending', s.statement_url || '', s.notes || ''])
const chargeRows    = () => charges.value.map(c => [c.date, c.bank_name, c.account_no || '', c.charge_type, c.amount, c.gst_amount, c.amount + c.gst_amount, c.reference_no || '', c.narration || ''])
const taxRows       = () => taxes.value.map(t => [t.date, t.tax_type, t.period || '', t.challan_no || '', t.amount, t.interest, t.penalty, taxTotal(t), t.payment_mode || '', t.narration || ''])

const STATEMENT_HEADERS = ['Month', 'Bank', 'Account', 'Opening', 'Credits', 'Debits', 'Closing', 'CA Status', 'Link', 'Notes']
const CHARGE_HEADERS    = ['Date', 'Bank', 'Account', 'Charge Type', 'Amount', 'GST', 'Total', 'Reference', 'Narration']
const TAX_HEADERS       = ['Paid On', 'Tax Type', 'Period', 'Challan / Ref', 'Tax', 'Interest', 'Penalty', 'Total', 'Mode', 'Narration']

// One CSV with all three sections — what the CA asks for at year end
function exportCaPack() {
  const blank = []
  const rows = [
    blank,
    ['BANK STATEMENTS'], STATEMENT_HEADERS, ...statementRows(), blank,
    ['BANK CHARGES'], CHARGE_HEADERS, ...chargeRows(),
    ['', '', '', 'TOTAL', summary.value.charges.amount, summary.value.charges.gst, summary.value.charges.total], blank,
    ['TAX PAYMENTS'], TAX_HEADERS, ...taxRows(),
    ['', '', '', 'TOTAL', summary.value.taxes.amount, summary.value.taxes.interest, summary.value.taxes.penalty, summary.value.taxes.total],
  ]
  exportCSV(`CA_Pack_${month.value || `FY${fy.value}-${String(fy.value + 1).slice(2)}`}`, [`CA Pack — ${periodLabel.value}`], rows)
  ui.success('CA pack exported!')
}

function doPrint() {
  const title = `${entity.value.noun}s — ${periodLabel.value}`
  if (tab.value === 'charges')    printTable(title, CHARGE_HEADERS, chargeRows())
  else if (tab.value === 'taxes') printTable(title, TAX_HEADERS, taxRows())
  else                            printTable(`Bank Statements — ${periodLabel.value}`, STATEMENT_HEADERS.slice(0, 8), statementRows().map(r => r.slice(0, 8)))
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px }
</style>
