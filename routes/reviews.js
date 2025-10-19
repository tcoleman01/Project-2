import express from "express";
//import MyDB from "../db/MyMongoDB.js";
import * as MyDB from "../db/reviewsDB.js";
import { getGameByIdOrSlug } from "../db/gamesDB.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// GET all reviews, optionally filtered by userId and/or gameId
router.get("/reviews", async (req, res) => {
  console.log("GET /reviews");
  try {
    const { userId, gameId } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (gameId) filter.gameId = gameId;
    const items = await MyDB.getReviews(filter);
    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error occurred while fetching reviews" });
  }
});

// POST to create a new review for a specific game
router.post("/reviews", async (req, res) => {
  console.log("Received POST request for api/reviews");

  try {
    const { gameId, userId, rating, text } = req.body;
    if (!gameId || !userId)
      return res.status(400).json({ error: "gameId and userId are required" });

    // Check if the game exists
    const game = await getGameByIdOrSlug(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    // Check if the user has already reviewed this game
    const existing = await MyDB.getReviews({ userId, gameId });
    if (existing.length > 0)
      return res.status(409).json({ error: "You already reviewed this game" });

    const r = Number(rating);
    if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: "rating must be 1..5" });

    const newReview = {
      gameId: new ObjectId(game._id),
      userId: new ObjectId(userId),
      gameTitle: game.title,
      rating: r,
      text: text?.trim() || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const review = await MyDB.createReview(newReview);
    res.json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error occurred while creating review" });
  }
});

// PATCH to update an existing review by its ID
router.patch("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;
    const update = {};

    if (!id) return res.status(400).json({ error: "Valid review ID is required" });
    const r = Number(rating);
    if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: "rating must be between 1..5" });
    update.rating = r;
    update.text = text?.trim() || "";
    update.updatedAt = new Date();

    const review = await MyDB.updateReviewById(id, update);
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error occurred while updating review" });
  }
});

// DELETE a review by its ID
router.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Valid review ID is required" });

    const deleted = await MyDB.deleteReviewById(id);
    if (!deleted) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true, message: "Review deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error occurred while deleting review" });
  }
});

export default router;
