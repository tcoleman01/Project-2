/* global bootstrap */

console.log("user-profile.js loaded");

const userId = "200000000000000000000001";

// Initialize event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("user-profile.js loaded");

  setupAutocomplete();
  addGames();
  editGames();
  addReview();
  editReview();

  document.getElementById("search-filter")?.addEventListener("input", applyFilters);
  document.getElementById("status-filter")?.addEventListener("change", applyFilters);
  document.getElementById("genre-filter")?.addEventListener("change", applyFilters);
  document.getElementById("sort-filter")?.addEventListener("change", applyFilters);
  document.getElementById("reset-filters")?.addEventListener("click", resetFilters);

  const addGameModalEl = document.getElementById("add-game-modal");
  if (addGameModalEl) {
    addGameModalEl.addEventListener("hidden.bs.modal", () => {
      const form = document.getElementById("new-game-form");
      if (form) form.reset();
      document.getElementById("game-id").value = "";
      document.getElementById("suggestions").innerHTML = "";
    });
  }
});

// Autocomplete setup for the game title input field of add game modal
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

  if (addGameForm.dataset.listenerAttached === "true") return;
  addGameForm.dataset.listenerAttached = "true";

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

// Handle Edit button click
document.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".btn-card-action:not(.btn-delete)");
  if (!editBtn) return;

  const userGameId = editBtn.dataset.id;
  console.log("Edit button clicked for:", userGameId);

  // Fetch the user's games and find the one we clicked
  const res = await fetch(`/api/userGames?userId=${userId}`);
  const data = await res.json();
  const game = (data.games || []).find((g) => g._id === userGameId);

  if (!game) {
    alert("Game not found in your collection.");
    return;
  }

  // Pre-fill the edit modal fields
  document.getElementById("edit-game-id").value = userGameId;
  document.getElementById("edit-status").value = game.status || "Playing";
  document.getElementById("edit-hours").value = game.hoursPlayed || 0;
  document.getElementById("edit-price").value = game.moneySpent || 0;

  // Show the modal
  const modalEl = document.getElementById("edit-game-modal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
});

