require("dotenv").config();

const express = require("express");
const cors = require("cors");
const runsRouter = require("./routes/runs");
const favouritesRouter = require("./routes/favourites");
const app = express();

app.use(cors());
app.use(express.json());

//test route to check
app.get("/", (req, res) => {
    res.send("STS Stats Tracker Backend is running!");
});

app.use("/api/runs", runsRouter);
app.use("/api/favorites", favouritesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});