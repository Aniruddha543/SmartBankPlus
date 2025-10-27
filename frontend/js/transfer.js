let PRIMARY_ACC = null;

async function initTransfer() {
  const user = await getUserOrRedirect();
  if (!user) return;
  const sb = window.supabaseClient;

  const { data: accounts, error } = await sb.from('v_accounts')
    .select('*').eq('user_id', user.id).order('created_at',{ascending:true});
  if (error) return alert(error.message);
  if (!accounts?.length) return alert('No account found.');

  PRIMARY_ACC = accounts[0];
  document.getElementById('fromAccNumber').value = PRIMARY_ACC.account_number;

  document.getElementById('transferBtn').onclick = async () => {
    const rupees = parseFloat(document.getElementById('amount').value || '0');
    const p_amount_cents = Math.round(rupees * 100);
    const p_ifsc = document.getElementById('ifsc').value.trim().toUpperCase();
    const p_to_acc = document.getElementById('toAcc').value.trim();
    const p_to_name = document.getElementById('toName').value.trim();
    const p_note = document.getElementById('note').value.trim();

    if (document.getElementById('fromAccNumber').value.trim() !== PRIMARY_ACC.account_number)
      return alert('From Account number mismatch. Reload the page.');

    if (!(rupees > 0)) return alert('Enter a valid amount');
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(p_ifsc)) return alert('Invalid IFSC format');
    if (!/^\d{6,18}$/.test(p_to_acc)) return alert('Invalid beneficiary account number');
    if (!p_to_name) return alert('Enter beneficiary name');

    const { error: rpcErr } = await sb.rpc('transfer_external', {
      p_from: PRIMARY_ACC.id,
      p_amount_cents,
      p_ifsc,
      p_to_acc,
      p_to_name,
      p_note
    });
    if (rpcErr) return alert(rpcErr.message);

    alert('Transfer initiated!');
    window.location.href = 'dashboard.html';
  };
}
window.initTransfer = initTransfer;
