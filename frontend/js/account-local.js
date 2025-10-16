import { getUserIdHeader } from "./auth-local.js";
const currentUser = getUserIdHeader();
const MOCK_USER_ID = "200000000000000000000001";

async function getUserId() {
  try {
    const me = await fetch("/api/users/me", { headers: { "x-user-id": currentUser } }).then((r) =>
      r.ok ? r.json() : null
    );
    return me?.user?._id || MOCK_USER_ID;
  } catch {
    return MOCK_USER_ID;
  }
}

function renderReviews(items) {
  const wrap = document.getElementById("myReviews");
  if (!wrap) return;
  wrap.innerHTML = items.length
    ? items
        .map(
          (r) => `
        <article class="card p-2 mb-2">
          <div class="d-flex justify-content-between">
            <strong>Rating: ${r.rating}/5</strong>
            <small>${new Date().toLocaleString()}</small>
          </div>
          <p class="m-0">${(r.text || "").replace(/</g, "&lt;")}</p>
        </article>
      `
        )
        .join("")
    : `<p class="text-secondary">You haven't posted any reviews yet.</p>`;
}

async function loadMyReviews(userId) {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/reviews`);
    if (!res.ok) throw new Error();
    const { items } = await res.json();
    renderReviews(items);
  } catch {
    const all = await fetch("/data/mock_reviews.json").then((r) => r.json());
    renderReviews(all.filter((r) => (r.userId?.$oid || r.userId) === userId));
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const userId = await getUserId();
  await loadMyReviews(userId);
});
