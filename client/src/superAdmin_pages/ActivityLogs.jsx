import React, { useState, useEffect, useContext } from "react";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { Menu } from "lucide-react";
import Sidebar from "../superAdmin_components/Sidebar";

const ActivityLogs = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("");
  const [filterActorType, setFilterActorType] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const logsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, []);

  const queryParams = (() => {
    const params = new URLSearchParams();
    if (filterAction) params.append("action", filterAction);
    if (filterActorType && filterActorType !== "All")
      params.append("actorType", filterActorType);
    if (filterTargetType) params.append("targetType", filterTargetType);
    params.append("page", currentPage);
    params.append("limit", logsPerPage);
    return params.toString();
  })();
  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/activity-logs?${queryParams}`,
        { withCredentials: true }
      );
      if (data.success) {
        setLogs(data.logs || []);
        setFilteredLogs(data.logs || []); // show results immediately
        setTotal(data.total ?? (data.logs ? data.logs.length : 0));
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

  const applyFilters = () => {
    let filtered = logs;

    if (filterAction)
      filtered = filtered.filter((log) =>
        log.action.toLowerCase().includes(filterAction.toLowerCase())
      );

    if (filterActorType && filterActorType !== "All")
      filtered = filtered.filter((log) => log.actorType === filterActorType);

    if (filterTargetType)
      filtered = filtered.filter(
        (log) =>
          log.targetType &&
          log.targetType.toLowerCase().includes(filterTargetType.toLowerCase())
      );

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + logsPerPage
  );
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content */}
      <div className="flex flex-col flex-1 xl:ml-64 transition-all duration-300">
        {/* Header (for mobile) */}
        <div className="bg-gray-900 text-white flex items-center justify-between p-4 shadow-md xl:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold">Activity Logs</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Filter by action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterActorType}
                onChange={(e) => setFilterActorType(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All actor types</option>
                <option value="system">System</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                placeholder="Filter by target type"
                value={filterTargetType}
                onChange={(e) => setFilterTargetType(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              >
                Apply
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border border-gray-200">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-2 border-b">Time</th>
                    <th className="px-4 py-2 border-b">Action</th>
                    <th className="px-4 py-2 border-b">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2 border-b text-gray-700">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 border-b text-blue-600 font-medium">
                          {log.action}
                        </td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          {log.actorName}{" "}
                          <span className="text-gray-500 text-xs">
                            ({log.actorType})
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center text-gray-500 py-4 italic"
                      >
                        No activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                <span>
                  Page {currentPage} of {totalPages} — {filteredLogs.length}{" "}
                  total
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-200"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLogs;
