/* global bootstrap */
import { userId } from "./main.js";

export async function setupAutocomplete() {
  const input = document.getElementById("game-title");
  const hiddenInput = document.getElementById("game-id");
  const suggestionsBox = document.getElementById("suggestions");

  if (!input) return;
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
            (g) => `
              <li data-id="${g.id}" data-genre="${g.genre || ""}" 
                  data-platform="${g.platform || ""}" data-price="${g.price || ""}">
                ${g.title}
              </li>
            `
          )
          .join("");

        suggestionsBox.querySelectorAll("li").forEach((item) => {
          item.addEventListener("click", () => {
            input.value = item.textContent;
            hiddenInput.value = item.getAttribute("data-id");
            suggestionsBox.innerHTML = "";

            const game = games.find((g) => g.id === item.getAttribute("data-id"));
            if (game) {
              document.getElementById("game-id").value = game.id;
              document.getElementById("game-price").value = game.price ?? 0;

              const genreInput = document.getElementById("game-genre");
              const platformInput = document.getElementById("game-platform");
              if ([...genreInput.options].some((opt) => opt.value === game.genre))
                genreInput.value = game.genre;
              if ([...platformInput.options].some((opt) => opt.value === game.platform))
                platformInput.value = game.platform;
            }
          });
        });
      } catch (err) {
        console.error("Error fetching autocomplete suggestions:", err);
      }
    }, 300);
  });
}

export async function addGames() {
  const addGameForm = document.getElementById("new-game-form");
  if (!addGameForm) return;
  if (addGameForm.dataset.listenerAttached === "true") return;
  addGameForm.dataset.listenerAttached = "true";

  addGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gameId = addGameForm.elements["game-id"].value;
    const hoursPlayed = addGameForm.elements["game-hours"].value.trim();
    const moneySpent = addGameForm.elements["game-price"].value.trim();
    const status = addGameForm.elements["game-status"].value;

    try {
      const res = await fetch(`/api/userGames/userId/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, gameId, status, moneySpent, hoursPlayed }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Game added to user collection:", data);
        const addGameModal = bootstrap.Modal.getInstance(document.getElementById("add-game-modal"));
        if (addGameModal) addGameModal.hide();

        await window.myGames.refreshGames();
        await window.myStats.refreshStats();
      } else {
        alert(data.error || "Failed to add game.");
      }
    } catch (err) {
      console.error("Error adding game:", err);
    }
  });
}

export async function editGames() {
  const editGameForm = document.getElementById("edit-game-form");
  if (!editGameForm) return;

  editGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-game-id").value;
    const status = document.getElementById("edit-status").value;
    const hoursPlayed = document.getElementById("edit-hours").value.trim();
    const moneySpent = document.getElementById("edit-price").value.trim();

    try {
      const res = await fetch(`/api/userGames/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, hoursPlayed, moneySpent }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Game updated:", data);
        const modal = bootstrap.Modal.getInstance(document.getElementById("edit-game-modal"));
        if (modal) modal.hide();
        await window.myGames.refreshGames();
        await window.myStats.refreshStats();
      } else {
        alert(data.error || "Failed to update game.");
      }
    } catch (err) {
      console.error("Error editing game:", err);
    }
  });
}

