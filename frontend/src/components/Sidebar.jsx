const Sidebar = ({ activePage, setActivePage }) => {
    return (
        <aside className="sidebar">

            <div className="logo">
                <div className="logo-icon">🛡️</div>
                <div>
                    <h2>LogSense</h2>
                    <span>Security Monitor</span>
                </div>
            </div>

            <nav className="sidebar-nav">

                <p className="nav-title">MAIN</p>

                <button
                    className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
                    onClick={() => setActivePage("dashboard")}
                >
                    <span>📊</span>
                    Dashboard
                </button>

                <button
                    className={activePage === "logs" ? "nav-item active" : "nav-item"}
                    onClick={() => setActivePage("logs")}
                >
                    <span>📋</span>
                    Logs
                </button>

                <button
                    className={`nav-item ${activePage === "create" ? "active" : ""
                        }`}
                    onClick={() => setActivePage("create")}
                >
                    <span>➕</span>
                    <span>Create Log</span>
                </button>

                <button
                    className={activePage === "alerts" ? "nav-item active" : "nav-item"}
                    onClick={() => setActivePage("alerts")}
                >
                    <span>🚨</span>
                    Alerts
                </button>

                <p className="nav-title">SYSTEM</p>

                <button className="nav-item">
                    <span>⚙️</span>
                    Settings
                </button>

            </nav>

            <div className="sidebar-bottom">
                <div className="server-status">
                    <span className="status-dot"></span>
                    <div>
                        <strong>System Online</strong>
                        <small>API Connected</small>
                    </div>
                </div>
            </div>

        </aside>
    );
};

export default Sidebar;