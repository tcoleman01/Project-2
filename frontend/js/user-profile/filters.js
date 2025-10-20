export function applyFilters() {
  const search = document.getElementById("search-filter").value.toLowerCase();
  const status = document.getElementById("status-filter").value;
  const genre = document.getElementById("genre-filter").value;
  const sortOption = document.getElementById("sort-filter").value;

  // Ensure myGames is loaded
  if (!window.myGames || !Array.isArray(window.myGames.allGames)) {
    console.warn("myGames not initialized yet");
    return;
  }

  let filtered = window.myGames.allGames.filter((g) => {
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

  window.myGames.renderGames(filtered);
}

export function resetFilters() {
  document.getElementById("search-filter").value = "";
  document.getElementById("status-filter").value = "All Statuses";
  document.getElementById("genre-filter").value = "All Genres";
  document.getElementById("sort-filter").value = "Title (A-Z)";

  if (window.myGames) {
    window.myGames.renderGames(window.myGames.allGames);
  }
}
