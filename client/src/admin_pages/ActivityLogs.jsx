import React, { useState, useEffect, useContext } from "react";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { Menu } from "lucide-react";
import Sidebar from "../admin_components/Sidebar";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const ActivityLogs = () => {
  const { backendUrl, isAdmin, userData } = useContext(AppContent);
  const navigate = useNavigate();
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
        <div className="bg-gray-900 text-white flex items-center justify-between p-3 sm:p-4 shadow-md xl:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1">
            <Menu size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold">Activity Logs</h1>
          <div className="w-6 sm:w-8" /> {/* Spacer */}
        </div>

        {/* Header (desktop-style user box to match Dashboard) */}
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="hidden xl:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Activity Logs</h1>
            </div>
            {userData ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-white px-2 sm:px-3 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm sm:text-base lg:text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs sm:text-sm text-gray-500">Welcome back,</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800">{userData.fullName}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-3 sm:px-4 lg:px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all text-xs sm:text-sm lg:text-base justify-center"
              >
                Login <img src={assets.arrow_icon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Activity Logs</h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
              <input
                type="text"
                placeholder="Filter by action"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="border rounded px-2 sm:px-3 py-2 text-xs sm:text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterActorType}
                onChange={(e) => setFilterActorType(e.target.value)}
                className="border rounded px-2 sm:px-3 py-2 text-xs sm:text-sm w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="border rounded px-2 sm:px-3 py-2 text-xs sm:text-sm w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded transition text-xs sm:text-sm w-full sm:w-auto"
              >
                Apply
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm text-left border border-gray-200">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 border-b text-xs sm:text-sm">Time</th>
                    <th className="px-2 sm:px-4 py-2 border-b text-xs sm:text-sm">Action</th>
                    <th className="px-2 sm:px-4 py-2 border-b text-xs sm:text-sm hidden sm:table-cell">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-700 text-xs sm:text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 border-b text-blue-600 font-medium text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span className="truncate max-w-[150px] sm:max-w-none" title={log.action}>
                              {log.action}
                            </span>
                            <span className="text-gray-500 text-xs sm:hidden">
                              by {log.actorName} ({log.actorType})
                            </span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 border-b text-gray-700 text-xs sm:text-sm hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="font-medium">{log.actorName}</span>
                            <span className="text-gray-500 text-xs">
                              ({log.actorType})
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center text-gray-500 py-4 italic text-xs sm:text-sm"
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
              <div className="flex flex-col sm:flex-row justify-between items-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 gap-2 sm:gap-0">
                <span className="text-center sm:text-left">
                  Page {currentPage} of {totalPages} — {filteredLogs.length}{" "}
                  total
                </span>
                <div className="flex gap-1 sm:gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-200 text-xs sm:text-sm"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-200 text-xs sm:text-sm"
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
