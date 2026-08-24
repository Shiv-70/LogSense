const Header = ({ onRefresh, loading }) => {
    return (
        <header className="header">

            <div>
                <h1>Security Dashboard</h1>
                <p>Monitor and analyze application logs in real time</p>
            </div>

            <div className="header-actions">

                <div className="connection">
                    <span className="status-dot"></span>
                    API Online
                </div>

                <button
                    className="refresh-btn"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    {loading ? "⟳ Loading..." : "↻ Refresh"}
                </button>

            </div>

        </header>
    );
};

export default Header;