import express from "express";
import MyDB from "../db/MyMongoDB.js";
import { slugify } from "./utils/slugify.js";

const router = express.Router();

// GET autocomplete suggestions for game titles
router.get("/games/autocomplete", async (req, res) => {
  const query = req.query.query || "";
  const results = await MyDB.autocompleteGameTitles(query, 10);
  res.json(results.map((g) => ({ id: g._id, title: g.title })));
});

// GET all games in the games collection
router.get("/games", async (req, res) => {
  console.log("GET /games", req.query);
  try {
    const q = String(req.query.q || "").trim();
    let query = {};
    if (q) {
      // simple text search on title (case-insensitive substring)
      query = { title: { $regex: q, $options: "i" } };
    }
    const games = await MyDB.getAllGames({ query, pageSize: 50, page: 0 }); // limit results
    res.json({ games });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", games: [] });
  }
});

// GET a specific game by its ID or slug, along with community review stats
router.get("/games/:idOrSlug", async (req, res) => {
  try {
    const game = await MyDB.getGameByIdOrSlug(req.params.idOrSlug);
    if (!game) return res.status(404).json({ error: "Game not found" });
    const reviews = await MyDB.getReviews(game._id.toString());
    const count = reviews.length;
    const avgRating = count ? reviews.reduce((a, r) => a + Number(r.rating || 0), 0) / count : null;
    res.json({ game, community: { count, avgRating } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST to add a new game to the games collection
router.post("/games", async (req, res) => {
  try {
    const { title, platform, year, price, genre, status, coverUrl, description } = req.body || {};
    if (!title || !platform)
      return res.status(400).json({ error: "title and platform are required" });
    const doc = {
      title,
      slug: slugify(title),
      platform,
      year: year ? Number(year) : undefined,
      price: price ? Number(price) : undefined,
      genre: genre || undefined,
      status: status || undefined,
      coverUrl: coverUrl || "",
      description: description || "",
    };
    const game = await MyDB.createGame(doc);
    res.status(201).json({ ok: true, game });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate title/slug" });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH to update an existing game by its ID
router.patch("/games/:id", async (req, res) => {
  try {
    const allowed = [
      "title",
      "platform",
      "year",
      "price",
      "genre",
      "status",
      "coverUrl",
      "description",
    ];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    if ("title" in updates) updates.slug = slugify(updates.title);
    if ("year" in updates) updates.year = Number(updates.year);
    if ("price" in updates) updates.price = Number(updates.price);
    const game = await MyDB.updateGameById(req.params.id, updates);
    if (!game) return res.status(404).json({ error: "Game not found" });
    res.json({ ok: true, game });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate title/slug" });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a game by its ID
router.delete("/games/:id", async (req, res) => {
  try {
    const ok = await MyDB.deleteGameById(req.params.id);
    if (!ok) return res.status(404).json({ error: "Game not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
