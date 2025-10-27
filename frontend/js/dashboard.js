async function initDashboard() {
  const user = await getUserOrRedirect();
  if (!user) return;
  const sb = window.supabaseClient;

  let { data: accounts, error } = await sb.from('v_accounts')
    .select('*')
    .eq('user_id', user.id)                        // user-scoped
    .order('created_at', { ascending: true });
  if (error) return alert(error.message);

  if (!accounts || accounts.length === 0) {
    await sb.rpc('init_new_user', { p_full_name: user.user_metadata?.full_name || 'New User' });
    const refetch = await sb.from('v_accounts').select('*').eq('user_id', user.id).order('created_at',{ascending:true});
    if (refetch.error) return alert(refetch.error.message);
    accounts = refetch.data;
  }
  if (!accounts.length) return alert('No account found.');

  const primary = accounts[0];

  const { data: cust } = await sb.from('customers').select('full_name,email').limit(1).single();
  const fullName = cust?.full_name || user.user_metadata?.full_name || '(no name)';
  const email = cust?.email || user.email;

  const header = document.getElementById('acctHeader');
  header.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
      <div>
        <h2 style="margin:0">${fullName}</h2>
        <div>${email}</div>
        <div>Account No: <strong>${primary.account_number}</strong> &nbsp; | &nbsp;
             Type: <strong>${primary.account_type}</strong></div>
      </div>
      <div class="balance-pill">₹ ${(primary.balance_cents/100).toFixed(2)}</div>
    </div>
  `;

  const wrap = document.getElementById('accounts');
  wrap.innerHTML = '';
  accounts.forEach(a => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>${a.account_type} — ${a.account_number}</h3>
      <p>Balance: ₹ ${(a.balance_cents/100).toFixed(2)}</p>
      <small>Opened: ${new Date(a.created_at).toLocaleString()}</small>
    `;
    wrap.appendChild(div);
  });
}
window.initDashboard = initDashboard;
