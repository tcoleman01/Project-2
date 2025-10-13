// frontend/js/game.js
const params = new URLSearchParams(location.search);
const slug = params.get("slug");

async function loadGames() {
  const res = await fetch("./data/games.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load games.json");
  return res.json();
}

(async () => {
  if (!slug) {
    document.querySelector("main").innerHTML =
      "<p class='container py-4'>Missing ?slug parameter.</p>";
    return;
  }

  try {
    const games = await loadGames();
    const game = games.find((g) => g.slug === slug);

    if (!game) {
      document.querySelector("main").innerHTML =
        "<p class='container py-4'>Game not found.</p>";
      return;
    }

    const coverEl = document.getElementById("cover");
    const titleEl = document.getElementById("title");
    const metaEl = document.getElementById("meta");
    const descEl = document.getElementById("desc");
    const communityEl = document.getElementById("community");

    coverEl.src = game.coverUrl || "https://via.placeholder.com/600x600?text=Cover";
    coverEl.alt = `${game.title} cover`;
    titleEl.textContent = game.title;

    const metaBits = [game.platform, game.year, game.price ? `$${game.price}` : null]
      .filter(Boolean)
      .join(" • ");
    metaEl.textContent = metaBits;

    descEl.textContent = game.description || "No description.";

    const ratings = Array.isArray(game.reviews) ? game.reviews.map((r) => r.rating) : [];
    if (ratings.length) {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      communityEl.textContent = `Community: ${ratings.length} reviews • Avg ${avg.toFixed(1)}/5`;
    } else {
      communityEl.textContent = "No community reviews yet.";
    }
  } catch (err) {
    console.error(err);
    document.querySelector("main").innerHTML =
      "<p class='container py-4'>Error loading game data.</p>";
  }
})();
