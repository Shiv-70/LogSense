import { useEffect, useMemo, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import LogTable from "./components/LogTable";
import ActivityChart from "./components/ActivityChart";
import LogForm from "./components/LogForm";
import SeverityChart from "./components/SeverityChart";
import TopSourceIPs from "./components/TopSourceIPs";
import AlertCenter from "./components/AlertCenter";

import { getLogs } from "./services/api";

import "./App.css";

function App() {

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");

  const [alertFilter, setAlertFilter] = useState("ALL");

  const [activePage, setActivePage] = useState("dashboard");


  const fetchLogs = async () => {

    try {

      setLoading(true);
      setError("");

      const result = await getLogs();

      setLogs(result.data || []);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to connect to LogSense API. Make sure the backend is running on port 5000."
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Statistics
  const statistics = useMemo(() => {

    const total = logs.length;

    const apiRequests = logs.filter(
      (log) =>
        String(log.event_type || "").toUpperCase() === "API_REQUEST"
    ).length;

    const errors = logs.filter(
      (log) =>
        String(log.severity || "").toUpperCase() === "ERROR"
    ).length;

    const critical = logs.filter(
      (log) =>
        String(log.severity || "").toUpperCase() === "CRITICAL"
    ).length;

    const warnings = logs.filter(
      (log) => {

        const severity =
          String(log.severity || "").toUpperCase();

        return severity === "WARNING" || severity === "WARN";

      }
    ).length;

    const uniqueIPs = new Set(
      logs.map((log) => log.source_ip)
    ).size;

    return {
      total,
      apiRequests,
      errors,
      critical,
      warnings,
      uniqueIPs,
      anomalies: logs.filter((log) => log.anomaly_id).length,
      averageAnomalyScore: logs.filter((log) => log.anomaly_score).length
        ? Math.round(logs.filter((log) => log.anomaly_score).reduce((sum, log) => sum + Number(log.anomaly_score), 0) / logs.filter((log) => log.anomaly_score).length)
        : 0
    };

  }, [logs]);

  const alertStatistics = useMemo(() => {

    const critical = logs.filter(
      (log) =>
        String(log.severity || "").toUpperCase() === "CRITICAL"
    ).length;

    const errors = logs.filter(
      (log) =>
        String(log.severity || "").toUpperCase() === "ERROR"
    ).length;

    const warnings = logs.filter(
      (log) => {
        const severity =
          String(log.severity || "").toUpperCase();

        return severity === "WARNING" || severity === "WARN";
      }
    ).length;

    return {
      total: critical + errors + warnings,
      critical,
      errors,
      warnings
    };

  }, [logs]);

  const filteredAlerts = useMemo(() => {

    return logs.filter((log) => {

      const severity =
        String(log.severity || "").toUpperCase();

      const isAlert =
        ["ERROR", "CRITICAL", "WARNING", "WARN"]
          .includes(severity);

      if (!isAlert) {
        return false;
      }

      if (alertFilter === "ALL") {
        return true;
      }

      if (alertFilter === "WARNING") {
        return severity === "WARNING" || severity === "WARN";
      }

      return severity === alertFilter;

    });

  }, [logs, alertFilter]);

  // Filters
  const filteredLogs = useMemo(() => {

    return logs.filter((log) => {

      const text =
        `${log.source_ip || ""} 
                 ${log.event_type || ""} 
                 ${log.endpoint || ""} 
                 ${log.method || ""} 
                 ${log.message || ""}`.toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === "ALL" ||
        String(log.severity || "").toUpperCase() === severityFilter;

      const matchesEvent =
        eventFilter === "ALL" ||
        String(log.event_type || "").toUpperCase() === eventFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesEvent
      );

    });

  }, [logs, search, severityFilter, eventFilter]);

  const eventTypes = [
    ...new Set(
      logs
        .map((log) =>
          String(log.event_type || "").toUpperCase()
        )
        .filter(Boolean)
    )
  ];

  return (
    <div className="app">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main">

        <Header
          onRefresh={fetchLogs}
          loading={loading}
        />

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {activePage === "dashboard" && (
          <>

            {/* Statistics */}

            <section className="stats-grid">

              <StatCard
                title="Total Logs"
                value={statistics.total}
                icon="📋"
                description="All recorded events"
              />

              <StatCard
                title="API Requests"
                value={statistics.apiRequests}
                icon="🌐"
                description="API request events"
              />

              <StatCard
                title="Warnings"
                value={statistics.warnings}
                icon="⚠️"
                description="Warning severity logs"
              />

              <StatCard
                title="Errors"
                value={statistics.errors}
                icon="🔴"
                description="Error severity logs"
              />

              <StatCard
                title="Critical"
                value={statistics.critical}
                icon="🚨"
                description="Critical security events"
              />

              <StatCard
                title="Unique IPs"
                value={statistics.uniqueIPs}
                icon="🔐"
                description="Distinct source addresses"
              />

              <StatCard
                title="Anomalies"
                value={statistics.anomalies}
                icon="🚨"
                description="Algorithm-detected events"
              />

              <StatCard
                title="Avg. Anomaly Score"
                value={statistics.averageAnomalyScore}
                icon="🎯"
                description="Average score (0–100)"
              />

            </section>

            {/* Chart */}

            <section className="dashboard-grid">

              <ActivityChart logs={logs} />

              <div className="severity-card">

                <div className="section-header">
                  <div>
                    <h3>Security Overview</h3>
                    <p>Severity distribution</p>
                  </div>
                </div>

                <div className="severity-list">

                  <div className="severity-row">
                    <span>
                      <i className="dot critical-dot"></i>
                      Critical
                    </span>

                    <strong>
                      {statistics.critical}
                    </strong>
                  </div>

                  <div className="severity-row">
                    <span>
                      <i className="dot error-dot"></i>
                      Error
                    </span>

                    <strong>
                      {statistics.errors}
                    </strong>
                  </div>

                  <div className="severity-row">
                    <span>
                      <i className="dot warning-dot"></i>
                      Warning
                    </span>

                    <strong>
                      {statistics.warnings}
                    </strong>
                  </div>

                  <div className="severity-row">
                    <span>
                      <i className="dot info-dot"></i>
                      Info
                    </span>

                    <strong>
                      {
                        logs.filter(
                          (log) =>
                            String(log.severity || "INFO")
                              .toUpperCase() === "INFO"
                        ).length
                      }
                    </strong>
                  </div>

                </div>

                <div className="security-message">

                  {statistics.critical > 0 ? (
                    <>
                      🚨 Critical security events detected.
                    </>
                  ) : statistics.errors > 0 ? (
                    <>
                      ⚠️ Error events require attention.
                    </>
                  ) : (
                    <>
                      ✅ No critical security events detected.
                    </>
                  )}

                </div>

              </div>

            </section>

            <section className="dashboard-grid">

              <TopSourceIPs logs={logs} />

              <div className="ip-insight-card">

                <div className="section-header">

                  <div>
                    <h3>IP Activity Insights</h3>

                    <p>
                      Source IP monitoring
                    </p>
                  </div>

                </div>

                <div className="ip-insight-list">

                  {logs.length === 0 ? (

                    <div className="empty-ip-insight">
                      No IP activity available.
                    </div>

                  ) : (

                    <>
                      <div className="ip-insight-row">

                        <span>
                          🌐 Unique IPs
                        </span>

                        <strong>
                          {statistics.uniqueIPs}
                        </strong>

                      </div>

                      <div className="ip-insight-row">

                        <span>
                          📋 Total Events
                        </span>

                        <strong>
                          {logs.length}
                        </strong>

                      </div>

                      <div className="ip-insight-row">

                        <span>
                          🚨 Security Events
                        </span>

                        <strong>
                          {
                            logs.filter((log) =>
                              ["WARNING", "WARN", "ERROR", "CRITICAL"]
                                .includes(
                                  String(
                                    log.severity || ""
                                  ).toUpperCase()
                                )
                            ).length
                          }
                        </strong>

                      </div>

                      <div className="ip-insight-row">

                        <span>
                          🔴 Critical Events
                        </span>

                        <strong>
                          {statistics.critical}
                        </strong>

                      </div>

                    </>

                  )}

                </div>

                <div className="ip-insight-message">

                  {statistics.critical > 0 ? (
                    <>
                      🚨 Monitor source IPs associated with
                      critical events.
                    </>
                  ) : (
                    <>
                      ✅ No critical IP activity detected.
                    </>
                  )}

                </div>

              </div>

            </section>

            {/* Filters */}

            <section className="filters-card">

              <div className="search-box">

                <span>🔍</span>

                <input
                  type="text"
                  placeholder="Search IP, event, endpoint or message..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value)
                }
              >
                <option value="ALL">
                  All Severities
                </option>

                <option value="INFO">
                  Info
                </option>

                <option value="WARNING">
                  Warning
                </option>

                <option value="ERROR">
                  Error
                </option>

                <option value="CRITICAL">
                  Critical
                </option>

              </select>

              <select
                value={eventFilter}
                onChange={(e) =>
                  setEventFilter(e.target.value)
                }
              >

                <option value="ALL">
                  All Events
                </option>

                {eventTypes.map((event) => (
                  <option
                    key={event}
                    value={event}
                  >
                    {event}
                  </option>
                ))}

              </select>

              <button
                className="clear-btn"
                onClick={() => {
                  setSearch("");
                  setSeverityFilter("ALL");
                  setEventFilter("ALL");
                }}
              >
                Clear
              </button>

            </section>

            {/* Logs */}

            <LogTable logs={filteredLogs} />

          </>
        )}

        {activePage === "create" && (
          <LogForm
            onLogCreated={fetchLogs}
          />
        )}

        {activePage === "logs" && (
          <section className="page-card">

            <h2>All Logs</h2>

            <p>
              Complete collection of logs received from the LogSense API.
            </p>

            <LogTable logs={filteredLogs} />

          </section>
        )}

        {activePage === "alerts" && <AlertCenter />}

      </main>

    </div>
  );
}

export default App;