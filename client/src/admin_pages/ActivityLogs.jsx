import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Sidebar from "../admin_components/Sidebar";
import { AppContent } from "../context/AppContext";

const ActivityLogs = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ action: "", actorType: "", targetType: "" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.actorType) params.set("actorType", filters.actorType);
    if (filters.targetType) params.set("targetType", filters.targetType);
    params.set("limit", String(pageSize));
    params.set("skip", String((page - 1) * pageSize));
    return params.toString();
  }, [filters, page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(`${backendUrl}/api/activity-logs?${queryParams}`, { withCredentials: true });
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        setError(data.message || "Failed to load logs");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [queryParams]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-64 p-6">
        <h1 className="text-2xl font-bold mb-4">Activity Logs</h1>

        <div className="bg-white p-4 rounded shadow mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            placeholder="Filter by action"
            className="border rounded px-3 py-2"
          />
          <select name="actorType" value={filters.actorType} onChange={handleFilterChange} className="border rounded px-3 py-2">
            <option value="">All actor types</option>
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
            <option value="system">system</option>
          </select>
          <input
            name="targetType"
            value={filters.targetType}
            onChange={handleFilterChange}
            placeholder="Filter by target type"
            className="border rounded px-3 py-2"
          />
          <button onClick={() => fetchLogs()} className="bg-blue-600 text-white rounded px-4 py-2">Apply</button>
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          {loading ? (
            <div className="p-6">Loading...</div>
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : (
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Actor</th>
                  <th className="px-4 py-2">Target</th>
                  <th className="px-4 py-2">Path</th>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-3" colSpan={7}>No logs found</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3">{log.actorName || log.actorId || "-"} <span className="text-gray-500">({log.actorType})</span></td>
                      <td className="px-4 py-3">{log.targetType || "-"}{log.targetId ? `:${log.targetId}` : ""}</td>
                      <td className="px-4 py-3">{log.path}</td>
                      <td className="px-4 py-3">{log.ip || "-"}</td>
                      <td className="px-4 py-3 max-w-[280px] truncate" title={JSON.stringify(log.metadata)}>
                        {(() => {
                          try { return JSON.stringify(log.metadata); } catch { return "-"; }
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Page {page} of {totalPages} • {total} total</div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >Prev</button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs; 