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
  return me;
}

const myMongoDB = MyMongoDB();
export default myMongoDB;
