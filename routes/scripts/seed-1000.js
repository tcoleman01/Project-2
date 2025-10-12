// scripts/seed-1000.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = "videogameTracker";
const coll = "mock_games";

function slugify(s){return String(s??"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");}

const platforms = ["PC","Switch","PS5","Xbox","Mobile"];
const genres = ["Action","RPG","Simulation","Strategy","Adventure"];

const client = new MongoClient(uri);
await client.connect();
const games = client.db(dbName).collection(coll);
await games.createIndex({ slug: 1 }, { unique: true }).catch(()=>{});

const docs = [];
for(let i=0;i<1000;i++){
  const title = `Mock Game ${i+1}`;
  docs.push({
    title,
    slug: slugify(title),
    platform: platforms[i%platforms.length],
    genre: genres[i%genres.length],
    year: 2010 + (i%15),
    price: Number((5 + (i%55) + Math.random()).toFixed(2)),
    status: ["Completed","In Progress","Wishlist"][i%3],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

await games.insertMany(docs, { ordered: false }).catch(()=>{});
console.log("Seeded ~1000 games");
await client.close();
