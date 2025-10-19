import { ObjectId } from "mongodb";
import { connect } from "./index.js";

const COLLECTION = "mock_reviews";

// Get all reviews, with optional filtering by gameId and/or userId, pagination
export async function getReviews({ gameId, userId, pageSize = 20, page = 0 } = {}) {
  const { client, db } = connect();
  const reviews = db.collection(COLLECTION);
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
      .sort({ createdAt: -1 })
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
}

// Create a new review to add to the reviews collection
export async function createReview(newReview) {
  const { client, db } = connect();
  const reviews = db.collection(COLLECTION);
  try {
    const res = await reviews.insertOne(newReview);
    return await reviews.findOne({ _id: res.insertedId });
  } catch (err) {
    console.error("Error creating review in MongoDB", err);
    throw err;
  } finally {
    await client.close();
  }
}

// Update an existing review by its ID
export async function updateReviewById(id, updates) {
  const { client, db } = connect();
  const reviews = db.collection(COLLECTION);

  try {
    let query;
    try {
      query = { _id: new ObjectId(id) };
    } catch {
      query = { _id: id }; // fallback if id isn’t a valid ObjectId
    }

    const result = await reviews.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: "after" }
    );

    return result;
  } finally {
    await client.close();
  }
}

// Delete a review by its ID
export async function deleteReviewById(id) {
  const { client, db } = connect();
  const reviews = db.collection(COLLECTION);
  try {
    const r = await reviews.deleteOne({ _id: new ObjectId(id) });
    return r.deletedCount > 0;
  } finally {
    await client.close();
  }
}
