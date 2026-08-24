const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/database");
const logRoutes = require("./routes/logRoutes");

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/logs", logRoutes);

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "LogSense server and database are running"
        });
    } catch (error) {
        console.error("Database connection error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});