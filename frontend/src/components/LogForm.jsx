import { useState } from "react";
import { createLog } from "../services/api";

const LogForm = ({ onLogCreated }) => {
    const [formData, setFormData] = useState({
        timestamp: "",
        source_ip: "",
        event_type: "API_REQUEST",
        endpoint: "",
        method: "GET",
        status_code: "",
        severity: "INFO",
        message: ""
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccess("");
        setError("");

        // Required fields
        if (
            !formData.timestamp ||
            !formData.source_ip ||
            !formData.event_type ||
            !formData.endpoint ||
            !formData.method ||
            !formData.status_code ||
            !formData.severity
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        // Timestamp validation
        if (Number.isNaN(new Date(formData.timestamp).getTime())) {
            setError("Please provide a valid timestamp.");
            return;
        }

        // IPv4 / IPv6 validation
        const sourceIP = formData.source_ip.trim();

        const ipv4Pattern =
            /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

        const ipv6Pattern =
            /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        if (!ipv4Pattern.test(sourceIP) && !ipv6Pattern.test(sourceIP)) {
            setError("Please enter a valid IPv4 or IPv6 source IP.");
            return;
        }

        // Status code validation
        const status = Number(formData.status_code);

        if (
            !Number.isInteger(status) ||
            status < 100 ||
            status > 599
        ) {
            setError(
                "Status code must be an integer between 100 and 599."
            );
            return;
        }

        try {
            setLoading(true);

            const result = await createLog({
                ...formData,
                source_ip: sourceIP,
                status_code: status
            });

            setSuccess(
                result.message || "Log created successfully."
            );

            // Reset form
            setFormData({
                timestamp: "",
                source_ip: "",
                event_type: "API_REQUEST",
                endpoint: "",
                method: "GET",
                status_code: "",
                severity: "INFO",
                message: ""
            });

            if (onLogCreated) {
                onLogCreated();
            }

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to create log. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="log-form-card">

            <div className="form-header">
                <div>
                    <h2>Create Log</h2>

                    <p>
                        Add a new application event to LogSense.
                    </p>
                </div>
            </div>

            {success && (
                <div className="form-success">
                    ✅ {success}
                </div>
            )}

            {error && (
                <div className="form-error">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                <div className="form-grid">

                    {/* Timestamp */}
                    <div className="form-group">
                        <label>
                            Timestamp <span>*</span>
                        </label>

                        <input
                            type="datetime-local"
                            name="timestamp"
                            value={formData.timestamp}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Source IP */}
                    <div className="form-group">
                        <label>
                            Source IP <span>*</span>
                        </label>

                        <input
                            type="text"
                            name="source_ip"
                            placeholder="192.168.1.50"
                            value={formData.source_ip}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Event Type */}
                    <div className="form-group">
                        <label>
                            Event Type <span>*</span>
                        </label>

                        <select
                            name="event_type"
                            value={formData.event_type}
                            onChange={handleChange}
                        >
                            <option value="API_REQUEST">
                                API_REQUEST
                            </option>

                            <option value="LOGIN">
                                LOGIN
                            </option>

                            <option value="LOGOUT">
                                LOGOUT
                            </option>

                            <option value="DATABASE">
                                DATABASE
                            </option>

                            <option value="SECURITY">
                                SECURITY
                            </option>

                            <option value="FILE_ACCESS">
                                FILE_ACCESS
                            </option>

                            <option value="SYSTEM">
                                SYSTEM
                            </option>
                        </select>
                    </div>

                    {/* Endpoint */}
                    <div className="form-group">
                        <label>
                            Endpoint <span>*</span>
                        </label>

                        <input
                            type="text"
                            name="endpoint"
                            placeholder="/api/users/login"
                            value={formData.endpoint}
                            onChange={handleChange}
                        />
                    </div>

                    {/* HTTP Method */}
                    <div className="form-group">
                        <label>
                            HTTP Method <span>*</span>
                        </label>

                        <select
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>

                    {/* Status Code */}
                    <div className="form-group">
                        <label>
                            Status Code <span>*</span>
                        </label>

                        <input
                            type="number"
                            name="status_code"
                            placeholder="200"
                            min="100"
                            max="599"
                            value={formData.status_code}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Severity */}
                    <div className="form-group">
                        <label>
                            Severity <span>*</span>
                        </label>

                        <select
                            name="severity"
                            value={formData.severity}
                            onChange={handleChange}
                        >
                            <option value="INFO">
                                INFO
                            </option>

                            <option value="WARNING">
                                WARNING
                            </option>

                            <option value="ERROR">
                                ERROR
                            </option>

                            <option value="CRITICAL">
                                CRITICAL
                            </option>
                        </select>
                    </div>

                    {/* Message */}
                    <div className="form-group full-form-width">
                        <label>
                            Message
                        </label>

                        <textarea
                            name="message"
                            placeholder="Describe the application event..."
                            value={formData.message}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="create-log-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "➕ Create Log"
                        }
                    </button>
                </div>

            </form>

        </section>
    );
};

export default LogForm;