import { MongoClient, ObjectId } from "mongodb";

function MyMongoDB({
  dbName = "videogameTracker",
  gameCollection = "mock_games",
  reviewCollection = "mock_reviews", //change to actual collection name later
  userGameCollection = "mock_user_games",
  defaultUri = process.env.MONGODB_URI || "mongodb://localhost:27017",
} = {}) {
  const me = {};
  const URI = defaultUri;

  const connect = () => {
    console.log("Connecting to MongoDB at...", URI);
    const client = new MongoClient(URI);
    const games = client.db(dbName).collection(gameCollection);
    const reviews = client.db(dbName).collection(reviewCollection);
    const userGames = client.db(dbName).collection(userGameCollection);
    return { client, games, reviews, userGames };
  };

  // =============== Master games collection CRUD ===============
  me.getAllGames = async ({ query = {}, pageSize = 20, page = 0 } = {}) => {
    const { client, games } = connect();

    try {
      const data = await games
        .find(query)
        .limit(pageSize)
        .skip(pageSize * page)
        .toArray();
      return data;
    } catch (err) {
      console.error("Error fetching games from MongoDB", err);
      throw err;
    } finally {
      await client.close();
    }
  };
  // === game detail + CRUD ===
  me.getGameByIdOrSlug = async (idOrSlug) => {
    const { client, games } = connect();
    try {
      const byId = ObjectId.isValid(idOrSlug)
        ? await games.findOne({ _id: new ObjectId(idOrSlug) })
        : null;
      const bySlug = byId ? null : await games.findOne({ slug: idOrSlug });
      return byId || bySlug;
    } finally {
      await client.close();
    }
  };

  // Create a new game document and add it to the master games collection
  me.createGame = async (doc) => {
    const { client, games } = connect();
    try {
      await games.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
      const r = await games.insertOne(doc);
      return await games.findOne({ _id: r.insertedId });
    } finally {
      await client.close();
    }
  };

  me.updateGameById = async (id, updates) => {
    const { client, games } = connect();
    try {
      updates.updatedAt = new Date();
      await games.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return await games.findOne({ _id: new ObjectId(id) });
    } finally {
      await client.close();
    }
  };

  me.deleteGameById = async (id) => {
    const { client, games } = connect();
    try {
      const { ObjectId } = await import("mongodb");
      const r = await games.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0;
    } finally {
      await client.close();
    }
  };

  // =============== Reviews collection CRUD ===============
  me.getReviews = async ({ gameId, userId, pageSize = 20, page = 0 } = {}) => {
    const { client, reviews } = connect();

    const query = {};
    if (gameId) {
      query.gameId = new ObjectId(gameId);
    }

    if (userId) {
      query.userId = new ObjectId(userId);
    }

    try {
      const data = await reviews
        .find(query)
        .limit(pageSize)
        .skip(pageSize * page)
        .toArray();
      return data;
    } catch (err) {
      console.error("Error fetching reviews from MongoDB", err);
      throw err;
    } finally {
      await client.close();
    }
  };

  //UPDATE - MOVE DOC ELEMENTS TO ROUTES
  me.createReview = async (gameId, { rating, text = "" }) => {
    const { client, reviews } = connect();
    try {
      const doc = {
        gameId: new ObjectId(gameId),
        userId: null,
        rating: Number(rating),
        text: String(text).trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const r = await reviews.insertOne(doc);
      return await reviews.findOne({ _id: r.insertedId });
    } finally {
      await client.close();
    }
  };

  //UPDATE AND FIX
  me.updateReviewById = async (id, updates) => {
    const { client, games } = connect();
    try {
      const reviews = games.db.collection("reviews");
      const { ObjectId } = await import("mongodb");
      updates.updatedAt = new Date();
      await reviews.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return await reviews.findOne({ _id: new ObjectId(id) });
    } finally {
      await client.close();
    }
  };

  me.deleteReviewById = async (id) => {
    const { client, games } = connect();
    try {
      const reviews = games.db.collection("reviews");
      const r = await reviews.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0;
    } finally {
      await client.close();
    }
  };

  // Helper to convert various id formats to ObjectId
  const toObjectId = (id) => {
    if (!id) return null;
    try {
      if (id instanceof ObjectId) return id;
      if (typeof id === "string" && id.length === 24) return new ObjectId(id);
      // handle odd cases like { $oid: "..." }
      if (typeof id === "object" && id.$oid && typeof id.$oid === "string")
        return new ObjectId(id.$oid);
      throw new Error(`Invalid ObjectId format: ${JSON.stringify(id)}`);
    } catch (err) {
      console.error("toObjectId failed:", id, err);
      throw err;
    }
  };

  // ============== User games collection CRUD ===============
  // Add a game to a user's list/profile
  me.addUserGame = async ({ userId, gameId, status, hoursPlayed, moneySpent }) => {
    const { client, userGames } = connect();

    try {
      await userGames.createIndex({ userId: 1, gameId: 1 }, { unique: true });
      const parsedUserId = toObjectId(userId);
      const parsedGameId = toObjectId(gameId);
      if (!parsedUserId || !parsedGameId)
        throw new Error("Invalid userId or gameId format. Must be ObjectId or 24-char hex string.");

      const doc = {
        userId: parsedUserId,
        gameId: parsedGameId,
        status,
        hoursPlayed,
        moneySpent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const r = await userGames.insertOne(doc);
      return { _id: r.insertedId, ...doc };
    } finally {
      await client.close();
    }
  };

  // Update a userGame entry by its ID. Only status, hoursPlayed,
  // and price, and personalNotes fields will be updated.
  me.updateUserGame = async (id, updates) => {
    const { client, userGames } = connect();

    try {
      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch {
        query = { _id: id }; // fallback if id isn’t a valid ObjectId
      }

      console.log("🕵️ updateUserGame query:", query);
      const result = await userGames.findOneAndUpdate(
        query,
        { $set: updates },
        { returnDocument: "after" }
      );

      console.log("🕵️ findOneAndUpdate raw result:", result); // Debug log

      return result;
    } finally {
      await client.close();
    }
  };

  // Delete a userGame entry by its objectId
  me.deleteUserGame = async (id) => {
    const { client, userGames } = connect();

    try {
      const r = await userGames.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0; // Return true if a document was deleted
    } finally {
      await client.close();
    }
  };

  // Fetch all games in a user's list/profile, including game details
  // and community review stats (count and average rating)
  me.getUserGames = async (id) => {
    const { client } = connect();
    const db = client.db(dbName);
    const userGames = db.collection(userGameCollection);

    try {
      // Safely use configured names
      const gamesColName = gameCollection;
      const reviewsColName = reviewCollection;

      const pipeline = [
        // Only games for this user
        { $match: { userId: new ObjectId(id) } },

        // Join with the games collection for metadata
        {
          $lookup: {
            from: gamesColName,
            localField: "gameId",
            foreignField: "_id",
            as: "gameDetails",
          },
        },
        { $unwind: { path: "$gameDetails", preserveNullAndEmptyArrays: true } },

        // Join with reviews to get user's own rating/review
        {
          $lookup: {
            from: reviewsColName,
            let: { gId: "$gameId", uId: "$userId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ["$gameId", "$$gId"] }, { $eq: ["$userId", "$$uId"] }],
                  },
                },
              },
            ],
            as: "userReview",
          },
        },
        { $unwind: { path: "$userReview", preserveNullAndEmptyArrays: true } },

        // Join again with reviews to calculate community stats
        {
          $lookup: {
            from: reviewsColName,
            localField: "gameId",
            foreignField: "gameId",
            as: "allReviews",
          },
        },

        // Add computed fields for community stats
        {
          $addFields: {
            communityReviewCount: { $size: "$allReviews" },
            communityAvgRating: { $avg: "$allReviews.rating" },
          },
        },

        // Clean up and sort
        { $project: { allReviews: 0 } },
        { $sort: { updatedAt: -1 } },
      ];

      const data = await userGames.aggregate(pipeline).toArray();
      return data;
    } finally {
      await client.close();
    }
  };

  // Get summary stats for a user's game list/profile.
  // To add additional stats, modify the $group section.
  me.getUserGameStats = async (userId) => {
    const { client, userGames } = connect();

    try {
      const pipeline = [
        { $match: { userId: new ObjectId(userId) } },
        {
          $lookup: {
            from: gameCollection,
            localField: "gameId",
            foreignField: "_id",
            as: "gameDetails",
          },
        },
        { $unwind: "$gameDetails" },

        // Add price field so we can sum up total amount spent
        {
          $addFields: {
            price: { $ifNull: ["$price", 0] },
            hoursPlayed: { $ifNull: ["$hoursPlayed", 0] },
          },
        },

        {
          $group: {
            _id: "$userId",
            totalGames: { $sum: 1 },
            totalCompleted: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
            totalBacklog: { $sum: { $cond: [{ $eq: ["$status", "Backlog"] }, 1, 0] } },
            totalWishlist: { $sum: { $cond: [{ $eq: ["$status", "Wishlist"] }, 1, 0] } },
            totalPlaying: { $sum: { $cond: [{ $eq: ["$status", "Playing"] }, 1, 0] } },
            totalHours: { $sum: "$hoursPlayed" },
            totalSpent: { $sum: "$moneySpent" },
          },
        },
        {
          $project: {
            _id: 0,
            userId: "$_id",
            totalGames: 1,
            totalCompleted: 1,
            totalBacklog: 1,
            totalWishlist: 1,
            totalPlaying: 1,
            totalHours: 1,
            totalSpent: 1,
          },
        },
      ];

      const result = await userGames.aggregate(pipeline).toArray();
      // Return a single stats object instead of an array, even if empty
      return (
        result[0] || {
          userId,
          totalGames: 0,
          totalCompleted: 0,
          totalBacklog: 0,
          totalWishlist: 0,
          totalPlaying: 0,
          totalHours: 0,
          totalSpent: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching user game stats:", error);
      throw error;
    } finally {
      await client.close();
    }
  };

  return me;
}

const myMongoDB = MyMongoDB();
export default myMongoDB;
