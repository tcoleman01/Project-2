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
                                    <button class="btn-card-action">Edit</button>
                                    <button class="btn-card-action btn-delete">Delete</button>
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

      renderGames(data.games);
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

      const stats = data.stats?.[0] || {};
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

const myGames = Games();
myGames.refreshGames();
myGames.refreshStats();
