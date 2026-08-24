const express = require("express");

const {
    createLog,
    getLogs,
    getLogById,
    deleteLog,
    getLogStats,
    getSecurityAlerts,
    getAnomaly,
    analyzeAnomalyWithAI
} = require("../controllers/logController");

const router = express.Router();

router.get("/", getLogs);
router.get("/stats", getLogStats);
router.get("/alerts", getSecurityAlerts);
router.get("/anomalies/:id", getAnomaly);
router.post("/anomalies/:id/analyze", analyzeAnomalyWithAI);
router.get("/:id", getLogById);
router.post("/", createLog);
router.delete("/:id", deleteLog);

module.exports = router;
