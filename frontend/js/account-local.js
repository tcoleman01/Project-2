import { getSession } from "./auth-local.js";

const msg = document.getElementById("msg");
const show = (t) => { msg.textContent = t || ""; };

const USERS_KEY = "vg_users";
const SESSION_KEY = "vg_session";
const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const saveUsers = (arr) => localStorage.setItem(USERS_KEY, JSON.stringify(arr));

function requireAuth() {
  const session = getSession();
  if (!session) { location.href = "/login.html"; return null; }
  const users = getUsers();
  const me = users.find(u => u.email === session.email);
  if (!me) { localStorage.removeItem(SESSION_KEY); location.href = "/login.html"; return null; }
  return me;
}

const me = requireAuth();
if (me) {
  document.querySelector('input[name="email"]').value = me.email;
  document.querySelector('input[name="username"]').value = me.username;
}

// Save profile
document.getElementById("profileForm").addEventListener("submit", (e) => {
  e.preventDefault(); show("");
  const data = Object.fromEntries(new FormData(e.target));
  if (data.username.trim().length < 3) return show("Username must be at least 3 chars.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return show("Enter a valid email.");

  const users = getUsers();
  // unique constraints
  if (users.some(u => u.email === data.email && u.email !== me.email)) return show("Email already in use.");
  if (users.some(u => u.username === data.username && u.email !== me.email)) return show("Username already in use.");

  const idx = users.findIndex(u => u.email === me.email);
  users[idx] = { ...users[idx], email: data.email.trim().toLowerCase(), username: data.username.trim(), updatedAt: Date.now() };
  saveUsers(users);
  localStorage.setItem("vg_session", JSON.stringify({ email: users[idx].email }));
  show("Profile updated.");
});

// Change password
document.getElementById("passwordForm").addEventListener("submit", (e) => {
  e.preventDefault(); show("");
  const { password } = Object.fromEntries(new FormData(e.target));
  if (password.length < 8) return show("Password must be at least 8 chars.");
  const users = getUsers();
  const idx = users.findIndex(u => u.email === me.email);
  users[idx] = { ...users[idx], password, updatedAt: Date.now() };
  saveUsers(users);
  e.target.reset();
  show("Password updated.");
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  location.href = "/login.html";
});

// Delete account
document.getElementById("deleteBtn").addEventListener("click", () => {
  if (!confirm("Delete your account? This cannot be undone.")) return;
  const users = getUsers().filter(u => u.email !== me.email);
  saveUsers(users);
  localStorage.removeItem(SESSION_KEY);
  location.href = "/signup.html";
});
