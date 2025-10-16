<// frontend/js/frontend.js
// Renders the user's library + stats from mock JSON on user-profile.html.
// Targets existing IDs: #game-section, #total-games, #completed-games, #hours-logged, #total-spent
(function () {
  const grid = document.getElementById("game-section");
  if (!grid) return; // only run on user-profile.html

  const elTotal = document.getElementById("total-games");
  const elDone  = document.getElementById("completed-games");
  const elHours = document.getElementById("hours-logged");
  const elSpent = document.getElementById("total-spent");

  // Filters you already have
  const elStatus = document.getElementById("status-filter");
  const elSearch = Array.from(document.querySelectorAll("input.form-control"))
    .find(i => /search your games/i.test(i.placeholder || ""));

  // Use the user present in your mock_user_games.json
  const MOCK_USER_ID = "200000000000000000000001";

  const getOid = (x) => (x && typeof x === "object" && x.$oid ? x.$oid : x);
  const fmt2  = (n) => Number(n || 0).toFixed(2);

  async function load(path) {
    const r = await fetch(path, { cache: "no-store" });
    if (!r.ok) throw new Error(`Failed to load ${path}`);
    return r.json();
  }

  let base = [], view = [];

  function joinData(userGames, games) {
    const idx = new Map(games.map(g => [getOid(g._id), g]));
    return userGames
      .filter(ug => getOid(ug.userId) === MOCK_USER_ID)
      .map(ug => {
        const m = idx.get(getOid(ug.gameId)) || {};
        return {
          id: getOid(ug._id),
          title: m.title || "(Unknown title)",
          platform: m.platform || "",
          genre: m.genre || "",
          status: ug.status || "Backlog",
          hours: Number(ug.hoursPlayed || 0),
          spent: ug.moneySpent != null ? Number(ug.moneySpent) : Number(m.price || 0),
          year: m.year || m.releaseYear || ""
        };
      });
  }

  function render(list) {
    grid.innerHTML = list.length
      ? list.map(g => `
          <div class="card p-3 mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="mb-1">${g.title}</h5>
                <div class="small text-secondary">${[g.platform, g.genre, g.year].filter(Boolean).join(" • ")}</div>
              </div>
              <span class="badge text-bg-dark">${g.status}</span>
            </div>
            <div class="mt-2 small">
              <span><strong>Hours:</strong> ${g.hours}</span>
              <span class="ms-3"><strong>Spent:</strong> $${fmt2(g.spent)}</span>
            </div>
          </div>
        `).join("")
      : '<p class="text-secondary">No games in your library.</p>';

    const t = list.reduce((a, g) => {
      a.c++; a.h += g.hours; a.s += g.spent;
      if ((g.status || "").toLowerCase() === "completed") a.d++;
      return a;
    }, { c:0, h:0, s:0, d:0 });

    if (elTotal) elTotal.textContent = t.c;
    if (elDone)  elDone.textContent  = t.d;
    if (elHours) elHours.textContent = t.h;
    if (elSpent) elSpent.textContent = fmt2(t.s);
  }

  function applyFilters() {
    const q = (elSearch?.value || "").toLowerCase();
    const s = (elStatus?.value || "");
    view = base.filter(g => {
      const qok = !q || `${g.title} ${g.platform} ${g.genre}`.toLowerCase().includes(q);
      const sok = !s || s === "All Statuses" || g.status === s;
      return qok && sok;
    });
    render(view);
  }

  async function init() {
    try {
      const [games, userGames] = await Promise.all([
        load("./data/mock_games.json"),
        load("./data/mock_user_games.json"),
      ]);
      base = joinData(userGames, games);
      view = base.slice();
      render(view);

      elSearch && elSearch.addEventListener("input", applyFilters);
      elStatus && elStatus.addEventListener("change", applyFilters);

      // Optional: auto-refresh if your add/delete buttons dispatch this event
      document.addEventListener("userLibraryChanged", async () => {
        try {
          const [g2, ug2] = await Promise.all([
            load("./data/mock_games.json"),
            load("./data/mock_user_games.json"),
          ]);
          base = joinData(ug2, g2);
          applyFilters();
        } catch (e) {
          console.warn("Refresh failed", e);
        }
      });
    } catch (e) {
      console.warn(e);
      grid.innerHTML = '<p class="text-warning">Could not load mock data.</p>';
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
