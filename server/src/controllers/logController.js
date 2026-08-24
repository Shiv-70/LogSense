const db = require("../config/database");
const net = require("net");
const { detectAnomaly } = require("../services/anomalyDetector");

const createAnomalyForLog = async (log) => {
    const detection = detectAnomaly(log);
    if (!detection) return null;

    const [existing] = await db.query(
        "SELECT id FROM anomalies WHERE log_id = ? LIMIT 1",
        [log.id]
    );

    if (existing.length) return existing[0].id;

    const [result] = await db.query(
        `INSERT INTO anomalies (log_id, anomaly_score, severity, reason)
         VALUES (?, ?, ?, ?)`,
        [log.id, detection.score, detection.severity, detection.reason]
    );

    return result.insertId;
};

const createLog = async (req, res) => {
    try {
        const {
            timestamp,
            source_ip,
            event_type,
            endpoint,
            method,
            status_code,
            severity,
            message
        } = req.body;

        if (!timestamp || !source_ip || !event_type) {
            return res.status(400).json({
                success: false,
                message: "Timestamp, source IP and event type are required"
            });
        }

        const parsedDate = new Date(timestamp);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid timestamp"
            });
        }

        if (status_code !== undefined && status_code !== null && status_code !== "") {
            const status = Number(status_code);
            if (!Number.isInteger(status) || status < 100 || status > 599) {
                return res.status(400).json({
                    success: false,
                    message: "Status code must be an integer between 100 and 599"
                });
            }
        }

        const allowedSeverity = ["INFO", "WARNING", "ERROR", "CRITICAL"];
        const finalSeverity = severity || "INFO";
        if (!allowedSeverity.includes(finalSeverity)) {
            return res.status(400).json({
                success: false,
                message: "Invalid severity"
            });
        }

        if (source_ip.length > 45 || !net.isIP(source_ip)) {
            return res.status(400).json({
                success: false,
                message: "Source IP must be a valid IPv4 or IPv6 address"
            });
        }

        const [result] = await db.query(
            `INSERT INTO logs
            (timestamp, source_ip, event_type, endpoint, http_method,
             status_code, severity, message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                timestamp,
                source_ip,
                event_type,
                endpoint || null,
                method || null,
                status_code || null,
                finalSeverity,
                message || null
            ]
        );

        const [rows] = await db.query(
            "SELECT * FROM logs WHERE id = ?",
            [result.insertId]
        );

        const log = rows[0];
        const anomalyId = await createAnomalyForLog(log);

        return res.status(201).json({
            success: true,
            message: "Log created successfully",
            data: { ...log, anomaly_id: anomalyId }
        });
    } catch (error) {
        console.error("Create log error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create log"
        });
    }
};

const getLogs = async (req, res) => {
    try {
        const { event_type, source_ip, severity } = req.query;
        let query = `
            SELECT l.*, a.id AS anomaly_id, a.anomaly_score, a.severity AS anomaly_severity,
                   a.reason AS anomaly_reason, a.status AS anomaly_status
            FROM logs l
            LEFT JOIN anomalies a ON a.log_id = l.id
            WHERE 1=1`;
        const values = [];

        if (event_type) { query += " AND l.event_type = ?"; values.push(event_type); }
        if (source_ip) { query += " AND l.source_ip = ?"; values.push(source_ip); }
        if (severity) { query += " AND l.severity = ?"; values.push(severity); }

        query += " ORDER BY l.timestamp DESC";
        const [rows] = await db.query(query, values);

        return res.status(200).json({
            success: true,
            count: rows.length,
            filters: {
                event_type: event_type || null,
                source_ip: source_ip || null,
                severity: severity || null
            },
            data: rows
        });
    } catch (error) {
        console.error("Get logs error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch logs" });
    }
};

const getLogById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT l.*, a.id AS anomaly_id, a.anomaly_score, a.severity AS anomaly_severity,
                    a.reason AS anomaly_reason, a.status AS anomaly_status,
                    ai.explanation, ai.root_cause, ai.recommended_action, ai.model AS ai_model
             FROM logs l
             LEFT JOIN anomalies a ON a.log_id = l.id
             LEFT JOIN ai_analysis ai ON ai.anomaly_id = a.id
             WHERE l.id = ?`,
            [req.params.id]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Get log by ID error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch log" });
    }
};

const deleteLog = async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM logs WHERE id = ?", [req.params.id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }
        return res.status(200).json({ success: true, message: "Log deleted successfully" });
    } catch (error) {
        console.error("Delete log error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to delete log" });
    }
};

