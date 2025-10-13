import express from "express";
import gamesRouter from "./routes/games.js";
import reviewsRouter from "./routes/reviews.js";
import userGamesRouter from "./routes/userGames.js";

console.log("Backend server is running...");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("frontend"));

app.use("/api/", gamesRouter);
app.use("/api/", reviewsRouter);
app.use("/api/", userGamesRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
