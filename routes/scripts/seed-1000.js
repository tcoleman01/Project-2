// scripts/seed-1000.js
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = "videogameTracker";
const coll = "mock_games";

function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const platforms = ["PC", "Switch", "PS5", "Xbox", "Mobile"];
const genres = ["Action", "RPG", "Simulation", "Strategy", "Adventure"];

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const games = db.collection(coll);
await games.createIndex({ slug: 1 }, { unique: true }).catch(() => {});

const docs = [];
for (let i = 0; i < 1000; i++) {
  const title = `Mock Game ${i + 1}`;
  docs.push({
    title,
    slug: slugify(title),
    platform: platforms[i % platforms.length],
    genre: genres[i % genres.length],
    year: 2010 + (i % 15),
    price: Number((5 + (i % 55) + Math.random()).toFixed(2)),
    status: ["Completed", "In Progress", "Wishlist"][i % 3],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

await games.insertMany(docs, { ordered: false }).catch(() => {});
console.log("Seeded ~1000 games");

// ==================== NEW SECTION: REVIEWS + USER GAMES ====================

// 1. Create mock reviews collection
const reviews = db.collection("mock_reviews");
await reviews.deleteMany({});
const insertedGames = await games.find({}, { projection: { _id: 1 } }).limit(100).toArray();

const reviewDocs = insertedGames.map((g, i) => ({
  gameId: g._id,
  userId: new ObjectId(),
  rating: Math.ceil(Math.random() * 5),
  text: `This is mock review #${i + 1}`,
  createdAt: new Date(),
}));
if (reviewDocs.length > 0) {
  await reviews.insertMany(reviewDocs);
  console.log(`Seeded ${reviewDocs.length} mock reviews`);
}

// 2. Create mock user_games collection
const userGames = db.collection("mock_user_games");
await userGames.deleteMany({});
const userGameDocs = insertedGames.slice(0, 50).map((g, i) => ({
  userId: new ObjectId(),
  gameId: g._id,
  status: ["Playing", "Completed", "Wishlist"][i % 3],
  hoursPlayed: Math.floor(Math.random() * 120),
  moneySpent: parseFloat((Math.random() * 60).toFixed(2)),
  createdAt: new Date(),
  updatedAt: new Date(),
}));
await userGames.insertMany(userGameDocs);
console.log(`Seeded ${userGameDocs.length} mock user games`);

// 3. Link mock_user_games to your real account
const users = db.collection("users");
const myUser = await users.findOne({ email: "coleman.t@northeastern.edu" }); // Replace with your login email

if (myUser) {
  const myId = myUser._id;
  console.log(`Found your user account: ${myUser.email} (${myId})`);
  const randomGames = insertedGames.slice(0, 10);
  const linkedGames = randomGames.map((g) => ({
    userId: myId,
    gameId: g._id,
    status: ["Playing", "Completed", "Wishlist"][Math.floor(Math.random() * 3)],
    hoursPlayed: Math.floor(Math.random() * 80),
    moneySpent: parseFloat((Math.random() * 60).toFixed(2)),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  await userGames.insertMany(linkedGames);
  console.log(`Added ${linkedGames.length} games linked to your account`);
} else {
  console.log("No user found for coleman.t@northeastern.edu — skipping personal linking");
}

await client.close();
console.log("All mock collections successfully seeded");