const getLogStats = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS total_logs,
                SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) AS info_logs,
                SUM(CASE WHEN severity = 'WARNING' THEN 1 ELSE 0 END) AS warning_logs,
                SUM(CASE WHEN severity = 'ERROR' THEN 1 ELSE 0 END) AS error_logs,
                SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_logs,
                SUM(CASE WHEN event_type = 'API_REQUEST' THEN 1 ELSE 0 END) AS api_requests,
                COUNT(DISTINCT source_ip) AS unique_ips,
                (SELECT COUNT(*) FROM anomalies) AS anomaly_count,
                (SELECT COALESCE(ROUND(AVG(anomaly_score), 1), 0) FROM anomalies) AS average_anomaly_score,
                (SELECT COUNT(*) FROM anomalies WHERE severity = 'CRITICAL') AS critical_anomalies
            FROM logs
        `);
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Get log stats error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch log statistics" });
    }
};

const getSecurityAlerts = async (req, res) => {
    try {
        // Backfill anomalies for old logs so existing data is covered.
        const [logs] = await db.query(`
            SELECT l.* FROM logs l
            LEFT JOIN anomalies a ON a.log_id = l.id
            WHERE a.id IS NULL
        `);
        for (const log of logs) await createAnomalyForLog(log);

        const [rows] = await db.query(`
            SELECT a.*, l.timestamp, l.source_ip, l.event_type, l.endpoint,
                   l.http_method, l.status_code, l.severity AS log_severity, l.message,
                   ai.explanation, ai.root_cause, ai.recommended_action, ai.model AS ai_model
            FROM anomalies a
            JOIN logs l ON l.id = a.log_id
            LEFT JOIN ai_analysis ai ON ai.anomaly_id = a.id
            ORDER BY a.detected_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error("Security analysis error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to analyze security alerts" });
    }
};

const getAnomaly = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, l.timestamp, l.source_ip, l.event_type, l.endpoint,
                   l.http_method, l.status_code, l.severity AS log_severity, l.message,
                   ai.explanation, ai.root_cause, ai.recommended_action, ai.model AS ai_model
            FROM anomalies a
            JOIN logs l ON l.id = a.log_id
            LEFT JOIN ai_analysis ai ON ai.anomaly_id = a.id
            WHERE a.id = ?
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ success: false, message: "Anomaly not found" });
        return res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Get anomaly error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to fetch anomaly" });
    }
};

const analyzeAnomalyWithAI = async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({
                success: false,
                message: "AI is not configured. Add OPENAI_API_KEY to the backend environment."
            });
        }

        const [rows] = await db.query(`
            SELECT a.*, l.timestamp, l.source_ip, l.event_type, l.endpoint,
                   l.http_method, l.status_code, l.severity AS log_severity, l.message
            FROM anomalies a
            JOIN logs l ON l.id = a.log_id
            WHERE a.id = ?
        `, [req.params.id]);

        if (!rows.length) return res.status(404).json({ success: false, message: "Anomaly not found" });

        const anomaly = rows[0];
        const prompt = `You are a cybersecurity incident analyst. The application's own deterministic detection algorithm has already flagged this log as an anomaly. Do NOT decide whether it is anomalous. Explain the existing finding.

Return ONLY valid JSON with exactly these keys:
explanation, root_cause, recommended_action

Log:
timestamp: ${anomaly.timestamp}
source_ip: ${anomaly.source_ip}
event_type: ${anomaly.event_type}
endpoint: ${anomaly.endpoint || ""}
http_method: ${anomaly.http_method || ""}
status_code: ${anomaly.status_code ?? ""}
severity: ${anomaly.log_severity}
message: ${anomaly.message || ""}
algorithm_anomaly_score: ${anomaly.anomaly_score}
algorithm_detection_reason: ${anomaly.reason}`;

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
                input: prompt
            })
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error("OpenAI error:", detail);
            return res.status(502).json({
                success: false,
                message: "AI service request failed"
            });
        }

        const aiResponse = await response.json();
        const text = aiResponse.output_text ||
            aiResponse.output?.flatMap((item) => item.content || [])
                .map((item) => item.text || "")
                .join("") || "";

        let parsed;
        try {
            parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        } catch {
            return res.status(502).json({
                success: false,
                message: "AI returned an invalid analysis format"
            });
        }

        if (!parsed.explanation || !parsed.root_cause || !parsed.recommended_action) {
            return res.status(502).json({
                success: false,
                message: "AI response was incomplete"
            });
        }

        const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
        const [existing] = await db.query(
            "SELECT id FROM ai_analysis WHERE anomaly_id = ? LIMIT 1",
            [anomaly.id]
        );

        if (existing.length) {
            await db.query(
                `UPDATE ai_analysis
                 SET explanation = ?, root_cause = ?, recommended_action = ?, model = ?
                 WHERE anomaly_id = ?`,
                [parsed.explanation, parsed.root_cause, parsed.recommended_action, model, anomaly.id]
            );
        } else {
            await db.query(
                `INSERT INTO ai_analysis
                 (anomaly_id, explanation, root_cause, recommended_action, model)
                 VALUES (?, ?, ?, ?, ?)`,
                [anomaly.id, parsed.explanation, parsed.root_cause, parsed.recommended_action, model]
            );
        }

        return res.json({
            success: true,
            data: {
                anomaly_id: anomaly.id,
                explanation: parsed.explanation,
                root_cause: parsed.root_cause,
                recommended_action: parsed.recommended_action,
                model
            }
        });
    } catch (error) {
        console.error("AI analysis error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to generate AI analysis" });
    }
};

module.exports = {
    createLog,
    getLogs,
    getLogById,
    deleteLog,
    getLogStats,
    getSecurityAlerts,
    getAnomaly,
    analyzeAnomalyWithAI
};
