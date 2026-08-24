import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

const ActivityChart = ({ logs }) => {

    const grouped = {};

    logs.forEach((log) => {

        const date = new Date(log.timestamp);

        if (isNaN(date.getTime())) return;

        const hour =
            date.getHours().toString().padStart(2, "0") + ":00";

        grouped[hour] = (grouped[hour] || 0) + 1;
    });

    const data = Object.keys(grouped)
        .sort()
        .map((hour) => ({
            time: hour,
            requests: grouped[hour]
        }));

    return (
        <div className="chart-card">

            <div className="section-header">
                <div>
                    <h3>Log Activity</h3>
                    <p>Requests recorded by time</p>
                </div>
            </div>

            <div className="chart-container">

                {data.length === 0 ? (
                    <div className="empty-chart">
                        No activity data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar
                                dataKey="requests"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}

            </div>

        </div>
    );
};

export default ActivityChart;