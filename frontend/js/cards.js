let USER = null;
let ACCOUNTS = [];
let CARDS = [];

function fmtMoney(cents){ return (cents/100).toFixed(2); }

async function initCards() {
  USER = await getUserOrRedirect();
  if (!USER) return;
  const sb = window.supabaseClient;

  // accounts for dropdowns
  const accRes = await sb.from('v_accounts').select('*')
    .eq('user_id', USER.id)
    .order('created_at', { ascending: true });
  if (accRes.error) return alert(accRes.error.message);
  ACCOUNTS = accRes.data || [];
  if (!ACCOUNTS.length) return alert('You have no accounts.');

  const accSel = document.getElementById('accSel');
  accSel.innerHTML = '';
  ACCOUNTS.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.account_type} — ${a.account_number} (₹ ${fmtMoney(a.balance_cents)})`;
    accSel.appendChild(opt);
  });

  await loadCards();

  // Issue card
  document.getElementById('issueBtn').onclick = async () => {
    const p_account_id = accSel.value;
    const p_card_type = document.getElementById('cardType').value;
    const p_brand     = document.getElementById('brand').value;
    const p_nickname  = document.getElementById('nickname').value.trim();

    const { error } = await sb.rpc('issue_card', {
      p_account_id,
      p_card_type,
      p_brand,
      p_nickname
    });
    if (error) return alert(error.message);
    alert('Card issued!');
    document.getElementById('nickname').value = '';
    await loadCards();
  };

  // Demo charge
  document.getElementById('chargeBtn').onclick = async () => {
    const card_id = document.getElementById('chargeCard').value;
    const merchant = document.getElementById('merchant').value.trim();
    const rupees = parseFloat(document.getElementById('chargeAmount').value || '0');
    if (!card_id) return alert('Choose a card');
    if (!merchant) return alert('Enter merchant');
    if (!(rupees > 0)) return alert('Enter valid amount');

    const p_amount_cents = Math.round(rupees * 100);
    const { error } = await sb.rpc('card_charge', { p_card_id: card_id, p_amount_cents, p_merchant: merchant });
    if (error) return alert(error.message);
    alert('Purchase recorded!');
    await loadCards(); // refresh balances in header lists if needed
  };
}

async function loadCards() {
  const sb = window.supabaseClient;
  const res = await sb.from('cards').select('*').eq('user_id', USER.id).order('created_at',{ascending:true});
  if (res.error) return alert(res.error.message);
  CARDS = res.data || [];

  const wrap = document.getElementById('cardsWrap');
  wrap.innerHTML = '';

  if (!CARDS.length) {
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.textContent = 'No cards yet.';
    wrap.appendChild(empty);
  }

  const chargeCardSel = document.getElementById('chargeCard');
  chargeCardSel.innerHTML = '';

  CARDS.forEach(c => {
    const acc = ACCOUNTS.find(a => a.id === c.account_id);
    const accLabel = acc ? `${acc.account_type} — ${acc.account_number}` : c.account_id;

    // Card view
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
        <div>
          <h3 style="margin:0">${c.nickname || `${c.brand} ${c.card_type}`} <small style="opacity:.8">(${c.status})</small></h3>
          <div>${c.masked_pan}  •  Exp: ${String(c.exp_month).padStart(2,'0')}/${c.exp_year}</div>
          <div>Linked account: <strong>${accLabel}</strong></div>
          <div>Daily limit: ₹ ${fmtMoney(c.spend_daily_limit_cents)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select data-action="status" data-id="${c.id}">
            <option value="ACTIVE" ${c.status==='ACTIVE'?'selected':''}>ACTIVE</option>
            <option value="FROZEN" ${c.status==='FROZEN'?'selected':''}>FROZEN</option>
            <option value="CLOSED" ${c.status==='CLOSED'?'selected':''}>CLOSED</option>
          </select>
          <input type="number" min="1" step="1" style="width:140px" placeholder="New limit (₹)" data-action="limit" data-id="${c.id}" />
          <button data-action="apply-limit" data-id="${c.id}">Set Limit</button>
        </div>
      </div>
    `;
    wrap.appendChild(div);

    // also add to charge selector
    if (c.status === 'ACTIVE') {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.brand} ${c.card_type} ${c.masked_pan}`;
      chargeCardSel.appendChild(opt);
    }
  });

  // Bind status change
  wrap.querySelectorAll('select[data-action="status"]').forEach(sel => {
    sel.onchange = async () => {
      const id = sel.dataset.id;
      const status = sel.value;
      const { error } = await window.supabaseClient.rpc('set_card_status', { p_card_id: id, p_status: status });
      if (error) alert(error.message); else alert('Status updated');
      await loadCards();
    };
  });

  // Bind limit change
  wrap.querySelectorAll('button[data-action="apply-limit"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const input = wrap.querySelector(`input[data-action="limit"][data-id="${id}"]`);
      const rupees = parseFloat(input.value || '0');
      if (!(rupees > 0)) return alert('Enter a valid limit in ₹');
      const p_limit_cents = Math.round(rupees * 100);
      const { error } = await window.supabaseClient.rpc('set_card_daily_limit', { p_card_id: id, p_limit_cents });
      if (error) alert(error.message); else alert('Limit updated');
      input.value = '';
      await loadCards();
    };
  });
}

window.initCards = initCards;
