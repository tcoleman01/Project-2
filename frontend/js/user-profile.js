console.log("user-profile.js loaded");

const userId = "200000000000000000000001";

// Run autocomplete setup when the Add Game modal is shown
document.addEventListener("DOMContentLoaded", () => {
  const addGameModalEl = document.getElementById("add-game-modal");
  if (!addGameModalEl) return;

  addGameModalEl.addEventListener("shown.bs.modal", () => {
    setupAutocomplete();
    addGames();
  });
});

// Autocomplete setup for the game title input field
function setupAutocomplete() {
  const input = document.getElementById("game-title");
  const hiddenInput = document.getElementById("game-id");
  const suggestionsBox = document.getElementById("suggestions");

  if (input.dataset.autocompleteBound === "true") return;
  input.dataset.autocompleteBound = "true";
  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const query = input.value.trim();

    if (!query) {
      suggestionsBox.innerHTML = "";
      hiddenInput.value = "";
      return;
    }

    timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/autocomplete?query=${encodeURIComponent(query)}`);
        const games = await res.json();

        suggestionsBox.innerHTML = games
          .map(
            (g) => `<li data-id="${g.id}"
          data-genre="${g.genre || ""}
          data-platform="${g.platform || ""}
          data-price="${g.price || ""}">${g.title}</li>`
          )
          .join("");

        suggestionsBox.querySelectorAll("li").forEach((item) => {
          item.addEventListener("click", () => {
            input.value = item.textContent;
            hiddenInput.value = item.getAttribute("data-id");
            suggestionsBox.innerHTML = "";

            const game = games.find((g) => g.id === item.getAttribute("data-id"));
            console.log("Selected game:", game);
            if (game) {
              document.getElementById("game-id").value = game.id;
              document.getElementById("game-price").value = game.price ?? 0;

              const genreInput = document.getElementById("game-genre");
              const platformInput = document.getElementById("game-platform");
              if ([...genreInput.options].some((opt) => opt.value === game.genre)) {
                genreInput.value = game.genre;
              }
              if ([...platformInput.options].some((opt) => opt.value === game.platform)) {
                platformInput.value = game.platform;
              }
            }
          });
        });
      } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
      }
    }, 300);
  });
}

// addGames handles the "Add New Game" form submission
function addGames() {
  const addGameForm = document.getElementById("new-game-form");

  addGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gameId = addGameForm.elements["game-id"].value;
    const hoursPlayed = addGameForm.elements["game-hours"].value.trim();
    const moneySpent = addGameForm.elements["game-price"].value.trim();
    const status = addGameForm.elements["game-status"].value;

    const res = await fetch(`/api/userGames/userId/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        gameId,
        status,
        moneySpent,
        hoursPlayed,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Game added to user collection:", data);
      // Close the modal
      const addGameModal = bootstrap.Modal.getInstance(document.getElementById("add-game-modal"));
      if (addGameModal) addGameModal.hide();
      await myGames.refreshGames();
      await myStats.refreshStats();
    } else {
      alert(data.error || "Failed to add game.");
    }
  });
}

// gameListings handles fetching and rendering the user's game collection
function gameListings() {
  const me = {};

  me.showError = ({ msg, res, type = "danger" }) => {
    // Show an error using bootstrap alerts
    const main = document.querySelector("main");
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.role = "alert";
    alert.innerText = `${msg}: ${res.status} ${res.statusText}`;
    main.prepend(alert);
  };

  const renderGames = (games) => {
    const wrap = document.getElementById("game-section");
    wrap.innerHTML = "";
    for (const g of games) {
      const game = g.gameDetails || {};
      const { title, platform, genre, price, year } = game;
      const status = g.status || "Playing"; // Default status
      const hoursPlayed = g.hoursPlayed || 0;
      const userRating = g.userReview?.rating || "-";
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <div class="game-card-image">
                                <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop" alt="${title} cover" />
                                <span class="status-badge badge-playing">${status}</span>
                            </div>
                            <div class="game-card-body">
                                <h5 class="game-title">${title}</h5>
                                <div class="genre-tags">
                                    <span class="genre-tag">${genre}</span>
                                </div>
                                <div class="game-meta">
                                    <span class="game-meta-tag">${year || "-"}</span>
                                    <span class="game-meta-tag">${platform}</span>
                                    <span class="game-meta-tag">$${price?.toFixed ? price.toFixed(2) : "0.00"}</span>
                                </div>    
                                <div class="game-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${hoursPlayed || 0}</div>
                                        <div class="stat-label">Hours</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${userRating}</div>
                                    <div class="stat-label">Rating</div>
                                </div>
                                </div>
                                <div class="card-actions">
                                    <button class="btn-card-action">Edit</button>
                                    <button class="btn-card-action btn-delete">Delete</button>
                                </div>
                            </div>
                `;
      wrap.appendChild(card);
    }
  };

  me.refreshGames = async () => {
    try {
      const res = await fetch(`/api/userGames?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load user games");

      const data = await res.json();
      renderGames(data.games);
    } catch (err) {
      console.error("Error fetching user games:", err);
      const wrap = document.getElementById("game-section");
      wrap.innerHTML = `<p class="text-danger">Failed to load your games. Bummer dude.</p>`;
    }
  };
  return me;
}

// userStats handles fetching and rendering the user's stats dashboard
function userStats() {
  const me = {};

  me.refreshStats = async () => {
    try {
      const res = await fetch(`/api/userGames/stats/${userId}`);
      if (!res.ok) {
        console.error("Failed to fetch stats", res.status, res.statusText);
        me.showError({ msg: "Failed to fetch stats", res });
        return;
      }
      const data = await res.json();
      console.log("Fetched stats:", data);

      const stats = data.stats || {};
      console.log("Stats:", stats);
      document.getElementById("total-games").innerText = stats.totalGames || 0;
      document.getElementById("completed-games").innerText = stats.totalCompleted || 0;
      document.getElementById("hours-logged").innerText = stats.totalHours || 0;
      document.getElementById("total-spent").innerText =
        `$${stats.totalSpent?.toFixed(2) || "0.00"}`;
    } catch (e) {
      console.error("Error fetching stats", e);
      document.getElementById("total-games").innerText = "0";
      document.getElementById("completed-games").innerText = "0";
      document.getElementById("hours-logged").innerText = "0";
      document.getElementById("total-spent").innerText = "$0.00";
    }
  };
  return me;
}

function reviewListings() {
  // Placeholder for future user profile related JS functionality
}

const myGames = gameListings();
const myStats = userStats();
myGames.refreshGames();
myStats.refreshStats();
