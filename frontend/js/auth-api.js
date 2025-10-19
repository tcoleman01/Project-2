// frontend/js/auth-api.js
// Uses backend auth via cookies (JWT in HttpOnly cookie). No localStorage accounts.

(function () {
  const msgEl = document.getElementById("msg");
  const showMsg = (t) => { if (msgEl) msgEl.textContent = t || ""; };

  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // include cookies
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "request failed");
    return json;
  }

  async function getJSON(url) {
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "request failed");
    return json;
  }

  // ---- Signup flow ----
  function wireSignup(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMsg("Creating account...");
      const data = Object.fromEntries(new FormData(form).entries());
      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");
      const displayName = String(data.username || data.displayName || "").trim();

      try {
        // 1) register
        await postJSON("/register", { email, password, displayName });
        // 2) login to set cookie
        await postJSON("/login", { email, password });
        // 3) go to profile
        location.href = "user-profile.html";
      } catch (err) {
        showMsg(err.message);
      }
    });
  }

  // ---- Login flow ----
  function wireLogin(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMsg("Logging in...");
      const data = Object.fromEntries(new FormData(form).entries());
      const email = String(data.email || "").trim().toLowerCase();
      const password = String(data.password || "");

      try {
        await postJSON("/login", { email, password });
        location.href = "user-profile.html";
      } catch (err) {
        showMsg(err.message);
      }
    });
  }

  // ---- Logout helper (call from a button onclick="AuthAPI.logout()") ----
  async function logout() {
    try {
      await postJSON("/logout", {});
    } finally {
      location.href = "index.html";
    }
  }

  // ---- Session helpers expected elsewhere ----
  async function getUserIdHeader() {
    // returns the logged-in user's email (used as userId) or "demo" if not logged in
    try {
      const me = await getJSON("/me");
      if (me && me.email) return String(me.email).toLowerCase();
    } catch {}
    return "demo";
  }

  // Keep signature compatible (cookies hold session; return a small object)
  async function getSession() {
    try {
      const me = await getJSON("/me");
      if (me && me.email) return { email: me.email, displayName: me.displayName };
    } catch {}
    return null;
  }

  // Auto-wire if the forms exist
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  if (signupForm) wireSignup(signupForm);
  if (loginForm) wireLogin(loginForm);

  // Expose minimal API globally to match your existing code expectations
  window.AuthAPI = { logout, getUserIdHeader, getSession };
})();
