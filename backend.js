import express from "express";
import gamesRouter from "./routes/games.js";

console.log("Backend server is running...");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); //
app.use(express.static("frontend"));

app.use("/api/", gamesRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
