// frontend/js/game.js
// Render mock games as image cards in a grid (no backend needed)

(function () {
  const grid =
    document.getElementById("game-section") ||
    document.querySelector(".game-grid");
  if (!grid) {
    console.warn("game.js: No grid container found (#game-section or .game-grid).");
    return;
  }

  const searchInput = Array.from(document.querySelectorAll("input.form-control, input[type='search']"))
    .find(i => /search/i.test(i.placeholder || i.id || ""));
  const genreFilter  = document.getElementById("genre-filter");
  const statusFilter = document.getElementById("status-filter");
  const totalCount   = document.getElementById("total-games");

  // ---------- Image helpers (prevents endless loading) ----------
  const svgPlaceholder = (text = "No Cover", w = 480, h = 640) => {
    const bg = "#1b1626";        // dark background to match theme
    const fg = "#8aa8ff";        // secondary accent
    const body = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
        <defs>
          <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
            <stop offset='0%' stop-color='#ff72b6' stop-opacity='0.25'/>
            <stop offset='100%' stop-color='#7ef6d7' stop-opacity='0.25'/>
          </linearGradient>
        </defs>
        <rect width='100%' height='100%' fill='${bg}'/>
        <rect x='12' y='12' width='${w-24}' height='${h-24}' rx='16' fill='url(#g)' stroke='${fg}' stroke-opacity='0.25'/>
        <g fill='${fg}' fill-opacity='0.9'>
          <circle cx='${w/2}' cy='${h/2 - 24}' r='42' fill='none' stroke='${fg}' stroke-width='3' stroke-opacity='0.5'/>
          <path d='M ${w/2-18} ${h/2-10} h 36 v 28 h -36 z' fill='none' stroke='${fg}' stroke-width='2' stroke-opacity='0.5'/>
        </g>
        <text x='50%' y='${h - 28}' text-anchor='middle' font-family='ui-sans-serif,system-ui,Segoe UI,Roboto,Arial'
              font-size='20' fill='${fg}' fill-opacity='0.9'>${text}</text>
      </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(body.trim());
  };

  const PLACEHOLDER = svgPlaceholder();

  // Basic URL check: only treat as a network image if it looks like a real URL
  const looksLikeUrl = (s) => /^https?:\/\/|^\/\//i.test(String(s || "").trim());

  const coverOf = (g) => {
    const candidate = g.coverUrl || g.image || g.cover || g.thumbnail || "";
    return looksLikeUrl(candidate) ? candidate : PLACEHOLDER;
  };

  // ---------- Formatting helpers ----------
  const slugify = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  function metaLine(g) {
    const bits = [g.platform, g.genre, g.year || g.releaseYear || g.releaseDate].filter(Boolean);
    return bits.join(" • ");
  }

  function priceOf(g) {
    if (g.price == null || isNaN(Number(g.price))) return null;
    return `$${Number(g.price).toFixed(2)}`;
  }

  // ---------- Data ----------
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

    grid.innerHTML = list.map((g) => {
      const title = g.title || "Untitled";
      const img   = coverOf(g);
      const meta  = metaLine(g);
      const price = priceOf(g);
      const slug  = (g.slug && String(g.slug)) || slugify(title);

      // onerror swaps to placeholder and disables further errors (no loop)
      const onErr = "this.onerror=null;this.src='" + PLACEHOLDER.replace(/'/g, "\\'") + "';";

      return `
        <div class="card h-100 shadow-sm game-card">
          <img
            src="${img}"
            alt="${title} cover"
            class="card-img-top"
            loading="lazy"
            decoding="async"
            onerror="${onErr}"
          >
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
    }).join("");

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

      // Wire optional filters if present
      searchInput && searchInput.addEventListener("input", () => applyFilters(allGames));
      genreFilter && genreFilter.addEventListener("change", () => applyFilters(allGames));
      statusFilter && statusFilter.addEventListener("change", () => applyFilters(allGames));
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="alert alert-warning">
        Could not load mock game data. Ensure <code>frontend/data/mock_games.json</code> exists.
      </div>`;
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
