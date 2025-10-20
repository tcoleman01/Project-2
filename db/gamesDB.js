import { ObjectId } from "mongodb";
import { connect, toObjectId } from "./index.js";

const COLLECTION = "games";

// Get all games, with optional filtering, pagination
export async function getAllGames({ query = {}, pageSize = 20, page = 0 } = {}) {
  const { client, db } = connect();
  try {
    return await db
      .collection(COLLECTION)
      .find(query)
      .limit(pageSize)
      .skip(pageSize * page)
      .toArray();
  } finally {
    await client.close();
  }
}

// Get a specific game by its ID or slug
export async function getGameByIdOrSlug(idOrSlug) {
  const { client, db } = connect();
  const games = db.collection(COLLECTION);
  try {
    const byId = ObjectId.isValid(idOrSlug)
      ? await games.findOne({ _id: new toObjectId(idOrSlug) })
      : null;
    const bySlug = byId ? null : await games.findOne({ slug: idOrSlug });
    return byId || bySlug;
  } finally {
    await client.close();
  }
}

// Create a new game entry for the master games collection
export async function createGame(doc) {
  const { client, db } = connect();
  const games = db.collection(COLLECTION);
  try {
    await games.createIndex({ slug: 1 }, { unique: true });
    doc.createdAt = doc.updatedAt = new Date();
    const res = await games.insertOne(doc);
    return await games.findOne({ _id: res.insertedId });
  } finally {
    await client.close();
  }
}

// Update an existing game in the master games collection by its ID
export async function updateGameById(id, updates) {
  const { client, db } = connect();
  const games = db.collection(COLLECTION);
  try {
    updates.updatedAt = new Date();
    await games.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return await games.findOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// Delete a game from the master games collection by its ID
export async function deleteGameById(id) {
  const { client, db } = connect();
  const games = db.collection(COLLECTION);
  try {
    const res = await games.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount > 0;
  } finally {
    await client.close();
  }
}

// Autocomplete game titles based on a query string - used for search suggestions
export async function autocompleteGameTitles(query, limit = 10) {
  const { client, db } = connect();
  if (!query) return [];
  try {
    return await db
      .collection(COLLECTION)
      .find({ title: { $regex: query, $options: "i" } })
      .limit(limit)
      .project({ title: 1, genre: 1, platform: 1, price: 1 })
      .toArray();
  } finally {
    await client.close();
  }
}
