import express from "express";
import MyDB from "../db/MyMongoDB.js";
import { slugify } from "./utils/slugify.js";

const router = express.Router();

router.get("/reviews", async (req, res) => {
    console.log("GET all /reviews");
  try { const items = await MyDB.getReviews(req.query); res.json({ items }); }
  catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

router.post("/games/:gameId/reviews", async (req, res) => {
  try {
    const rating = Number(req.body?.rating);
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ error: "rating must be 1..5" });
    const review = await MyDB.createReview(req.params.gameId, { rating, text: req.body?.text });
    res.status(201).json({ ok: true, review });
  } catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

export default router;