export async function gameListings() {
  const me = {};

  const renderGames = (games) => {
    const wrap = document.getElementById("game-section");
    wrap.innerHTML = "";
    wrap.classList.add("row", "game-grid");

    for (const g of games) {
      const game = g.gameDetails || {};
      const { title, platform, genre, year } = game;
      const status = g.status || "Playing";
      const hoursPlayed = g.hoursPlayed || 0;
      const userRating = g.userReview?.rating || "-";
      const moneySpent = g.moneySpent?.toFixed ? g.moneySpent.toFixed(2) : "0.00";

      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3 mb-4";

      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <div class="game-card-image">
          <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop" alt="${title} cover" />
          <span class="status-badge badge-playing">${status}</span>
        </div>
        <div class="game-card-body">
          <h5 class="game-title">${title}</h5>
          <div class="genre-tags"><span class="genre-tag">${genre}</span></div>
          <div class="game-meta">
            <span class="game-meta-tag">${year || "-"}</span>
            <span class="game-meta-tag">${platform}</span>
            <span class="game-meta-tag">$${moneySpent}</span>
          </div>
          <div class="game-stats">
            <div class="stat-item">
              <div class="stat-value">${hoursPlayed}</div>
              <div class="stat-label">Hours</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${userRating}/5</div>
              <div class="stat-label">Rating</div>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-card-action" data-id="${g._id}">Edit</button>
            <button type="button" class="btn-card-action btn-delete" data-id="${g._id}">Delete</button>
          </div>
        </div>`;

      col.appendChild(card);
      wrap.appendChild(col);
    }
  };

  me.renderGames = renderGames;
  me.allGames = [];

  me.refreshGames = async () => {
    try {
      const res = await fetch(`/api/userGames?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load user games");

      const data = await res.json();
      console.log("Fetched user games:", data);
      me.allGames = data.games || [];
      renderGames(data.games);
    } catch (err) {
      console.error("Error fetching user games:", err);
      const wrap = document.getElementById("game-section");
      wrap.innerHTML = `<p class="text-danger">Failed to load your games.</p>`;
    }
  };

  return me;
}

export function initGameModals() {
  const addGameModalEl = document.getElementById("add-game-modal");

  if (addGameModalEl) {
    // When modal is shown, set up autocomplete and form handler
    addGameModalEl.addEventListener("shown.bs.modal", () => {
      setupAutocomplete();
      addGames();
    });
  }

  if (addGameModalEl) {
    addGameModalEl.addEventListener("hidden.bs.modal", () => {
      const form = document.getElementById("new-game-form");
      if (form) form.reset();

      const gameIdInput = document.getElementById("game-id");
      const suggestions = document.getElementById("suggestions");

      if (gameIdInput) gameIdInput.value = "";
      if (suggestions) suggestions.innerHTML = "";
    });
  }
}

// Handle Edit and Delete buttons for user games
document.addEventListener("click", async (e) => {
  // --- Edit Button ---
  const editBtn = e.target.closest(".btn-card-action:not(.btn-delete)");
  if (editBtn) {
    const userGameId = editBtn.dataset.id;
    console.log("Edit button clicked for:", userGameId);

    try {
      const res = await fetch(`/api/userGames?userId=${userId}`);
      const data = await res.json();
      const game = (data.games || []).find((g) => g._id === userGameId);

      if (!game) {
        alert("Game not found in your collection.");
        return;
      }

      // Pre-fill modal fields
      document.getElementById("edit-game-id").value = userGameId;
      document.getElementById("edit-status").value = game.status || "Playing";
      document.getElementById("edit-hours").value = game.hoursPlayed || 0;
      document.getElementById("edit-price").value = game.moneySpent || 0;

      // Show modal
      const modalEl = document.getElementById("edit-game-modal");
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } catch (err) {
      console.error("Error fetching game for editing:", err);
      alert("Failed to load game for editing.");
    }

    return; // stop here so delete code doesn't run
  }

  // --- Delete Button ---
  const deleteBtn = e.target.closest(".btn-delete");
  if (deleteBtn) {
    const userGameId = deleteBtn.dataset.id;
    if (!confirm("Are you sure you want to delete this game from your library?")) return;

    try {
      const res = await fetch(`/api/userGames/${userGameId}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        console.log("Game deleted:", data);
        await window.myGames.refreshGames();
        await window.myStats.refreshStats();
      } else {
        alert(data.error || "Failed to delete game.");
      }
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Error deleting game. Please try again later.");
    }
  }
});

export const myGames = gameListings();
