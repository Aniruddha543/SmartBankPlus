function getClient() { return window.supabaseClient; }

function setSession(session) {
  if (session) localStorage.setItem("sb-session", JSON.stringify(session));
  else localStorage.removeItem("sb-session");
}

async function getUserOrRedirect() {
  const { data: { user } } = await getClient().auth.getUser();
  if (!user) { window.location.href = "index.html"; return null; }
  return user;
}

function setupLogin() {
  const sb = getClient();
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.onclick = async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    setSession(data.session);
    window.location.href = "dashboard.html";
  };
}

/* Registration: creates auth user, then calls init_new_user (idempotent)
   We pass preferred account number/type via user_metadata; RPC will honor if free. */
function setupRegister() {
  const sb = getClient();
  const btn = document.getElementById("registerBtn");
  if (!btn) return;

  btn.onclick = async () => {
    const first = document.getElementById("first_name").value.trim();
    const last  = document.getElementById("last_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const prefAcc = document.getElementById("account_number").value.trim();
    const prefType = document.getElementById("account_type").value;

    if (!first || !last)  return alert("Enter first and last name.");
    if (!email)           return alert("Enter email.");
    if (!password)        return alert("Enter password.");
    if (!prefAcc)         return alert("Enter preferred account number.");

    const { data: signData, error: signErr } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: `${first} ${last}`, pref_acc_no: prefAcc, pref_acc_type: prefType } }
    });
    if (signErr) return alert(signErr.message);

    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) {
      alert("Check your email to verify, then login.");
      window.location.href = "index.html";
      return;
    }

    await sb.rpc("init_new_user", {
      p_full_name: `${first} ${last}`,
      p_pref_account_number: prefAcc,
      p_pref_account_type: prefType
    });

    setSession(sessionData.session);
    window.location.href = "dashboard.html";
  };
}

async function logout() {
  try { await getClient().auth.signOut(); } catch {}
  localStorage.removeItem("sb-session");
  window.location.replace("index.html");
}

/* expose globals */
window.setupLogin = setupLogin;
window.setupRegister = setupRegister;
window.getUserOrRedirect = getUserOrRedirect;
window.logout = logout;
