// db/usersDB.js
import bcrypt from "bcryptjs";
import { connect } from "./index.js";

const COLLECTION = "users";

export async function ensureIndexes() {
  const { client, db } = connect();
  try {
    await db.collection(COLLECTION).createIndex({ email: 1 }, { unique: true });
  } finally {
    await client.close();
  }
}

export async function createUser({ email, password, displayName }) {
  const { client, db } = connect();
  try {
    const users = db.collection(COLLECTION);
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = {
      email: String(email).toLowerCase(),
      displayName: displayName || String(email).split("@")[0],
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { insertedId } = await users.insertOne(doc);
    return { _id: insertedId, email: doc.email, displayName: doc.displayName };
  } finally {
    await client.close();
  }
}

export async function findByEmail(email) {
  const { client, db } = connect();
  try {
    return await db.collection(COLLECTION).findOne({ email: String(email).toLowerCase() });
  } finally {
    await client.close();
  }
}

export async function updateDisplayName(email, displayName) {
  const { client, db } = connect();
  try {
    const users = db.collection(COLLECTION);
    await users.updateOne(
      { email: String(email).toLowerCase() },
      { $set: { displayName, updatedAt: new Date() } }
    );
    return await users.findOne(
      { email: String(email).toLowerCase() },
      { projection: { passwordHash: 0 } }
    );
  } finally {
    await client.close();
  }
}

export async function updatePassword(email, newPassword) {
  const { client, db } = connect();
  try {
    const users = db.collection(COLLECTION);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await users.updateOne(
      { email: String(email).toLowerCase() },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    return true;
  } finally {
    await client.close();
  }
}
