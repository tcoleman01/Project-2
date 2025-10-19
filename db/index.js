import { MongoClient, ObjectId } from "mongodb";

export const DB_NAME = "videogameTracker";
export const URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

export function connect() {
  const client = new MongoClient(URI);
  const db = client.db(DB_NAME);
  return { client, db };
}

export function toObjectId(id) {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && id.length === 24) return new ObjectId(id);
  if (typeof id === "object" && id.$oid) return new ObjectId(id.$oid);
  throw new Error(`Invalid ObjectId: ${JSON.stringify(id)}`);
}
