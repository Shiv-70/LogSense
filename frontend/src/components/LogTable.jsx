import { useState } from "react";
import { deleteLog } from "../services/api";

const LogTable = ({ logs }) => {

    const [selectedLog, setSelectedLog] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const getSeverityClass = (severity) => {

        switch (String(severity || "").toUpperCase()) {

            case "CRITICAL":
                return "severity critical";

            case "ERROR":
                return "severity error";

            case "WARNING":
            case "WARN":
                return "severity warning";

            default:
                return "severity info";
        }
    };

    const getStatusClass = (statusCode) => {

        if (!statusCode) {
            return "status success-status";
        }

        return Number(statusCode) >= 400
            ? "status error-status"
            : "status success-status";
    };

    const handleDelete = async () => {

        if (!deleteTarget) {
            return;
        }

        try {

            setDeleting(true);

            await deleteLog(deleteTarget.id);

            setDeleteTarget(null);

            window.location.reload();

        } catch (error) {

            console.error("Delete log error:", error);

            alert("Failed to delete log.");

        } finally {

            setDeleting(false);

        }
    };

    return (
        <>
            <div className="logs-card">

                <div className="section-header">

                    <div>
                        <h3>Recent Logs</h3>

                        <p>
                            Latest application events
                        </p>
                    </div>

                    <span className="log-count">
                        {logs.length} logs
                    </span>

                </div>

                <div className="table-wrapper">

                    <table>

                        <thead>

                            <tr>
                                <th>ID</th>
                                <th>Timestamp</th>
                                <th>Source IP</th>
                                <th>Event</th>
                                <th>Endpoint</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Severity</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {logs.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="9"
                                        className="empty-table"
                                    >
                                        No logs found
                                    </td>

                                </tr>

                            ) : (

                                logs.map((log) => (

                                    <tr key={log.id}>

                                        <td>
                                            <strong>
                                                #{log.id}
                                            </strong>
                                        </td>

                                        <td>
                                            {log.timestamp
                                                ? new Date(
                                                    log.timestamp
                                                ).toLocaleString()
                                                : "-"
                                            }
                                        </td>

                                        <td className="ip">
                                            {log.source_ip || "-"}
                                        </td>

                                        <td>

                                            <span className="event-type">
                                                {log.event_type || "-"}
                                            </span>

                                        </td>

                                        <td>
                                            {log.endpoint || "-"}
                                        </td>

                                        <td>
                                            {log.method || "-"}
                                        </td>

                                        <td>

                                            <span
                                                className={getStatusClass(
                                                    log.status_code
                                                )}
                                            >
                                                {log.status_code || "-"}
                                            </span>

                                        </td>

                                        <td>

                                            <span
                                                className={getSeverityClass(
                                                    log.severity
                                                )}
                                            >
                                                {log.severity || "INFO"}
                                            </span>

                                        </td>

                                        <td>

                                            <div className="log-actions">

                                                <button
                                                    className="view-log-btn"
                                                    onClick={() =>
                                                        setSelectedLog(log)
                                                    }
                                                >
                                                    View
                                                </button>

                                                <button
                                                    className="delete-log-btn"
                                                    onClick={() =>
                                                        setDeleteTarget(log)
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* LOG DETAILS MODAL */}

            {selectedLog && (

                <div
                    className="modal-overlay"
                    onClick={() => setSelectedLog(null)}
                >

                    <div
                        className="log-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Log Details
                                </h2>

                                <p>
                                    Complete information about this event
                                </p>

                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setSelectedLog(null)
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="modal-log-id">

                            <span>
                                LOG ID
                            </span>

                            <strong>
                                #{selectedLog.id}
                            </strong>

                        </div>


                        <div className="details-grid">

                            <div className="detail-item">

                                <span>
                                    Timestamp
                                </span>

                                <strong>
                                    {selectedLog.timestamp
                                        ? new Date(
                                            selectedLog.timestamp
                                        ).toLocaleString()
                                        : "-"
                                    }
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Source IP
                                </span>

                                <strong className="detail-ip">
                                    {selectedLog.source_ip || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Event Type
                                </span>

                                <strong>
                                    {selectedLog.event_type || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    HTTP Method
                                </span>

                                <strong>
                                    {selectedLog.method || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Endpoint
                                </span>

                                <strong>
                                    {selectedLog.endpoint || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Status Code
                                </span>

                                <strong>
                                    {selectedLog.status_code || "-"}
                                </strong>

                            </div>


                            <div className="detail-item">

                                <span>
                                    Severity
                                </span>

                                <span>
                                    <span
                                        className={getSeverityClass(
                                            selectedLog.severity
                                        )}
                                    >
                                        {selectedLog.severity || "INFO"}
                                    </span>
                                </span>

                            </div>

                        </div>


                        <div className="message-section">

                            <span>
                                Message
                            </span>

                            <div className="log-message">

                                {selectedLog.message ||
                                    "No message provided."
                                }

                            </div>

                        </div>


                        <div className="modal-footer">

                            <button
                                className="modal-done-btn"
                                onClick={() =>
                                    setSelectedLog(null)
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {deleteTarget && (

    <div
        className="modal-overlay"
        onClick={() => setDeleteTarget(null)}
    >

        <div
            className="delete-modal"
            onClick={(e) =>
                e.stopPropagation()
            }
        >

            <div className="delete-icon">
                🗑️
            </div>

            <h2>
                Delete Log?
            </h2>

            <p>
                Are you sure you want to delete
                log <strong>#{deleteTarget.id}</strong>?
            </p>

            <span className="delete-warning">
                This action cannot be undone.
            </span>

            <div className="delete-actions">

                <button
                    className="cancel-delete-btn"
                    onClick={() =>
                        setDeleteTarget(null)
                    }
                    disabled={deleting}
                >
                    Cancel
                </button>

                <button
                    className="confirm-delete-btn"
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    {deleting
                        ? "Deleting..."
                        : "Delete Log"
                    }
                </button>

            </div>

        </div>

    </div>

)}

        </>
    );
};

export default LogTable;