import { MongoClient } from "mongodb";

function MyMongoDB({
  dbName = "videogameTracker",
  collection_Name = "mock_games",
  defaultUri = "mongodb://localhost:27017",
} = {}) {
  const me = {};
  const URI = process.env.MONGODB_URI || defaultUri;

  const connect = () => {
    console.log("Connecting to MongoDB at...", URI);
    const client = new MongoClient(URI);
    const games = client.db(dbName).collection(collection_Name);
    return { client, games };
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
    const { client, games } = (connect)();
    try {
      const { ObjectId } = await import("mongodb");
      const byId = ObjectId.isValid(idOrSlug)
        ? await games.findOne({ _id: new ObjectId(idOrSlug) })
        : null;
      const bySlug = byId ? null : await games.findOne({ slug: idOrSlug });
      return byId || bySlug;
    } finally { await client.close(); }
  };

  me.createGame = async (doc) => {
    const { client, games } = (connect)();
    try {
      await games.createIndex({ slug: 1 }, { unique: true }).catch(() => {});
      doc.createdAt = new Date(); doc.updatedAt = new Date();
      const r = await games.insertOne(doc);
      return await games.findOne({ _id: r.insertedId });
    } finally { await client.close(); }
  };

  me.updateGameById = async (id, updates) => {
    const { client, games } = (connect)();
    try {
      const { ObjectId } = await import("mongodb");
      updates.updatedAt = new Date();
      await games.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return await games.findOne({ _id: new ObjectId(id) });
    } finally { await client.close(); }
  };

  me.deleteGameById = async (id) => {
    const { client, games } = (connect)();
    try {
      const { ObjectId } = await import("mongodb");
      const r = await games.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0;
    } finally { await client.close(); }
  };

  // === reviews collection ===
  me.getReviewsByGame = async (gameId) => {
    const { client, games } = (connect)();
    try {
      const reviews = games.db.collection("reviews");
      const { ObjectId } = await import("mongodb");
      await reviews.createIndex({ gameId: 1 }).catch(() => {});
      return await reviews.find({ gameId: new ObjectId(gameId) }).sort({ createdAt: -1 }).toArray();
    } finally { await client.close(); }
  };

  me.createReview = async (gameId, { rating, text = "" }) => {
    const { client, games } = (connect)();
    try {
      const reviews = games.db.collection("reviews");
      const { ObjectId } = await import("mongodb");
      const doc = { gameId: new ObjectId(gameId), userId: null, rating: Number(rating), text: String(text).trim(), createdAt: new Date(), updatedAt: new Date() };
      const r = await reviews.insertOne(doc);
      return await reviews.findOne({ _id: r.insertedId });
    } finally { await client.close(); }
  };

  me.updateReviewById = async (id, updates) => {
    const { client, games } = (connect)();
    try {
      const reviews = games.db.collection("reviews");
      const { ObjectId } = await import("mongodb");
      updates.updatedAt = new Date();
      await reviews.updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return await reviews.findOne({ _id: new ObjectId(id) });
    } finally { await client.close(); }
  };

  me.deleteReviewById = async (id) => {
    const { client, games } = (connect)();
    try {
      const reviews = games.db.collection("reviews");
      const { ObjectId } = await import("mongodb");
      const r = await reviews.deleteOne({ _id: new ObjectId(id) });
      return r.deletedCount > 0;
    } finally { await client.close(); }
  };
  return me;
}

const myMongoDB = MyMongoDB();
export default myMongoDB;
