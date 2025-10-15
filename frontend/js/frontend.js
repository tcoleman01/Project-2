console.log("This is the frontend JavaScript file.");

function Games() {
  const me = {};
  const userId = "200000000000000000000001"; // Example userId for testing

  me.showError = ({ msg, res, type = "danger" }) => {
    // Show an error message to the user using bootstrap
    const main = document.querySelector("main");
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.role = "alert";
    alert.innerText = `${msg}: ${res.status} ${res.statusText}`;
    main.prepend(alert);
  };

  const renderGames = (games) => {
    const gamesDiv = document.getElementById("game-section");
    gamesDiv.innerHTML = ""; // Clear existing content
    for (const g of games) {
      const game = g.gameDetails || {};
      const { title, platform, genre, price, year } = game;
      const status = g.status || "Backlog";
      const hoursPlayed = g.hoursPlayed || 0;
      const userRating = g.userReview?.rating || "-";
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
                <div class="game-card-image">
                                <img src="https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop" alt="Baldur's Gate 3">
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
                                    <button class="btn-card-action edit-game-btn" data-id="${g._id}">Edit</button>
                                    <button class="btn-card-action btn-delete delete-game-btn" data-id="${g._id}">Delete</button>
                                </div>
                            </div>
                `;
      gamesDiv.appendChild(card);
    }
  };

  me.refreshGames = async () => {
    try {
      const res = await fetch(`/api/userGames?userId=${userId}`);
      if (!res.ok) {
        console.error("Failed to fetch games", res.status, res.statusText);
        me.showError({ msg: "Failed to fetch games", res });
        return;
      }

      const data = await res.json();
      console.log("Fetched games:", data);

      me.currentGames = data.games || [];

      renderGames(me.currentGames);
    } catch (e) {
      console.error("Error fetching user games", e);
      const gamesDiv = document.getElementById("game-section");
      gamesDiv.innerHTML = `<div class="alert alert-danger">Failed to load your games. Bummer.</div>`;
    }
  };

  me.refreshStats = async () => {
    try {
      const res = await fetch(`/api/userGames/stats?userId=${userId}`);
      if (!res.ok) {
        console.error("Failed to fetch stats", res.status, res.statusText);
        me.showError({ msg: "Failed to fetch stats", res });
        return;
      }
      const data = await res.json();
      console.log("Fetched stats:", data);

      const stats = data.stats;
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

  // === Add Game Modal + Autocomplete (uses #add-game-modal) ===
  me.addGameFormModal = () => {
    const modalEl = document.getElementById("add-game-modal");
    if (!modalEl) {
      console.error("addGameFormModal: modal element #add-game-modal not found");
      return;
    }
    if (!window.bootstrap || !window.bootstrap.Modal) {
      console.error("Bootstrap Modal not available on window.bootstrap");
      return;
    }

    const addGameModal = new bootstrap.Modal(modalEl);

    // Elements inside modal
    const titleInput = document.getElementById("game-title");
    const genreInput = document.getElementById("game-genre");
    const platformInput = document.getElementById("game-platform");
    const hoursInput = document.getElementById("game-hours");
    const priceInput = document.getElementById("game-price");
    const submitBtn = document.getElementById("submit-add-game");
    const form = document.getElementById("new-game-form");

    // Suggestion dropdown container
    let suggestionsContainer = null;
    const ensureSuggestionsContainer = () => {
      if (suggestionsContainer) return suggestionsContainer;
      suggestionsContainer = document.createElement("ul");
      suggestionsContainer.className = "list-group position-absolute";
      suggestionsContainer.style.zIndex = 1055;
      suggestionsContainer.style.width = "100%";
      suggestionsContainer.style.maxHeight = "200px";
      suggestionsContainer.style.overflow = "auto";
      suggestionsContainer.id = "game-suggestions";
      titleInput.parentElement.style.position = "relative";
      titleInput.parentElement.appendChild(suggestionsContainer);
      return suggestionsContainer;
    };

    // Debounce helper
    let debounceTimer = null;
    const debounce = (fn, wait = 250) => {
      return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn(...args), wait);
      };
    };

    // State
    let selectedGame = null;
    let suggestionItems = [];

    const escapeHtml = (str) =>
      !str && str !== 0
        ? ""
        : String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const renderSuggestions = (games) => {
      const ul = ensureSuggestionsContainer();
      ul.innerHTML = "";
      suggestionItems = [];

      if (!games?.length) {
        ul.style.display = "none";
        return;
      }

      for (const g of games) {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.tabIndex = 0;
        li.dataset.gameId = g._id;
        li.innerHTML = `<strong>${escapeHtml(g.title)}</strong> <small class="text-muted"> — ${escapeHtml(g.platform || "")} ${g.year ? "(" + g.year + ")" : ""}</small>`;
        li.addEventListener("click", () => chooseSuggestion(g));
        li.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            chooseSuggestion(g);
          }
        });
        ul.appendChild(li);
        suggestionItems.push(li);
      }
      ul.style.display = "block";
    };

    const chooseSuggestion = (game) => {
      selectedGame = game;
      titleInput.value = game.title || "";
      genreInput.value = game.genre || "";
      platformInput.value = game.platform || "";
      priceInput.value = (game.price ?? 0).toFixed
        ? Number(game.price).toFixed(2)
        : (game.price ?? 0);
      hoursInput.value = 0;

      genreInput.readOnly = true;
      platformInput.readOnly = true;

      const ul = document.getElementById("game-suggestions");
      if (ul) ul.style.display = "none";
      hoursInput.focus();
    };

    titleInput.addEventListener("input", () => {
      selectedGame = null;
      genreInput.readOnly = false;
      platformInput.readOnly = false;
      scheduleSearch(titleInput.value);
    });

    document.addEventListener("click", (e) => {
      const ul = document.getElementById("game-suggestions");
      if (!ul) return;
      if (!ul.contains(e.target) && e.target !== titleInput) {
        ul.style.display = "none";
      }
    });

    titleInput.addEventListener("keydown", (e) => {
      const ul = document.getElementById("game-suggestions");
      if (!ul || ul.style.display === "none") return;
      const focusIndex = suggestionItems.findIndex((li) => li === document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = suggestionItems[(focusIndex + 1) % suggestionItems.length];
        if (next) next.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          suggestionItems[(focusIndex - 1 + suggestionItems.length) % suggestionItems.length];
        if (prev) prev.focus();
      }
    });

    const searchGames = async (q) => {
      try {
        const term = String(q || "").trim();
        if (!term) {
          renderSuggestions([]);
          return;
        }
        const res = await fetch(`/api/games?q=${encodeURIComponent(term)}`);
        if (!res.ok) {
          console.error("Game search failed", res.status);
          renderSuggestions([]);
          return;
        }
        const payload = await res.json();
        const results = payload.games || [];
        renderSuggestions(results.slice(0, 20));
      } catch (err) {
        console.error("Search error", err);
        renderSuggestions([]);
      }
    };

    const scheduleSearch = debounce(searchGames, 200);

    submitBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();

      if (!selectedGame) {
        alert("Please select a game from the list.");
        titleInput.focus();
        return;
      }

      const userId = "200000000000000000000001"; // replace with real user id later
      const gameId = selectedGame._id?.$oid || selectedGame._id;
      const hours = Number(hoursInput.value) || 0;
      const pricePaid = Number(priceInput.value) || 0;

      const payload = {
        userId,
        gameId,
        status: "Backlog",
        hoursPlayed: hours,
        price: pricePaid,
      };

      try {
        const res = await fetch("/api/userGames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to add game to profile", data);
          alert("Failed to add game: " + (data.error || res.statusText));
          return;
        }

        addGameModal.hide();
        form.reset();
        selectedGame = null;
        const ul = document.getElementById("game-suggestions");
        if (ul) ul.style.display = "none";

        await me.refreshGames();
        await me.refreshStats();
      } catch (err) {
        console.error("Error adding game", err);
        alert("Server error — see console.");
      }
    });

    modalEl.addEventListener("show.bs.modal", () => {
      form.reset();
      selectedGame = null;
      const ul = document.getElementById("game-suggestions");
      if (ul) ul.style.display = "none";
      genreInput.readOnly = false;
      platformInput.readOnly = false;
      titleInput.focus();
    });

    // Connect the "Add New Game" button to open modal
    const openBtn = document.getElementById("add-game-btn");
    if (openBtn) {
      openBtn.addEventListener("click", () => addGameModal.show());
    }
  };

  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-game-btn");
    if (editBtn) {
      const userGameId = editBtn.dataset.id;
      me.openEditModal(userGameId);
    }
  });

  me.openEditModal = (userGameId) => {
    const modalEl = document.getElementById("edit-game-modal");
    const statusEl = document.getElementById("edit-status");
    const hoursEl = document.getElementById("edit-hours");
    const priceEl = document.getElementById("edit-price");
    const form = document.getElementById("edit-game-form");
    const modal = new bootstrap.Modal(modalEl);

    // Prefill fields from your current games cache if available
    const g = me.currentGames.find((x) => x._id === userGameId);
    if (g) {
      statusEl.value = g.status;
      hoursEl.value = g.hoursPlayed ?? 0;
      priceEl.value = g.price ?? 0;
    }

    const onSave = async (ev) => {
      ev.preventDefault();
      const payload = {
        status: statusEl.value,
        hoursPlayed: Number(hoursEl.value),
        price: Number(priceEl.value),
      };
      console.log("Editing userGameId:", userGameId);
      try {
        const res = await fetch(`/api/userGames/${userGameId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");

        modal.hide();
        await me.refreshGames();
        await me.refreshStats();
      } catch (err) {
        console.error("Error updating game:", err);
        alert("Failed to update game: " + err.message);
      }
    };

    form.addEventListener("submit", onSave, { once: true });
    modal.show();
  };

  document.addEventListener("click", async (e) => {
    const delBtn = e.target.closest(".delete-game-btn");
    if (delBtn) {
      const userGameId = delBtn.dataset.id;
      if (confirm("Are you sure you want to remove this game from your profile?")) {
        try {
          await me.deleteUserGame(userGameId);
        } catch (err) {
          console.error("Error deleting game:", err);
          alert("Failed to delete game: " + err.message);
        }
      }
    }
  });

  me.deleteUserGame = async (userGameId) => {
    try {
      console.log("🗑️ Deleting userGame:", userGameId);
      const res = await fetch(`/api/userGames/${userGameId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete game");

      const data = await res.json();
      console.log("✅ Delete success:", data);

      // Refresh lists + stats
      await me.refreshGames();
      await me.refreshStats();
    } catch (err) {
      console.error("❌ Error deleting game:", err);
    }
  };

  return me;
}

const myGames = Games();
myGames.refreshGames();
myGames.refreshStats();
myGames.addGameFormModal();
