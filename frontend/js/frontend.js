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
      const status = g.status;
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
      const res = await fetch(`/api/userGames/stats/${userId}`);
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

  me.addGameFormModal = () => {
    const modalEl = document.getElementById("add-game-modal");
    if (!modalEl || !window.bootstrap?.Modal)
      return console.error("Modal missing or Bootstrap not loaded");

    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById("new-game-form");

    const titleInput = form.querySelector("#game-title");
    const genreInput = form.querySelector("#game-genre");
    const platformInput = form.querySelector("#game-platform");
    const hoursInput = form.querySelector("#game-hours");
    const priceInput = form.querySelector("#game-price");
    const statusInput = form.querySelector("#game-status");

    let selectedGame = null;
    const suggestionsEl = document.createElement("ul");
    suggestionsEl.className = "list-group position-absolute w-100";
    suggestionsEl.style.zIndex = "1055";
    titleInput.parentElement.style.position = "relative";
    titleInput.parentElement.appendChild(suggestionsEl);

    // Debounced game search
    const debounce = (fn, ms = 250) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    };

    const renderSuggestions = (games = []) => {
      suggestionsEl.innerHTML = "";
      if (!games.length) return (suggestionsEl.style.display = "none");
      games.forEach((g) => {
        const li = document.createElement("li");
        li.className = "list-group-item list-group-item-action";
        li.textContent = `${g.title} — ${g.platform || ""} (${g.year || "N/A"})`;
        li.onclick = () => selectGame(g);
        suggestionsEl.appendChild(li);
      });
      suggestionsEl.style.display = "block";
    };

    const searchGames = debounce(async (q) => {
      const term = q.trim();
      if (!term) return renderSuggestions([]);
      try {
        const res = await fetch(`/api/games?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        renderSuggestions(data.games?.slice(0, 20));
      } catch {
        renderSuggestions([]);
      }
    });

    const selectGame = (g) => {
      selectedGame = g;
      titleInput.value = g.title;
      genreInput.value = g.genre || "";
      platformInput.value = g.platform || "";
      priceInput.value = g.price?.toFixed(2) || 0;
      genreInput.readOnly = platformInput.readOnly = true;
      suggestionsEl.style.display = "none";
    };

    titleInput.addEventListener("input", (e) => {
      selectedGame = null;
      genreInput.readOnly = platformInput.readOnly = false;
      searchGames(e.target.value);
    });

    document.addEventListener("click", (e) => {
      if (!suggestionsEl.contains(e.target) && e.target !== titleInput)
        suggestionsEl.style.display = "none";
    });

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      if (!selectedGame) return alert("Please select a game.");

      const payload = {
        userId: "200000000000000000000001", // Example userId for testing
        gameId: selectedGame._id?.$oid || selectedGame._id,
        status: statusInput.value,
        hoursPlayed: Number(hoursInput.value) || 0,
        moneySpent: Number(priceInput.value) || 0,
      };

      try {
        const res = await fetch(`/api/userGames/userId/${payload.userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        modal.hide();
        form.reset();
        selectedGame = null;
        await me.refreshGames();
        await me.refreshStats();
      } catch (err) {
        console.error("Error adding game:", err);
        alert("Failed to add game.");
      }
    });

    document.getElementById("add-game-btn")?.addEventListener("click", () => modal.show());
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
      console.error("Error deleting game:", err);
    }
  };

  return me;
}

const myGames = Games();
myGames.refreshGames();
myGames.refreshStats();
myGames.addGameFormModal();
