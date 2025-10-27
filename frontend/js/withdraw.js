async function initWithdraw() {
  const user = await getUserOrRedirect();
  if (!user) return;
  const sb = window.supabaseClient;

  const { data: accounts, error } = await sb.from('v_accounts')
    .select('*').eq('user_id', user.id).order('created_at',{ascending:true});
  if (error) return alert(error.message);
  if (!accounts?.length) return alert('No account found.');

  const sel = document.getElementById('acc');
  sel.innerHTML = '';
  accounts.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = `${a.account_type} — ${a.account_number} (₹ ${(a.balance_cents/100).toFixed(2)})`;
    sel.appendChild(opt);
  });

  document.getElementById('go').onclick = async () => {
    const p_account_id = sel.value;
    const rupees = parseFloat(document.getElementById('amount').value || '0');
    const p_note = document.getElementById('note').value.trim();
    if (!(rupees > 0)) return alert('Enter a valid amount');

    const p_amount_cents = Math.round(rupees * 100);
    const { error: rpcErr } = await sb.rpc('withdraw', { p_account_id, p_amount_cents, p_note });
    if (rpcErr) return alert(rpcErr.message);
    alert('Withdrawal successful!');
    window.location.href = 'dashboard.html';
  };
}
window.initWithdraw = initWithdraw;
