// frontend/js/frontend.js
import { getUserIdHeader, getSession } from "./auth-local.js";

function Library() {
  const me = {};
  const userIdHeader = getUserIdHeader();
  const headers = { "Content-Type": "application/json", "x-user-id": userIdHeader };
  const MOCK_USER_ID = "200000000000000000000001";

  let userGamesCache = [];
  let gamesIndex = new Map();

  const getOid = (x) => (x && typeof x === "object" && x.$oid ? x.$oid : x);
  const loadMock = (p) => fetch(p, { cache: "no-store" }).then(r => { if(!r.ok) throw new Error(p); return r.json(); });

  // ===== Render Stats =====
  me.renderStats = (stats = {}) => {
    const g = (id) => document.getElementById(id);
    if (g("statTotalGames")) g("statTotalGames").textContent = stats.totalGames ?? 0;
    if (g("statTotalHours")) g("statTotalHours").textContent = stats.totalHours ?? 0;
    if (g("statTotalSpent")) g("statTotalSpent").textContent = (stats.totalSpend ?? 0).toFixed(2);
  };

  // ===== Render Games =====
  me.renderGames = () => {
    const list = document.getElementById("gamesList") || document.getElementById("game-section");
    if (!list) return;

    const status = document.getElementById("filterStatus")?.value || "";
    const q = (document.getElementById("filterSearch")?.value || "").toLowerCase();

    const filtered = userGamesCache.filter((g) => {
      const statusOk = !status || g.status === status;
      const hay = `${g.title || ""} ${g.platform || ""} ${g.genre || ""}`.toLowerCase();
      const searchOk = !q || hay.includes(q);
      return statusOk && searchOk;
    });

    list.innerHTML = filtered.length
      ? filtered.map(g => `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="card p-3">
              <h5>${g.title || "Untitled Game"}</h5>
              <p class="mb-1"><strong>Status:</strong> ${g.status || "Backlog"}</p>
              <p class="mb-1"><strong>Hours:</strong> ${g.hoursPlayed || 0}</p>
              <p class="mb-1"><strong>Price:</strong> $${Number(g.price || 0).toFixed(2)}</p>
              <div class="d-flex gap-2 mt-2">
                <button class="btn btn-sm btn-outline-primary edit-btn"
                  data-id="${g._id}" data-status="${g.status}" data-hours="${g.hoursPlayed}" data-price="${g.price}">
                  Edit
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${g._id}">Delete</button>
              </div>
            </div>
          </div>
        `).join("")
      : `<p class="text-secondary">No games found.</p>`;
  };

  // ===== Load User Games =====
  me.refreshGames = async () => {
    try {
      const res = await fetch(`/api/userGames?userId=${encodeURIComponent(userIdHeader)}`);
      if (!res.ok) throw res;
      const { items } = await res.json();
      userGamesCache = items.map(x => ({
        _id: x._id, title: x.title || x.gameTitle || "(Unknown title)",
        platform: x.platform || "", genre: x.genre || "",
        status: x.status || "Backlog", hoursPlayed: x.hoursPlayed || 0, price: x.price || 0
      }));
      me.renderGames();
    } catch {
      const [games, userGames] = await Promise.all([
        loadMock("/data/mock_games.json"),
        loadMock("/data/mock_user_games.json"),
      ]);
      gamesIndex = new Map(games.map(g => [getOid(g._id), g]));
      const sess = getSession();
      const sessId = sess?.userId || sess?.email;
      const effectiveUserId = typeof sessId === "string" && !sessId?.includes("@") ? sessId : MOCK_USER_ID;

      userGamesCache = userGames
        .filter(ug => getOid(ug.userId) === effectiveUserId)
        .map(ug => {
          const game = gamesIndex.get(getOid(ug.gameId)) || {};
          return {
            _id: getOid(ug._id),
            title: game.title || "(Unknown title)",
            platform: game.platform || "",
            genre: game.genre || "",
            status: ug.status || "Backlog",
            hoursPlayed: ug.hoursPlayed || 0,
            price: game.price || 0
          };
        });
      me.renderGames();
    }
  };

  // ===== Load Stats =====
  me.refreshStats = async () => {
    try {
      const res = await fetch(`/api/userGames/stats?userId=${encodeURIComponent(userIdHeader)}`);
      if (!res.ok) throw res;
      const { stats } = await res.json();
      me.renderStats(stats);
    } catch {
      if (!userGamesCache.length) await me.refreshGames();
      const totals = userGamesCache.reduce(
        (a, g) => ({
          totalGames: a.totalGames + 1,
          totalHours: a.totalHours + (Number(g.hoursPlayed) || 0),
          totalSpend: a.totalSpend + (Number(g.price) || 0)
        }),
        { totalGames: 0, totalHours: 0, totalSpend: 0 }
      );
      me.renderStats(totals);
    }
  };

  // ===== Add Game Form =====
  me.addGameFormModal = () => {
    const form = document.getElementById("addGameForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      try {
        const res = await fetch("/api/userGames", {
          method: "POST", headers,
          body: JSON.stringify({
            gameId: data.gameId,
            status: data.status || "Backlog",
            price: data.price || 0,
            hoursPlayed: data.hoursPlayed || 0
          }),
        });
        if (!res.ok) throw res;
        form.reset();
        await me.refreshGames();
        await me.refreshStats();
      } catch {
        alert("Demo mode: cannot persist to mock files.");
      }
    });
  };

  // ===== Update & Delete =====
  me.updateGame = async (id, patch) => {
    try {
      const res = await fetch(`/api/userGames/${id}`, {
        method: "PUT", headers, body: JSON.stringify(patch)
      });
      if (!res.ok) throw res;
      await me.refreshGames();
      await me.refreshStats();
    } catch {
      alert("Demo mode: cannot persist to mock files.");
    }
  };

  me.deleteGame = async (id) => {
    try {
      const res = await fetch(`/api/userGames/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw res;
      await me.refreshGames();
      await me.refreshStats();
    } catch {
      alert("Demo mode: cannot persist to mock files.");
    }
  };

  return me;
}

// ===== Initialize =====
const myLib = Library();
document.getElementById("filterStatus")?.addEventListener("change", () => myLib.renderGames());
document.getElementById("filterSearch")?.addEventListener("input", () => myLib.renderGames());
document.addEventListener("click", (e) => {
  const del = e.target.closest(".delete-btn");
  if (del) myLib.deleteGame(del.dataset.id);
});

const editForm = document.getElementById("editGameForm");
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".edit-btn");
  if (!btn || !editForm) return;
  editForm.id.value = btn.dataset.id;
  editForm.status.value = btn.dataset.status || "Backlog";
  editForm.hoursPlayed.value = btn.dataset.hours || 0;
  editForm.price.value = btn.dataset.price || 0;
  document.getElementById("editGameModal").style.display = "block";
});

editForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await myLib.updateGame(editForm.id.value, {
    status: editForm.status.value,
    hoursPlayed: editForm.hoursPlayed.value,
    price: editForm.price.value,
  });
  document.getElementById("editGameModal").style.display = "none";
});

window.addEventListener("DOMContentLoaded", async () => {
  await myLib.refreshGames();
  await myLib.refreshStats();
  myLib.addGameFormModal();
});