// Handle Delete button clicks for a user game
document.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".btn-delete");
  if (!deleteBtn) return;

  const userGameId = deleteBtn.dataset.id;
  if (!confirm("Are you sure you want to delete this game from your library?")) return;

  try {
    const res = await fetch(`/api/userGames/${userGameId}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Game deleted:", data);
      await myGames.refreshGames();
      await myStats.refreshStats();
    } else {
      alert(data.error || "Failed to delete game.");
    }
  } catch (err) {
    console.error("Error deleting game:", err);
    alert("Error deleting game. Please try again later.");
  }
});

// Handle Edit Game form submission
function editGames() {
  const editGameForm = document.getElementById("edit-game-form");

  editGameForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-game-id").value;
    const status = document.getElementById("edit-status").value;
    const hoursPlayed = document.getElementById("edit-hours").value.trim();
    const moneySpent = document.getElementById("edit-price").value.trim();

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
      await myGames.refreshGames();
      await myStats.refreshStats();
    } else {
      alert(data.error || "Failed to update game.");
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
    wrap.classList.add("row", "game-grid");
    for (const g of games) {
      const game = g.gameDetails || {};
      const { title, platform, genre, year } = game;
      const status = g.status || "Playing"; // Default status
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
                                <div class="genre-tags">
                                    <span class="genre-tag">${genre}</span>
                                </div>
                                <div class="game-meta">
                                    <span class="game-meta-tag">${year || "-"}</span>
                                    <span class="game-meta-tag">${platform}</span>
                                    <span class="game-meta-tag">$${moneySpent}</span>
                                </div>    
                                <div class="game-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${hoursPlayed || 0}</div>
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
                            </div>
                `;
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

// reviewListings handles fetching and rendering the user's reviews
function reviewListings() {
  const me = {};

  const wrap = document.getElementById("review-section");

  const renderReviews = (reviews) => {
    if (!wrap) return;

    console.log("Rendering reviews:", reviews);
    if (!reviews.length) {
      wrap.innerHTML = "<p>No reviews yet. Add your first here!</p>";
      return;
    }
    wrap.innerHTML = "";
    for (const r of reviews) {
      const MAX_PREVIEW_LENGTH = 200;
      const fullText = r.text || "";
      const isLong = fullText.length > MAX_PREVIEW_LENGTH;
      const shortText = isLong ? fullText.slice(0, MAX_PREVIEW_LENGTH) + "..." : fullText;
      const date = new Date(r.updatedAt).toLocaleDateString();
      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-header">
          <div>
            <h5 class="review-game-title">${r.gameTitle}</h5>
            <div class="review-meta">Reviewed on ${date}</div>
          </div>
          <div class="review-rating-badge">
            <div class="review-rating-value">${r.rating}/5</div>
            <div class="review-rating-label">Rating</div>
          </div>
        </div>
        <p class="review-text mb-1" data-full="${fullText}">${shortText}</p>
        ${isLong ? `<a href="#" class="toggle-review small text-primary" data-expanded="false">Read more</a>` : ""}
        <div class="review-actions">
          <button class="btn-review-action btn-edit-review" data-id="${r._id}" data-text="${fullText}" data-rating="${r.rating}">Edit</button>
          <button class="btn-review-action btn-delete-review" data-id="${r._id}" data-title="${r.gameTitle}">Delete</button>
        </div>
        `;
      wrap.appendChild(card);
    }
  };

  me.refreshReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load reviews");

      const data = await res.json();
      console.log("Fetched reviews:", data);
      const reviews = Array.isArray(data.items) ? data.items : [];
      console.log("Reviews array:", reviews);
      renderReviews(reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      if (wrap) {
        wrap.innerHTML = `<p class="text-danger">Failed to load your reviews. Bummer dude.</p>`;
      }
    }
  };
  return me;
}

// Handle adding a new review
function addReview() {
  const form = document.getElementById("new-review-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const gameId = form.elements["review-game-id"].value;
    const text = form.elements["review-text"].value.trim();
    const rating = form.elements["review-rating"].value;

    if (!gameId || !rating || !text) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId,
          userId,
          rating,
          text,
        }),
      });

      if (!res.ok) throw new Error("Failed to add review");

      const data = await res.json();
      console.log("New review added:", data);
      bootstrap.Modal.getInstance(document.getElementById("add-review-modal")).hide();
      form.reset();
      await myReviews.refreshReviews();
      await myGames.refreshGames();
    } catch (err) {
      console.error("Error adding review:", err);
    }
  });
}

// Handle Review edit button click
document.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".btn-edit-review:not(.btn-delete-review)");
  if (!editBtn) return;

  const reviewId = editBtn.dataset.id;
  const reviewText = editBtn.dataset.text || "";
  const reviewRating = editBtn.dataset.rating || "";

  console.log("Editing review:", reviewId);

  // Fill modal fields directly
  document.getElementById("edit-review-id").value = reviewId;
  document.getElementById("edit-review-text").value = reviewText;
  document.getElementById("edit-review-rating").value = reviewRating;

  const modal = new bootstrap.Modal(document.getElementById("edit-review-modal"));
  modal.show();
});

document.addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".btn-delete-review");
  if (!deleteBtn) return;

  const id = deleteBtn.dataset.id;
  const title = deleteBtn.dataset.title;

  if (!confirm(`Are you sure you want to delete your review for "${title}"?`)) return;

  try {
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to delete review.");

    console.log("Deleted review:", id);
    await myReviews.refreshReviews();
  } catch (err) {
    console.error("Error deleting review:", err);
    alert(err.message);
  }
});

function editReview() {
  const editReviewForm = document.getElementById("edit-review-form");

  editReviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-review-id").value;
    const text = document.getElementById("edit-review-text").value.trim();
    const rating = document.getElementById("edit-review-rating").value;

    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Review updated:", data);
      const modal = bootstrap.Modal.getInstance(document.getElementById("edit-review-modal"));
      if (modal) modal.hide();
      await myReviews.refreshReviews();
      await myGames.refreshGames();
    } else {
      alert(data.error || "Failed to update review.");
    }
  });
}

function reviewAutocomplete() {
  const input = document.getElementById("review-game-title");
  const hiddenInput = document.getElementById("review-game-id");
  const suggestionsBox = document.getElementById("review-suggestions");

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
              <li data-id="${g.id}" class="suggestion-item">${g.title}</li>
            `
          )
          .join("");

        suggestionsBox.querySelectorAll(".suggestion-item").forEach((item) => {
          item.addEventListener("click", () => {
            input.value = item.textContent;
            hiddenInput.value = item.getAttribute("data-id");
            suggestionsBox.innerHTML = "";
          });
        });
      } catch (err) {
        console.error("Error fetching review suggestions:", err);
      }
    }, 300);
  });
}

