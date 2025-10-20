/* global bootstrap */

import { userId } from "./main.js";

export function reviewAutocomplete() {
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

export function initReviewModals() {
  const addReviewModalEl = document.getElementById("add-review-modal");

  if (addReviewModalEl) {
    // When modal is shown
    addReviewModalEl.addEventListener("shown.bs.modal", () => {
      reviewAutocomplete();
      addReview();
    });

    // When modal is hidden
    addReviewModalEl.addEventListener("hidden.bs.modal", () => {
      const form = document.getElementById("new-review-form");
      if (form) form.reset();

      const hiddenInput = document.getElementById("review-game-id");
      const suggestions = document.getElementById("review-suggestions");
      if (hiddenInput) hiddenInput.value = "";
      if (suggestions) suggestions.innerHTML = "";
    });
  }
}

export async function reviewListings() {
  const me = {};
  const wrap = document.getElementById("review-section");

  const renderReviews = (reviews) => {
    if (!wrap) return;
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
        ${
          isLong
            ? `<a href="#" class="toggle-review small text-primary" data-expanded="false">Read more</a>`
            : ""
        }
        <div class="review-actions">
          <button class="btn-review-action btn-edit-review" 
                  data-id="${r._id}" 
                  data-text="${fullText}" 
                  data-rating="${r.rating}">
            Edit
          </button>
          <button class="btn-review-action btn-delete-review" 
                  data-id="${r._id}" 
                  data-title="${r.gameTitle}">
            Delete
          </button>
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
      const reviews = Array.isArray(data.items) ? data.items : [];
      renderReviews(reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      wrap.innerHTML = `<p class="text-danger">Failed to load your reviews.</p>`;
    }
  };

  return me;
}

export const myReviews = reviewListings();

// --- Add new review ---
export async function addReview() {
  const form = document.getElementById("new-review-form");
  if (!form) return;
  if (form.dataset.listenerAttached === "true") return;
  form.dataset.listenerAttached = "true";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, userId, rating, text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add review.");

      console.log("New review added:", data);
      bootstrap.Modal.getInstance(document.getElementById("add-review-modal")).hide();
      form.reset();
      await window.myReviews.refreshReviews();
      await window.myGames.refreshGames();
    } catch (err) {
      console.error("Error adding review:", err);
      alert(err.message);
    }
  });
}

// --- Edit existing review ---
export async function editReview() {
  const form = document.getElementById("edit-review-form");
  if (!form) return;

  // Handle opening edit modal
  document.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".btn-edit-review");
    if (!editBtn) return;

    const reviewId = editBtn.dataset.id;
    const reviewText = editBtn.dataset.text || "";
    const reviewRating = editBtn.dataset.rating || "";

    document.getElementById("edit-review-id").value = reviewId;
    document.getElementById("edit-review-text").value = reviewText;
    document.getElementById("edit-review-rating").value = reviewRating;

    const modal = new bootstrap.Modal(document.getElementById("edit-review-modal"));
    modal.show();
  });

  // Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-review-id").value;
    const text = document.getElementById("edit-review-text").value.trim();
    const rating = document.getElementById("edit-review-rating").value;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update review.");

      console.log("Review updated:", data);
      bootstrap.Modal.getInstance(document.getElementById("edit-review-modal")).hide();
      await window.myReviews.refreshReviews();
      await window.myGames.refreshGames();
    } catch (err) {
      console.error("Error updating review:", err);
      alert(err.message);
    }
  });
}

// --- Delete review ---
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
    await window.myReviews.refreshReviews();
  } catch (err) {
    console.error("Error deleting review:", err);
    alert(err.message);
  }
});

// --- Expand/Collapse review text ---
document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-review");
  if (!toggle) return;
  e.preventDefault();

  const p = toggle.previousElementSibling;
  const isExpanded = toggle.dataset.expanded === "true";
  const fullText = p.dataset.full;

  if (isExpanded) {
    p.textContent = fullText.slice(0, 200) + "...";
    toggle.textContent = "Show more";
    toggle.dataset.expanded = "false";
  } else {
    p.textContent = fullText;
    toggle.textContent = "Show less";
    toggle.dataset.expanded = "true";
  }
});
