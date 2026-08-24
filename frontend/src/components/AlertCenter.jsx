import { useEffect, useState } from "react";
import { analyzeAnomaly, getAlerts } from "../services/api";

const AlertCenter = () => {
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError("");
            const result = await getAlerts();
            setAlerts(result.data || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Unable to load anomalies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAlerts(); }, []);

    const visible = alerts.filter((a) =>
        filter === "ALL" || a.severity === filter
    );

    const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
    const high = alerts.filter((a) => a.severity === "HIGH").length;
    const medium = alerts.filter((a) => a.severity === "MEDIUM").length;

    const runAI = async (alert) => {
        try {
            setAnalyzing(true);
            setError("");
            const result = await analyzeAnomaly(alert.id);
            const updated = { ...alert, ...result.data };
            setAlerts((current) => current.map((item) =>
                item.id === alert.id ? updated : item
            ));
            setSelected(updated);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to generate AI analysis.");
        } finally {
            setAnalyzing(false);
        }
    };

    const scoreClass = (score) =>
        score >= 80 ? "critical" : score >= 60 ? "high" : "medium";

    return (
        <section className="alerts-page">
            <div className="alerts-page-header">
                <div>
                    <h2>Anomaly Detection & AI Analysis</h2>
                    <p>Deterministic detection first, AI explanation second.</p>
                </div>
                <div className="alert-total">
                    <strong>{alerts.length}</strong>
                    <span>Detected Anomalies</span>
                </div>
            </div>

            <div className="alert-stats-grid">
                <div className="alert-stat-card critical-alert"><div className="alert-stat-icon">🚨</div><div><strong>{critical}</strong><span>Critical</span></div></div>
                <div className="alert-stat-card error-alert"><div className="alert-stat-icon">🔴</div><div><strong>{high}</strong><span>High</span></div></div>
                <div className="alert-stat-card warning-alert"><div className="alert-stat-icon">⚠️</div><div><strong>{medium}</strong><span>Medium</span></div></div>
            </div>

            <div className="alerts-filter-card">
                <div>
                    <strong>Detection Results</strong>
                    <p>Flagged by the LogSense anomaly algorithm</p>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="ALL">All Anomalies</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                </select>
            </div>

            {error && <div className="form-error">⚠️ {error}</div>}

            {loading ? (
                <div className="no-alerts"><strong>Analyzing logs...</strong><p>Loading persisted anomaly findings.</p></div>
            ) : visible.length === 0 ? (
                <div className="no-alerts">
                    <div className="no-alerts-icon">✅</div>
                    <strong>No Anomalies Detected</strong>
                    <p>No logs currently meet the anomaly detection threshold.</p>
                </div>
            ) : (
                <div className="alerts-list">
                    {visible.map((alert) => (
                        <div className={`alert-item ${scoreClass(alert.anomaly_score)}`} key={alert.id}>
                            <div className="alert-icon">{alert.severity === "CRITICAL" ? "🚨" : "⚠️"}</div>
                            <div className="alert-content">
                                <div className="alert-title-row">
                                    <strong>{alert.reason}</strong>
                                    <span className={`alert-severity ${scoreClass(alert.anomaly_score)}`}>
                                        {alert.anomaly_score}/100
                                    </span>
                                </div>
                                <p className="alert-message">
                                    {alert.event_type} · {alert.http_method || "-"} {alert.endpoint || "-"}
                                </p>
                                <div className="alert-meta">
                                    <span>🌐 {alert.source_ip}</span>
                                    <span>📊 {alert.severity}</span>
                                    <span>📅 {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "-"}</span>
                                </div>
                                <div className="anomaly-reason">
                                    <strong>Why flagged:</strong> {alert.reason}
                                </div>
                                <div className="anomaly-actions">
                                    <button className="view-log-btn" onClick={() => setSelected(alert)}>View Details</button>
                                    <button className="create-log-btn ai-analyze-btn" onClick={() => runAI(alert)} disabled={analyzing}>
                                        ✨ {alert.explanation ? "Regenerate AI Analysis" : "AI Explain"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="log-modal anomaly-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>🚨 Anomaly Details</h2>
                                <p>Algorithm finding and AI-generated analysis</p>
                            </div>
                            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
                        </div>

                        <div className="anomaly-score-banner">
                            <div><span>ANOMALY SCORE</span><strong>{selected.anomaly_score}/100</strong></div>
                            <div><span>DETECTION LEVEL</span><strong>{selected.severity}</strong></div>
                        </div>

                        <div className="details-grid">
                            <div className="detail-item"><span>Timestamp</span><strong>{new Date(selected.timestamp).toLocaleString()}</strong></div>
                            <div className="detail-item"><span>Source IP</span><strong>{selected.source_ip}</strong></div>
                            <div className="detail-item"><span>Event Type</span><strong>{selected.event_type}</strong></div>
                            <div className="detail-item"><span>HTTP Method</span><strong>{selected.http_method || "-"}</strong></div>
                            <div className="detail-item"><span>Endpoint</span><strong>{selected.endpoint || "-"}</strong></div>
                            <div className="detail-item"><span>Status Code</span><strong>{selected.status_code || "-"}</strong></div>
                        </div>

                        <div className="ai-section detection-section">
                            <h3>🔎 Detection Reason</h3>
                            <p>{selected.reason}</p>
                            <small>Detection is performed by the LogSense algorithm, not by AI.</small>
                        </div>

                        <div className="ai-section">
                            <div className="ai-section-title">
                                <h3>✨ AI Security Analysis</h3>
                                {!selected.explanation && (
                                    <button className="create-log-btn" onClick={() => runAI(selected)} disabled={analyzing}>
                                        {analyzing ? "Analyzing..." : "Generate Analysis"}
                                    </button>
                                )}
                            </div>
                            {selected.explanation ? (
                                <>
                                    <div className="ai-block"><strong>Plain-English Explanation</strong><p>{selected.explanation}</p></div>
                                    <div className="ai-block"><strong>Likely Root Cause</strong><p>{selected.root_cause}</p></div>
                                    <div className="ai-block"><strong>Recommended Next Step</strong><p>{selected.recommended_action}</p></div>
                                    <small className="ai-model">Generated by {selected.ai_model || "configured AI model"}</small>
                                </>
                            ) : (
                                <div className="ai-empty"><p>AI analysis has not been generated for this anomaly yet.</p></div>
                            )}
                        </div>

                        <div className="message-section">
                            <span>Original Log Message</span>
                            <div className="log-message">{selected.message || "No message provided."}</div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-done-btn" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AlertCenter;
