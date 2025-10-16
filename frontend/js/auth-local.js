// Simple localStorage auth for demo only (no real passwords).
const USERS_KEY = "vg_users";
const SESSION_KEY = "vg_session";

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));
const setSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, userId: user.userId || null }));
export const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

const msgEl = document.getElementById("msg");
const showMsg = (t) => { if (msgEl) msgEl.textContent = t || ""; };

const REDIRECT_AFTER_AUTH = "/index.html";

export function getUserIdHeader() {
  const s = getSession();
  return s && (s.userId || s.email) ? (s.userId || s.email.toLowerCase()) : "demo";
}

function bindSignup(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault(); showMsg("");
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email || "").trim().toLowerCase();
    const username = String(data.username || "").trim();
    const password = String(data.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg("Enter a valid email.");
    if (username.length < 3) return showMsg("Username must be at least 3 chars.");
    if (password.length < 8) return showMsg("Password must be at least 8 chars.");

    const users = getUsers();
    if (users.some(u => u.email === email)) return showMsg("Email already in use.");
    if (users.some(u => u.username === username)) return showMsg("Username already in use.");

    users.push({ email, username, password, createdAt: Date.now(), updatedAt: Date.now() });
    saveUsers(users);
    setSession({ email });
    location.href = REDIRECT_AFTER_AUTH;
  });
}

function bindLogin(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault(); showMsg("");
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");
    if (!email || !password) return showMsg("Email and password are required.");

    const user = getUsers().find(u => u.email === email && u.password === password);
    if (!user) return showMsg("Invalid credentials.");

    setSession({ email });
    location.href = REDIRECT_AFTER_AUTH;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm  = document.getElementById("loginForm");
  if (signupForm) bindSignup(signupForm);
  if (loginForm)  bindLogin(loginForm);
});
