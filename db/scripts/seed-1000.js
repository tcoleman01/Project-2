import { MongoClient } from "mongodb";
import fs from "fs";

const uri = "mongodb://localhost:27017";
const dbName = "videogameTracker"; // your database name

async function seedDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(dbName);

    // Read and parse JSON files
    const collections = ["games", "user_games", "users", "reviews"];
    for (const name of collections) {
      const data = JSON.parse(fs.readFileSync(`./db/data/${name}.json`, "utf8"));
      const collection = db.collection(name);

      await collection.deleteMany({});
      console.log(`Cleared existing documents in ${name}`);

      if (data.length > 0) {
        await collection.insertMany(data);
        console.log(`Inserted ${data.length} documents into ${name}`);
      }
    }

    console.log("✅ Database successfully seeded!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.close();
  }
}

seedDatabase();
