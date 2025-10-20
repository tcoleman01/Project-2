import { ObjectId } from "mongodb";
import { connect, toObjectId } from "./index.js";

const COLLECTION = "user_games";
const gameCollection = "games";
const reviewCollection = "reviews";

// Add a new userGame entry - used when a user adds a game to their collection
export async function addUserGame({ userId, gameId, status, hoursPlayed, moneySpent }) {
  const { client, db } = connect();

  try {
    const userGames = db.collection(COLLECTION);

    await userGames.createIndex({ userId: 1, gameId: 1 }, { unique: true });
    const parsedUserId = toObjectId(userId);
    const parsedGameId = toObjectId(gameId);
    if (!parsedUserId || !parsedGameId)
      throw new Error("Invalid userId or gameId format. Must be ObjectId or 24-char hex string.");

    const doc = {
      userId: parsedUserId,
      gameId: parsedGameId,
      status,
      hoursPlayed: Number(hoursPlayed),
      moneySpent: Number(moneySpent),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const r = await userGames.insertOne(doc);
    return { _id: r.insertedId, ...doc };
  } finally {
    await client.close();
  }
}

// Update a userGame entry by its objectId
export async function updateUserGame(id, updates) {
  const { client, db } = connect();

  try {
    const userGames = db.collection(COLLECTION);
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      query = { _id: id }; // fallback if id isn’t a valid ObjectId
    }

    const result = await userGames.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: "after" }
    );

    return result;
  } finally {
    await client.close();
  }
}

// Delete a userGame entry by its objectId
export async function deleteUserGame(id) {
  const { client, db } = connect();

  try {
    const userGames = db.collection(COLLECTION);
    const r = await userGames.deleteOne({ _id: new ObjectId(id) });
    return r.deletedCount > 0; // Return true if a document was deleted
  } finally {
    await client.close();
  }
}

// Get all userGames for a given userId, along with game metadata and review stats
export async function getUserGames(id) {
  const { client, db } = connect();

  try {
    const userGames = db.collection(COLLECTION);

    const pipeline = [
      // Only games for this user
      { $match: { userId: new ObjectId(id) } },

      // Join with the games collection for metadata
      {
        $lookup: {
          from: gameCollection,
          localField: "gameId",
          foreignField: "_id",
          as: "gameDetails",
        },
      },
      { $unwind: { path: "$gameDetails", preserveNullAndEmptyArrays: true } },

      // Join with reviews to get user's own rating/review
      {
        $lookup: {
          from: reviewCollection,
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
          from: reviewCollection,
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
      {
        $project: {
          allReviews: 0,
        },
      },
      { $sort: { updatedAt: -1 } },
    ];

    const data = await userGames.aggregate(pipeline).toArray();
    return data;
  } finally {
    await client.close();
  }
}

// Get aggregated stats for a user's game collection
export async function getUserGameStats(userId) {
  const { client, db } = connect();
  const userGames = db.collection(COLLECTION);

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
}
