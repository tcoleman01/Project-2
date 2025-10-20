import { addGames, editGames, initGameModals, gameListings } from "./games.js";
import { userStats } from "./stats.js";
import { reviewListings, addReview, editReview, initReviewModals } from "./reviews.js";
import { applyFilters, resetFilters } from "./filters.js";

export const userId = "200000000000000000000001";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("main.js loaded");

  const myGames = await gameListings();
  const myStats = await userStats();
  const myReviews = await reviewListings();

  window.myGames = myGames;
  window.myStats = myStats;
  window.myReviews = myReviews;

  window.myGames = myGames;
  window.myStats = myStats;
  window.myReviews = myReviews;

  initGameModals();
  initReviewModals();
  addGames();
  editGames();
  addReview();
  editReview();

  // Filter handlers
  document.getElementById("search-filter")?.addEventListener("input", applyFilters);
  document.getElementById("status-filter")?.addEventListener("change", applyFilters);
  document.getElementById("genre-filter")?.addEventListener("change", applyFilters);
  document.getElementById("sort-filter")?.addEventListener("change", applyFilters);
  document.getElementById("reset-filters")?.addEventListener("click", resetFilters);

  // Load data
  myGames.refreshGames();
  myStats.refreshStats();
  myReviews.refreshReviews();
});
