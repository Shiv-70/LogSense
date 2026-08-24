const db = require("../config/database");

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
                severity || "INFO",
                message || null
            ]
        );

        const [rows] = await db.query(
            "SELECT * FROM logs WHERE id = ?",
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Log created successfully",
            data: rows[0]
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

        let query = "SELECT * FROM logs WHERE 1=1";
        const values = [];

        if (event_type) {
            query += " AND event_type = ?";
            values.push(event_type);
        }

        if (source_ip) {
            query += " AND source_ip = ?";
            values.push(source_ip);
        }

        if (severity) {
            query += " AND severity = ?";
            values.push(severity);
        }

        query += " ORDER BY timestamp DESC";

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

        return res.status(500).json({
            success: false,
            message: "Failed to fetch logs"
        });
    }
};

const getLogById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            "SELECT * FROM logs WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Log not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get log by ID error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch log"
        });
    }
};

const deleteLog = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM logs WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Log not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Log deleted successfully"
        });

    } catch (error) {
        console.error("Delete log error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete log"
        });
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
                COUNT(DISTINCT source_ip) AS unique_ips
            FROM logs
        `);

        return res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get log stats error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch log statistics"
        });
    }
};

const getSecurityAlerts = async (req, res) => {
    try {
        const alerts = [];

        // 1. Critical and error logs
        const [errorLogs] = await db.query(`
            SELECT *
            FROM logs
            WHERE severity IN ('ERROR', 'CRITICAL')
            ORDER BY timestamp DESC
        `);

        errorLogs.forEach(log => {
            alerts.push({
                type: "HIGH_SEVERITY",
                severity: log.severity,
                source_ip: log.source_ip,
                message: log.message || "High severity event detected",
                timestamp: log.timestamp
            });
        });

        // 2. SQL Injection detection
        const [sqlLogs] = await db.query(`
            SELECT *
            FROM logs
            WHERE message LIKE '%SELECT%'
               OR message LIKE '%UNION%'
               OR message LIKE '%DROP%'
               OR message LIKE '%INSERT%'
               OR message LIKE '%OR 1=1%'
        `);

        sqlLogs.forEach(log => {
            alerts.push({
                type: "SQL_INJECTION",
                severity: "CRITICAL",
                source_ip: log.source_ip,
                message: "Possible SQL injection activity detected",
                timestamp: log.timestamp
            });
        });

        // 3. XSS detection
        const [xssLogs] = await db.query(`
            SELECT *
            FROM logs
            WHERE message LIKE '%<script%'
               OR message LIKE '%javascript:%'
               OR message LIKE '%onerror=%'
        `);

        xssLogs.forEach(log => {
            alerts.push({
                type: "XSS",
                severity: "CRITICAL",
                source_ip: log.source_ip,
                message: "Possible XSS activity detected",
                timestamp: log.timestamp
            });
        });

        // 4. Suspicious endpoints
        const [suspiciousEndpoints] = await db.query(`
            SELECT *
            FROM logs
            WHERE endpoint LIKE '%admin%'
               OR endpoint LIKE '%login%'
               OR endpoint LIKE '%wp-admin%'
               OR endpoint LIKE '%phpmyadmin%'
        `);

        suspiciousEndpoints.forEach(log => {
            alerts.push({
                type: "SUSPICIOUS_ENDPOINT",
                severity: "WARNING",
                source_ip: log.source_ip,
                message: "Suspicious endpoint accessed",
                endpoint: log.endpoint,
                timestamp: log.timestamp
            });
        });

        return res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });

    } catch (error) {
        console.error("Security analysis error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to analyze security alerts"
        });
    }
};

module.exports = {
    createLog,
    getLogs,
    getLogById,
    deleteLog,
    getLogStats,
    getSecurityAlerts
};