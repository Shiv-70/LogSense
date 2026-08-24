import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

const TopSourceIPs = ({ logs }) => {

    const ipCounts = {};

    logs.forEach((log) => {

        const ip = log.source_ip;

        if (!ip) {
            return;
        }

        ipCounts[ip] = (ipCounts[ip] || 0) + 1;

    });

    const data = Object.entries(ipCounts)
        .map(([ip, count]) => ({
            ip,
            count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return (
        <div className="chart-card top-ip-card">

            <div className="section-header">

                <div>
                    <h3>Top Source IPs</h3>

                    <p>
                        IP addresses generating the most events
                    </p>
                </div>

                <span className="chart-badge">
                    Top 5
                </span>

            </div>

            <div className="top-ip-chart">

                {data.length === 0 ? (

                    <div className="empty-chart">
                        No IP data available
                    </div>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height={280}
                    >

                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                top: 10,
                                right: 20,
                                left: 20,
                                bottom: 10
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />

                            <XAxis
                                type="number"
                                allowDecimals={false}
                            />

                            <YAxis
                                type="category"
                                dataKey="ip"
                                width={100}
                            />

                            <Tooltip
                                formatter={(value) => [
                                    value,
                                    "Events"
                                ]}
                            />

                            <Bar
                                dataKey="count"
                                name="Events"
                                radius={[0, 5, 5, 0]}
                            />

                        </BarChart>

                    </ResponsiveContainer>

                )}

            </div>

        </div>
    );
};

export default TopSourceIPs;