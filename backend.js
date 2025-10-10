import express from "express";

console.log("Backend server is running...");
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static("frontend"));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
