let ACCOUNTS = [];
let CURRENT_ACC = null;
let CURRENT_RANGE = 'all';
let CACHED_TX = [];
let HEADER_NAME = '';
let HEADER_EMAIL = '';


function rupees(cents) { return (cents / 100).toFixed(2); }
function startOfTodayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString(); }
function dateFromRange(r){
  const n=new Date();
  if (r==='today') return startOfTodayISO();
  if (r==='10d'){const d=new Date(n); d.setDate(n.getDate()-10); return d.toISOString();}
  if (r==='1m'){const d=new Date(n); d.setMonth(n.getMonth()-1); return d.toISOString();}
  if (r==='1y'){const d=new Date(n); d.setFullYear(n.getFullYear()-1); return d.toISOString();}
  return null;
}
function periodLabel(){ return {today:'Today','10d':'Last 10 Days','1m':'Last 1 Month','1y':'Last 1 Year',all:'All Time'}[CURRENT_RANGE]; }

async function initTransactions() {
  const user = await getUserOrRedirect();
  if (!user) return;
  const sb = window.supabaseClient;

  const accRes = await sb.from('v_accounts').select('*')
    .eq('user_id', user.id)                   // user-scoped
    .order('created_at', { ascending: true });
  if (accRes.error) return alert(accRes.error.message);
  ACCOUNTS = accRes.data || [];
  if (!ACCOUNTS.length) return alert('No account found.');

  const sel = document.getElementById('accSel');
  sel.innerHTML = '';
  ACCOUNTS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.account_type} — ${a.account_number}`;
    sel.appendChild(opt);
  });
  CURRENT_ACC = ACCOUNTS[0];
  sel.value = CURRENT_ACC.id;

  const { data: cust } = await sb.from('customers').select('full_name,email').limit(1).single();
  const fullName = cust?.full_name || user.user_metadata?.full_name || '(no name)';
  const email = cust?.email || user.email;
  HEADER_NAME = fullName;
  HEADER_EMAIL = email;


  document.getElementById('acctHeader').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
      <div>
        <div><strong>${fullName}</strong> — ${email}</div>
        <div>Account No: <strong id="hdrAccNo">${CURRENT_ACC.account_number}</strong> |
            Type: <strong id="hdrAccType">${CURRENT_ACC.account_type}</strong></div>
      </div>
      <div class="balance-pill">₹ <span id="hdrBal">${rupees(CURRENT_ACC.balance_cents)}</span></div>
    </div>
  `;

  sel.onchange = () => {
    CURRENT_ACC = ACCOUNTS.find(a => a.id === sel.value);
    document.getElementById('hdrAccNo').textContent = CURRENT_ACC.account_number;
    document.getElementById('hdrAccType').textContent = CURRENT_ACC.account_type;
    document.getElementById('hdrBal').textContent = rupees(CURRENT_ACC.balance_cents);
    loadTx();
  };
  document.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => { CURRENT_RANGE = btn.dataset.range; loadTx(); };
  });
  document.getElementById('exportBtn').onclick = exportPDF;

  await loadTx();
}

async function loadTx() {
  const sb = window.supabaseClient;
  let q = sb.from('transactions').select('*')
    .eq('account_id', CURRENT_ACC.id)
    .order('created_at', { ascending: false })
    .limit(500);

  const sinceISO = dateFromRange(CURRENT_RANGE);
  if (sinceISO) q = q.gte('created_at', sinceISO);

  const { data, error } = await q;
  if (error) return alert(error.message);

  CACHED_TX = data || [];
  renderTable();
}

function renderTable() {
  const body = document.getElementById('txBody');
  body.innerHTML = '';
  if (!CACHED_TX.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;opacity:.7">No transactions</td>`;
    body.appendChild(tr); return;
  }
  for (const t of CACHED_TX) {
    const dt = new Date(t.created_at).toLocaleString();
    const kind = t.kind;
    const amt = rupees(t.amount_cents);

    let details = '';
    if (t.ext_account_number || t.ext_ifsc || t.ext_account_name) {
      details = [ t.ext_account_name && `BEN: ${t.ext_account_name}`,
                  t.ext_account_number && `AC: ${t.ext_account_number}`,
                  t.ext_ifsc && `IFSC: ${t.ext_ifsc}` ]
                .filter(Boolean).join(' | ');
    } else if (t.related_account) {
      const rel = ACCOUNTS.find(a => a.id === t.related_account);
      details = rel ? `Related: ${rel.account_number}` : `Related: ${t.related_account}`;
    }

    const tr = document.createElement('tr');
    tr.className = `row-${kind}`;
    tr.innerHTML = `
      <td>${dt}</td>
      <td>${kind}</td>
      <td style="text-align:right">${amt}</td>
      <td>${details}</td>
      <td>${t.note || ''}</td>
    `;
    body.appendChild(tr);
  }
}

async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const title = 'SmartBankPlus – Statement';
  const now = new Date().toLocaleString();

  // optional: stick to a core font for widest glyph support
  doc.setFont('helvetica', 'normal');

  // Header
  doc.setFontSize(14); doc.text(title, 40, 40);
  doc.setFontSize(10); doc.text(`Generated: ${now}`, 40, 58);

  // Account + customer details
  const lines = [
    `Name: ${HEADER_NAME}`,
    `Email: ${HEADER_EMAIL}`,
    `Account: ${CURRENT_ACC.account_number} (${CURRENT_ACC.account_type})`,
    `Balance: INR ${rupees(CURRENT_ACC.balance_cents)}`,
    `Period: ${periodLabel()}`
  ];
  lines.forEach((l, i) => doc.text(l, 40, 80 + i * 14));

  // Table data (use "INR" for compatibility)
  const head = [['Date/Time','Type','Amount (INR)','Details','Note']];
  const rows = CACHED_TX.map(t => {
    const dt = new Date(t.created_at).toLocaleString();
    let details = '';
    if (t.ext_account_number || t.ext_ifsc || t.ext_account_name) {
      details = [
        t.ext_account_name && `BEN: ${t.ext_account_name}`,
        t.ext_account_number && `AC: ${t.ext_account_number}`,
        t.ext_ifsc && `IFSC: ${t.ext_ifsc}`
      ].filter(Boolean).join(' | ');
    } else if (t.related_account) {
      const rel = ACCOUNTS.find(a => a.id === t.related_account);
      details = rel ? `Related: ${rel.account_number}` : `Related: ${t.related_account}`;
    }
    return [dt, t.kind, rupees(t.amount_cents), details, t.note || ''];
  });

  doc.autoTable({
    startY: 160, // a bit lower to make room for extra lines
    head,
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [22,27,34] }
  });

  doc.save(`Statement_${CURRENT_ACC.account_number}_${periodLabel().replace(/\s+/g,'')}.pdf`);
}


window.initTransactions = initTransactions;
