// frontend/js/game.js
const params = new URLSearchParams(location.search);
const slug = params.get("slug");

// Try primary file, then fallback to mock
async function loadGames() {
  // 1) Try games.json
  try {
    const r = await fetch("./data/games.json", { cache: "no-store" });
    if (r.ok) return r.json();
  } catch (_) {}
  // 2) Fallback to mock_games.json
  const res = await fetch("./data/mock_games.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load mock_games.json");
  return res.json();
}

// Optional: load mock reviews if not embedded in game
async function loadMockReviews() {
  try {
    const r = await fetch("./data/mock_reviews.json", { cache: "no-store" });
    if (r.ok) return r.json();
  } catch (_) {}
  return [];
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getOid(x) {
  return x && typeof x === "object" && x.$oid ? x.$oid : x;
}

(async () => {
  const main = document.querySelector("main") || document.body;

  if (!slug) {
    main.innerHTML = "<p class='container py-4'>Missing ?slug parameter.</p>";
    return;
  }

  try {
    const games = await loadGames();

    // Find by exact slug field first; else fallback to slugified title
    let game =
      games.find((g) => g.slug === slug) ||
      games.find((g) => slugify(g.title) === slug);

    if (!game) {
      main.innerHTML = "<p class='container py-4'>Game not found.</p>";
      return;
    }

    const coverEl = document.getElementById("cover");
    const titleEl = document.getElementById("title");
    const metaEl = document.getElementById("meta");
    const descEl = document.getElementById("desc");
    const communityEl = document.getElementById("community");

    if (coverEl) {
      coverEl.src = game.coverUrl || "https://via.placeholder.com/600x600?text=Cover";
      coverEl.alt = `${game.title || "Game"} cover`;
    }
    if (titleEl) titleEl.textContent = game.title || "(Untitled)";

    // Be flexible with fields across mock sets
    const year = game.year || game.releaseYear || game.releaseDate || null;
    const price = game.price != null ? `$${Number(game.price).toFixed(2)}` : null;
    const metaBits = [game.platform, year, price].filter(Boolean).join(" • ");
    if (metaEl) metaEl.textContent = metaBits;

    if (descEl) descEl.textContent = game.description || "No description.";

    // Reviews: prefer embedded, else fallback to mock_reviews.json by gameId
    let ratings = [];
    if (Array.isArray(game.reviews) && game.reviews.length) {
      ratings = game.reviews.map((r) => Number(r.rating) || 0).filter((n) => !Number.isNaN(n));
    } else {
      const allReviews = await loadMockReviews();
      const gameId = getOid(game._id);
      const list = allReviews.filter((r) => getOid(r.gameId) === gameId);
      ratings = list.map((r) => Number(r.rating) || 0).filter((n) => !Number.isNaN(n));
    }

    if (communityEl) {
      if (ratings.length) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        communityEl.textContent = `Community: ${ratings.length} reviews • Avg ${avg.toFixed(1)}/5`;
      } else {
        communityEl.textContent = "No community reviews yet.";
      }
    }
  } catch (err) {
    console.error(err);
    main.innerHTML = "<p class='container py-4'>Error loading game data.</p>";
  }
})();
