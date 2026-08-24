import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

const SeverityChart = ({ logs }) => {

    const getCount = (severity) => {

        return logs.filter(
            (log) =>
                String(log.severity || "INFO").toUpperCase() === severity
        ).length;

    };

    const data = [
        {
            name: "Info",
            value: getCount("INFO")
        },
        {
            name: "Warning",
            value: logs.filter((log) => {
                const severity =
                    String(log.severity || "").toUpperCase();

                return severity === "WARNING" || severity === "WARN";
            }).length
        },
        {
            name: "Error",
            value: getCount("ERROR")
        },
        {
            name: "Critical",
            value: getCount("CRITICAL")
        }
    ];

    const filteredData = data.filter(
        (item) => item.value > 0
    );

    return (
        <div className="chart-card">

            <div className="section-header">

                <div>
                    <h3>Severity Distribution</h3>

                    <p>
                        Log events by severity level
                    </p>
                </div>

            </div>

            <div className="severity-chart-container">

                {filteredData.length === 0 ? (

                    <div className="empty-chart">
                        No severity data available
                    </div>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height={280}
                    >

                        <PieChart>

                            <Pie
                                data={filteredData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                innerRadius={55}
                                paddingAngle={3}
                                label
                            >

                                {filteredData.map(
                                    (entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                        />
                                    )
                                )}

                            </Pie>

                            <Tooltip />

                            <Legend />

                        </PieChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>
    );
};

export default SeverityChart;