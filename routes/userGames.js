import express from "express";
import MyDB from "../db/MyMongoDB.js";

const router = express.Router();

router.get("/userGames", async (req, res) => {
  console.log("GET all /userGames");
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const games = await MyDB.getUserGames(userId); // Fetch all games from DB
    res.json({ games });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", games: [] });
  }
});

router.post("/userGames", async (req, res) => {
  console.log("Received POST request for api/userGames");

  try {
    const { userId, gameId, status = "Backlog", hoursPlayed = 0, personalNotes = "" } = req.body;
    if (!userId || !gameId)
      return res.status(400).json({ error: "userId and gameId are required" });
    const game = await MyDB.createUserGame({ userId, gameId, status, hoursPlayed, personalNotes });
    res.status(201).json({ ok: true, game });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate entry" });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/userGames/:id", async (req, res) => {
  console.log("Received PATCH request for api/userGames/:id");

  try {
    const item = await MyDB.updateUserGame(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "User game not found" });
    res.json({ ok: true, item });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/userGames/:id", async (req, res) => {
  console.log("Received DELETE request for api/userGames/:id");

  try {
    const ok = await MyDB.deleteUserGame(req.params.id);
    if (!ok) return res.status(404).json({ error: "User game not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
