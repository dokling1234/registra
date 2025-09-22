import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const COLORS = ["#0088FE", "#FF8042"]; // Blue for Attended, Orange for No-show

export default function AttendancePie() {
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/admin/events/analytics",
          { withCredentials: true }
        );

        if (res.data && res.data.attendanceStats.length > 0) {
          const allCharts = res.data.attendanceStats.map((event) => ({
            title: event.title, // make sure this matches your backend field
            data: [
              { name: "Attended", value: event.attended },
              { name: "No-show", value: event.noShow },
            ],
          }));
          setCharts(allCharts);
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      {charts.map((chart, idx) => (
        <div
          key={idx}
          className="w-full h-80 p-4 bg-white shadow rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-4">{chart.title}</h2>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chart.data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
