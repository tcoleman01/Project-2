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
    return { client, games, reviews };
  };

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
      const { ObjectId } = await import("mongodb");
      const byId = ObjectId.isValid(idOrSlug)
        ? await games.findOne({ _id: new ObjectId(idOrSlug) })
        : null;
      const bySlug = byId ? null : await games.findOne({ slug: idOrSlug });
      return byId || bySlug;
    } finally {
      await client.close();
    }
  };

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
      const { ObjectId } = await import("mongodb");
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

  // === reviews collection ===
  // me.getReviews = async (gameId) => {
  //   const { client, reviews } = (connect)();
  //   try {
  //     const query = {};
  //     if (gameId) query.gameId = new ObjectId(gameId);
  //     return await reviews.find(query).sort({ createdAt: -1 }).toArray();
  //   } finally { await client.close();}
  // };

  me.getReviews = async ({ gameId, userId, pageSize = 20, page = 0 } = {}) => {
    const { client, reviews } = connect();

    const query = {};
    if (gameId) query.gameId = new ObjectId(gameId);
    if (userId) query.userId = new ObjectId(userId);

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
      const { ObjectId } = await import("mongodb");
      const r = await reviews.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0;
    } finally {
      await client.close();
    }
  };

  me.addGameToUser = async (userId, gameId) => {
    // Placeholder function for adding a game to a user's collection
    return true;
  };

  me.deleteGameFromUser = async (userId, gameId) => {
    // Placeholder function for removing a game from a user's collection
    return true;
  };

  me.getUserGames = async (userId) => {
    // Placeholder function for retrieving all games in a user's collection
    return [];
  };

  me.updateUserGame = async (userId, gameId, updates) => {
    // Placeholder function for updating details of a game in a user's collection
    return true;
  };

  return me;
}

const myMongoDB = MyMongoDB();
export default myMongoDB;
