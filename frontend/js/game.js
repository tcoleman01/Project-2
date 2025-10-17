// frontend/js/game.js
// Render mock games as image cards on game.html (no backend needed)

(function () {
  const grid =
    document.querySelector(".game-grid") ||
    document.getElementById("game-section") ||
    document.querySelector("main");
  if (!grid) {
    console.warn("game.js: No container (.game-grid or #game-section) found on this page.");
    return;
  }

  const searchInput = Array.from(
    document.querySelectorAll("input.form-control, input[type='search']")
  ).find((i) => /search/i.test(i.placeholder || i.id || ""));
  const genreFilter = document.getElementById("genre-filter");
  const statusFilter = document.getElementById("status-filter");
  const totalCount = document.getElementById("total-games");

  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const coverOf = (g) =>
    g.coverUrl ||
    g.image ||
    g.cover ||
    g.thumbnail ||
    "https://via.placeholder.com/480x600?text=No+Cover";

  function metaLine(g) {
    const bits = [g.platform, g.genre, g.year || g.releaseYear || g.releaseDate].filter(Boolean);
    return bits.join(" • ");
  }

  function priceOf(g) {
    if (g.price == null || isNaN(Number(g.price))) return null;
    return `$${Number(g.price).toFixed(2)}`;
  }

  async function loadGames() {
    const res = await fetch("./data/mock_games.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load ./data/mock_games.json");
    return res.json();
  }

  function renderCards(list) {
    if (!Array.isArray(list) || !list.length) {
      grid.innerHTML = `<p class="text-secondary">No games found.</p>`;
      if (totalCount) totalCount.textContent = "0";
      return;
    }

    grid.innerHTML = list
      .map((g) => {
        const title = g.title || "Untitled";
        const img = coverOf(g);
        const meta = metaLine(g);
        const price = priceOf(g);
        const slug = (g.slug && String(g.slug)) || slugify(title);

        return `
  <div class="card h-100 shadow-sm game-card">
    <img src="${img}" alt="${title} cover" class="card-img-top"
         onerror="this.src='https://via.placeholder.com/480x600?text=No+Cover'">
    <div class="card-body d-flex flex-column">
      <h5 class="card-title mb-1">${title}</h5>
      <div class="text-secondary small mb-2">${meta || ""}</div>
      ${price ? `<div class="fw-semibold mb-2">${price}</div>` : ""}
      <div class="mt-auto d-flex gap-2">
        <a class="btn btn-primary btn-sm" href="./game.html?slug=${encodeURIComponent(slug)}">View</a>
        ${g.status ? `<span class="badge text-bg-secondary align-self-center">${g.status}</span>` : ""}
      </div>
    </div>
  </div>
`;
      })
      .join("");

    if (totalCount) totalCount.textContent = String(list.length);
  }

  function applyFilters(all) {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const g = (genreFilter?.value || "").trim();
    const s = (statusFilter?.value || "").trim();

    const filtered = all.filter((item) => {
      const hay = `${item.title || ""} ${item.genre || ""} ${item.platform || ""}`.toLowerCase();
      const qok = !q || hay.includes(q);
      const gok = !g || g === "All Genres" || item.genre === g;
      const sok = !s || s === "All Statuses" || item.status === s;
      return qok && gok && sok;
    });

    renderCards(filtered);
  }

  async function init() {
    try {
      const allGames = await loadGames();
      renderCards(allGames);

      searchInput && searchInput.addEventListener("input", () => applyFilters(allGames));
      genreFilter && genreFilter.addEventListener("change", () => applyFilters(allGames));
      statusFilter && statusFilter.addEventListener("change", () => applyFilters(allGames));
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="alert alert-warning">Could not load mock game data. Ensure <code>frontend/data/mock_games.json</code> exists.</div>`;
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
