import express from "express";
import MyDB from "../db/MyMongoDB.js";

const router = express.Router();

// ==== Route to handle the Master Games Collection - all games in the database ====
router.get("/games", async (req, res) => {
  console.log("🏡 Received request for /api/games");

  try {
    const games = await MyDB.getAllGames();
    res.json({
      games,
    });
  } catch (error) {
    console.error("Error retrieving games:", error);
    res.status(500).json({ error: "Internal Server Error", games: [] });
  }
});

export default router;
