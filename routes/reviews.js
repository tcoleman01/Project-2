import express from "express";
import MyDB from "../db/MyMongoDB.js";

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
    res.status(500).json({ error: "Server error" });
  }
});

// POST to create a new review for a specific game
router.post("/reviews", async (req, res) => {
  console.log("Received POST request for api/reviews");

  try {
    const rating = Number(req.body?.rating);
    if (!(rating >= 1 && rating <= 5))
      return res.status(400).json({ error: "rating must be 1..5" });
    const review = await MyDB.createReview(req.params.gameId, { rating, text: req.body?.text });
    res.status(201).json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH to update an existing review by its ID
router.patch("/reviews/:id", async (req, res) => {
  try {
    const updates = {};
    if ("rating" in req.body) {
      const r = Number(req.body.rating);
      if (!(r >= 1 && r <= 5)) return res.status(400).json({ error: "rating must be 1..5" });
      updates.rating = r;
    }
    if ("text" in req.body) updates.text = String(req.body.text ?? "").trim();
    if (!Object.keys(updates).length) return res.status(400).json({ error: "No valid fields" });
    const review = await MyDB.updateReviewById(req.params.id, updates);
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a review by its ID
router.delete("/reviews/:id", async (req, res) => {
  try {
    const ok = await MyDB.deleteReviewById(req.params.id);
    if (!ok) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