document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-review");
  if (!toggle) return;
  e.preventDefault();

  const p = toggle.previousElementSibling; // the <p> with class review-text
  const isExpanded = toggle.dataset.expanded === "true";
  const fullText = p.dataset.full;

  if (isExpanded) {
    // Collapse
    p.textContent = fullText.slice(0, 200) + "...";
    toggle.textContent = "Show more";
    toggle.dataset.expanded = "false";
  } else {
    // Expand
    p.textContent = fullText;
    toggle.textContent = "Show less";
    toggle.dataset.expanded = "true";
  }
});

function applyFilters() {
  const search = document.getElementById("search-filter").value.toLowerCase();
  const status = document.getElementById("status-filter").value;
  const genre = document.getElementById("genre-filter").value;
  const sortOption = document.getElementById("sort-filter").value;

  let filtered = myGames.allGames.filter((g) => {
    const matchesSearch = !search || g.gameDetails?.title?.toLowerCase().includes(search);
    const matchesStatus = !status || status === "All Statuses" || g.status === status;
    const matchesGenre = !genre || genre === "All Genres" || g.gameDetails?.genre === genre;
    return matchesSearch && matchesStatus && matchesGenre;
  });

  switch (sortOption) {
    case "Title (A-Z)":
      filtered.sort((a, b) => a.gameDetails.title.localeCompare(b.gameDetails.title));
      break;
    case "Title (Z-A)":
      filtered.sort((a, b) => b.gameDetails.title.localeCompare(a.gameDetails.title));
      break;
    case "Release Date (Newest)":
      filtered.sort((a, b) => (b.gameDetails.year || 0) - (a.gameDetails.year || 0));
      break;
    case "Release Date (Oldest)":
      filtered.sort((a, b) => (a.gameDetails.year || 0) - (b.gameDetails.year || 0));
      break;
    case "Hours Played (High to Low)":
      filtered.sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0));
      break;
    case "Hours Played (Low to High)":
      filtered.sort((a, b) => (a.hoursPlayed || 0) - (b.hoursPlayed || 0));
      break;
    case "Price (High to Low)":
      filtered.sort((a, b) => (b.gameDetails.price || 0) - (a.gameDetails.price || 0));
      break;
    case "Price (Low to High)":
      filtered.sort((a, b) => (a.gameDetails.price || 0) - (b.gameDetails.price || 0));
      break;
  }

  myGames.renderGames(filtered);
}

function resetFilters() {
  // Reset all filter fields to default
  document.getElementById("search-filter").value = "";
  document.getElementById("status-filter").value = "All Statuses";
  document.getElementById("genre-filter").value = "All Genres";
  document.getElementById("sort-filter").value = "Title (A-Z)";

  // Re-render all games
  myGames.renderGames(myGames.allGames);
}

const myGames = gameListings();
const myStats = userStats();
const myReviews = reviewListings();
myGames.refreshGames();
myStats.refreshStats();
myReviews.refreshReviews();
