import express from "express";
import MyDB from "../db/MyMongoDB.js";
import { slugify } from "./utils/slugify.js";

const router = express.Router();

router.get("/games", async (req, res) => {
  console.log("GET all /games");
  try {
    const games = await MyDB.getAllGames(); // Fetch all games from DB
    res.json({games});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", games: [] });
  }
});

router.get("/games/:idOrSlug", async (req, res) => {
  try {
    const game = await MyDB.getGameByIdOrSlug(req.params.idOrSlug);
    if (!game) return res.status(404).json({ error: "Game not found" });
    const reviews = await MyDB.getReviewsByGame(game._id.toString());
    const count = reviews.length;
    const avgRating = count ? reviews.reduce((a, r) => a + Number(r.rating || 0), 0) / count : null;
    res.json({ game, community: { count, avgRating } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

router.post("/games", async (req, res) => {
  try {
    const { title, platform, year, price, genre, status, hours, coverUrl, description } = req.body || {};
    if (!title || !platform) return res.status(400).json({ error: "title and platform are required" });
    const doc = { title, slug: slugify(title), platform,
      year: year ? Number(year) : undefined, price: price ? Number(price) : undefined,
      genre: genre || undefined, status: status || undefined, hours: hours ? Number(hours) : undefined,
      coverUrl: coverUrl || "", description: description || "" };
    const game = await MyDB.createGame(doc);
    res.status(201).json({ ok: true, game });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate title/slug" });
    console.error(e); res.status(500).json({ error: "Server error" });
  }
});

router.patch("/games/:id", async (req, res) => {
  try {
    const allowed = ["title","platform","year","price","genre","status","hours","coverUrl","description"];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    if ("title" in updates) updates.slug = slugify(updates.title);
    if ("year" in updates) updates.year = Number(updates.year);
    if ("price" in updates) updates.price = Number(updates.price);
    if ("hours" in updates) updates.hours = Number(updates.hours);
    const game = await MyDB.updateGameById(req.params.id, updates);
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json({ ok: true, game });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate title/slug" });
    console.error(e); res.status(500).json({ error: "Server error" });
  }
});

router.delete("/games/:id", async (req, res) => {
  try {
    const ok = await MyDB.deleteGameById(req.params.id);
    if (!ok) return res.status(404).json({ error: "Game not found" });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

// Reviews
router.get("/games/:gameId/reviews", async (req, res) => {
  try { const items = await MyDB.getReviewsByGame(req.params.gameId); res.json({ items }); }
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
  } catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

router.delete("/reviews/:id", async (req, res) => {
  try {
    const ok = await MyDB.deleteReviewById(req.params.id);
    if (!ok) return res.status(404).json({ error: "Review not found" });
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "Server error" }); }
});

export default router;
