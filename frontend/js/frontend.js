console.log("This is the frontend JavaScript file.");

function Games() {
  const me = {};

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
    const gamesDiv = document.getElementById("game-list");
    for (const { title, platform, genre, price } of games) {
      const card = document.createElement("div");
      card.className = "card game-card mb-3";
      card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text">Genre: ${genre}</p>
                    <p class="card-text">Platform:${platform}</p>
                    <p class="card-text">Price:${price}</p>
                </div>
                `;
      gamesDiv.appendChild(card);
    }
  };

  me.refreshGames = async () => {
    const res = await fetch("/api/games");
    if (!res.ok) {
      console.error("Failed to fetch games", res.status, res.statusText);
      me.showError({ msg: "Failed to fetch games", res });
      return;
    }

    const data = await res.json();
    console.log("Fetched games:", data);

    const gamesDiv = document.getElementById("game-list");
    gamesDiv.innerHTML = ""; // Clear existing games

    renderGames(data.games);
  };
  return me;
}

const myGames = Games();
myGames.refreshGames();
