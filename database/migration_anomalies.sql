USE logsense_db;

CREATE TABLE IF NOT EXISTS anomalies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    log_id INT NOT NULL,
    anomaly_score DECIMAL(5,2) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('NEW', 'REVIEWED', 'IGNORED') DEFAULT 'NEW',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_anomaly_log (log_id),
    CONSTRAINT fk_anomaly_log
        FOREIGN KEY (log_id) REFERENCES logs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anomaly_id INT NOT NULL,
    explanation TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ai_anomaly (anomaly_id),
    CONSTRAINT fk_analysis_anomaly
        FOREIGN KEY (anomaly_id) REFERENCES anomalies(id) ON DELETE CASCADE
);
