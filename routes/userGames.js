import express from "express";
import MyDB from "../db/MyMongoDB.js";

const router = express.Router();

// GET a users dashboard stats
router.get("/userGames/stats", async (req, res) => {
  console.log("GET user game stats");

  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const stats = await MyDB.getUserGameStats(userId);
    res.json({ stats });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", stats: {} });
  }
});

// GET all games in the userGames collection for a specific user
router.get("/userGames", async (req, res) => {
  console.log("GET all /userGames");

  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const games = await MyDB.getUserGames(userId); // Fetch all games from DB
    res.json({ games });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", games: [] });
  }
});

// POST to add an entry in the userGames collection for a specific user
router.post("/userGames", async (req, res) => {
  console.log("Received POST request for api/userGames");

  try {
    const { userId, gameId, status, price, hoursPlayed, personalNotes } = req.body;
    if (!userId || !gameId)
      return res.status(400).json({ error: "userId and gameId are required" });

    // Validate and sanitize inputs
    const validStatuses = ["Playing", "Completed", "Backlog", "Wishlist"];
    const goodStatus = validStatuses.includes(status) ? status : "Backlog";
    const goodHours =
      isFinite(Number(hoursPlayed)) && Number(hoursPlayed) >= 0 ? Number(hoursPlayed) : 0;
    const notes = personalNotes ? String(personalNotes).trim() : "";
    const goodPrice = isFinite(Number(price)) && Number(price) >= 0 ? Number(price) : 0;

    // Check if the game exists
    const game = await MyDB.getGameByIdOrSlug(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    // Add the game to the user's collection
    const newUserGame = await MyDB.addUserGame({
      userId,
      gameId,
      status: goodStatus,
      price: goodPrice,
      hoursPlayed: goodHours,
      personalNotes: notes,
    });
    res.status(201).json({ ok: true, newUserGame });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ error: "This game is already in your library" });
    console.error(e);
    res.status(500).json({ error: "Server error adding game to user profile" });
  }
});

// PATCH to update details of a game in user's list/profile. For now, only status,
// hoursPlayed, and personalNotes can be updated.
router.patch("/userGames/:id", async (req, res) => {
  console.log("Received PATCH request for api/userGames/:id");

  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Valid userGame ID is required" });

    const { status, hoursPlayed, personalNotes } = req.body;
    const updates = {};

    // Validate and sanitize our inputs
    if (status !== undefined) {
      const validStatuses = ["Playing", "Completed", "Backlog", "Wishlist"];
      if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status value" });

      if (status) updates.status = status;
    }
    if (hoursPlayed !== undefined) {
      const hours = Number(hoursPlayed);
      if (isNaN(hours) || hours < 0)
        return res.status(400).json({ error: "hoursPlayed must be a non-negative number" });
    }
    updates.hoursPlayed = hoursPlayed;
    if (personalNotes) updates.personalNotes = String(personalNotes).trim();

    // Once everythin checks out, update the userGame entry
    const updatedUserGame = await MyDB.updateUserGame(id, updates);
    if (!updatedUserGame) return res.status(404).json({ error: "User game not found" });

    res.json({ ok: true, updatedUserGame });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a userGame entry by its id
router.delete("/userGames/:id", async (req, res) => {
  console.log("Received DELETE request for api/userGames/:id");

  try {
    const ok = await MyDB.deleteUserGame(req.params.id);
    if (!ok) return res.status(404).json({ error: "User game not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error deleting game from user profile" });
  }
});

export default router;
