// Simple localStorage "auth" for demo only (no backend edits).
const USERS_KEY = "vg_users";
const SESSION_KEY = "vg_session";

const msgEl = document.getElementById("msg");
const showMsg = (t) => { if (msgEl) msgEl.textContent = t || ""; };

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));
const setSession = (user) => localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
export const getSession = () => JSON.parse(localStorage.getItem(SESSION_KEY) || "null");

function onSignup(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault(); showMsg("");
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email).trim().toLowerCase();
    const username = String(data.username).trim();
    const password = String(data.password);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg("Enter a valid email.");
    if (username.length < 3) return showMsg("Username must be at least 3 chars.");
    if (password.length < 8) return showMsg("Password must be at least 8 chars.");

    const users = getUsers();
    if (users.some(u => u.email === email)) return showMsg("Email already in use.");
    if (users.some(u => u.username === username)) return showMsg("Username already in use.");

    users.push({ email, username, password, createdAt: Date.now(), updatedAt: Date.now() });
    saveUsers(users);
    setSession({ email });
    location.href = "./account.html";                // ← was /account.html
  });
}

function onLogin(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault(); showMsg("");
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email).trim().toLowerCase();
    const password = String(data.password);
    const user = getUsers().find(u => u.email === email && u.password === password);
    if (!user) return showMsg("Invalid credentials.");
    setSession(user);
    location.href = "./account.html";                // ← was /account.html
  });
}

// Wire up whichever page we're on
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
if (signupForm) onSignup(signupForm);
if (loginForm) onLogin(loginForm);
