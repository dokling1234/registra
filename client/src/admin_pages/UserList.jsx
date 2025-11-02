import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../admin_components/Sidebar";
import { Menu } from "lucide-react";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import Swal from "sweetalert2";

const UserList = () => {
  const { userData, isAdmin } = useContext(AppContent);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);
  const [showSuperadminModal, setShowSuperadminModal] = useState(false);
  const [newfullName, setNewfullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminfullName, setAdminfullName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCreateLoading, setAdminCreateLoading] = useState(false);
  const [adminCreateMessage, setAdminCreateMessage] = useState("");
  const usersPerPage = 10;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/alldata`,
          { withCredentials: true }
        );
        const adminResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/alldata`,
          { withCredentials: true }
        );
        if (userResponse.data.success) {
          setUsers([...adminResponse.data.admins, ...userResponse.data.users]);
          setTotalUsers(
            adminResponse.data.admins.length + userResponse.data.users.length
          );
        } else {
          console.error("Failed to fetch users:", userResponse.data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users
    .filter(
      (user) => user.userType !== "admin" && user.userType !== "superadmin"
    )
    .filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        user.fullName?.toLowerCase().includes(query) ||
        user.userType?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex flex-col flex-1 xl:ml-64 transition-all duration-300">
        {/* Mobile top bar */}
        <div className="bg-gray-900 text-white flex items-center justify-between p-4 shadow-md xl:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold">User List</h1>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-3 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="hidden xl:block">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                User List
              </h1>
            </div>

            {userData ? (
              <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-base sm:text-lg">
                    {userData.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Welcome back,
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-gray-800">
                    {userData.fullName}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 border border-gray-500 rounded-full px-3 sm:px-6 py-2 text-gray-800 hover:bg-gray-100 transition-all text-xs sm:text-base justify-center"
              >
                Login <img src={assets.arrow_icon} alt="" />
              </button>
            )}
          </div>

          {/* Create buttons */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-2 text-sm">
            <div className="flex gap-4">
              <button
                onClick={() => setShowAdminModal(true)}
                className="text-blue-600 hover:underline"
              >
                Create Admin
              </button>
              <button
                onClick={() => setShowSuperadminModal(true)}
                className="text-purple-600 hover:underline"
              >
                Create Super Admin
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border px-3 py-2 rounded w-full sm:w-auto text-sm"
              />
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-4 text-sm">
                Loading users...
              </p>
            ) : (
              <>
                {/* Table for tablet & desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm text-left text-gray-700 border-collapse">
                    <thead className="bg-gray-200 uppercase text-xs">
                      <tr>
                        <th className="p-3 whitespace-nowrap">Name</th>
                        <th className="p-3 whitespace-nowrap">Type</th>
                        <th className="p-3 whitespace-nowrap">Email</th>
                        <th className="p-3 whitespace-nowrap">Contact</th>
                        <th className="p-3 whitespace-nowrap">ICPEP ID</th>
                        <th className="p-3 whitespace-nowrap">Status</th>
                        <th className="p-3 whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.length > 0 ? (
                        currentUsers.map((user, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3">{user.fullName}</td>
                            <td className="p-3">{user.userType}</td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">{user.contactNumber}</td>
                            <td className="p-3">{user.icpepId}</td>
                            <td className="p-3">
                              {user.disabled ? (
                                <span className="text-red-600 font-semibold">
                                  Disabled
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">
                                  Enabled
                                </span>
                              )}
                            </td>
                            <td className="p-3 flex flex-wrap items-center gap-2">
                              {user.userType !== "superadmin" ? (
                                <button
                                  onClick={async () => {
                                    const newStatus = !user.disabled;
                                    const action = newStatus
                                      ? "disable"
                                      : "enable";
                                    const result = await Swal.fire({
                                      title: "Are you sure?",
                                      text: `Do you want to ${action} this user's account?`,
                                      icon: "warning",
                                      showCancelButton: true,
                                      confirmButtonColor: "#3085d6",
                                      cancelButtonColor: "#d33",
                                      confirmButtonText: `Yes, ${action} it!`,
                                    });

                                    if (result.isConfirmed) {
                                      try {
                                        const userResponse = await axios.put(
                                          `${
                                            import.meta.env.VITE_BACKEND_URL
                                          }/api/superadmin/update/${user._id}`,
                                          { disabled: newStatus },
                                          { withCredentials: true }
                                        );
                                        if (userResponse.status === 200) {
                                          setUsers((prevUsers) =>
                                            prevUsers.map((u) =>
                                              u._id === user._id
                                                ? { ...u, disabled: newStatus }
                                                : u
                                            )
                                          );
                                          Swal.fire({
                                            icon: "success",
                                            title: "Success!",
                                            text: `User account has been ${action}d.`,
                                            timer: 1500,
                                            showConfirmButton: false,
                                          });
                                        }
                                      } catch (error) {
                                        Swal.fire({
                                          icon: "error",
                                          title: "Error",
                                          text: "Failed to update user status.",
                                        });
                                      }
                                    }
                                  }}
                                  className={`${
                                    user.disabled
                                      ? "text-green-600 hover:text-green-800"
                                      : "text-red-600 hover:text-red-800"
                                  } text-sm`}
                                >
                                  {user.disabled ? "Enable" : "Disable"}
                                </button>
                              ) : (
                                <span className="text-gray-500 italic text-sm">
                                  Super Admin – Cannot Edit
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="text-center text-gray-500 py-4"
                          >
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="block sm:hidden space-y-4">
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-gray-50 shadow-sm"
                      >
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">
                            {user.fullName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {user.userType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Email:</span>{" "}
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Contact:</span>{" "}
                          {user.contactNumber || "N/A"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">ICPEP ID:</span>{" "}
                          {user.icpepId || "N/A"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Status:</span>{" "}
                          {user.disabled ? (
                            <span className="text-red-600">Disabled</span>
                          ) : (
                            <span className="text-green-600">Enabled</span>
                          )}
                        </p>

                        <div className="mt-3">
                          {user.userType !== "superadmin" ? (
                            <button
                              onClick={async () => {
                                const newStatus = !user.disabled;
                                const action = newStatus ? "disable" : "enable";
                                const result = await Swal.fire({
                                  title: "Are you sure?",
                                  text: `Do you want to ${action} this user's account?`,
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonColor: "#3085d6",
                                  cancelButtonColor: "#d33",
                                  confirmButtonText: `Yes, ${action} it!`,
                                });

                                if (result.isConfirmed) {
                                  try {
                                    const userResponse = await axios.put(
                                      `${
                                        import.meta.env.VITE_BACKEND_URL
                                      }/api/admin/update/${user._id}`,
                                      { disabled: newStatus },
                                      { withCredentials: true }
                                    );
                                    if (userResponse.status === 200) {
                                      setUsers((prevUsers) =>
                                        prevUsers.map((u) =>
                                          u._id === user._id
                                            ? { ...u, disabled: newStatus }
                                            : u
                                        )
                                      );
                                      Swal.fire({
                                        icon: "success",
                                        title: "Success!",
                                        text: `User account has been ${action}d.`,
                                        timer: 1500,
                                        showConfirmButton: false,
                                      });
                                    }
                                  } catch (error) {
                                    Swal.fire({
                                      icon: "error",
                                      title: "Error",
                                      text: "Failed to update user status.",
                                    });
                                  }
                                }
                              }}
                              className={`w-full py-2 mt-2 text-sm rounded ${
                                user.disabled
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              {user.disabled ? "Enable" : "Disable"}
                            </button>
                          ) : (
                            <p className="text-gray-500 italic text-xs mt-2 text-center">
                              Super Admin – Cannot Edit
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm">
                      No users found.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Pagination */}
            {filteredUsers.length > usersPerPage && (
              <div className="flex flex-wrap justify-between items-center mt-4 text-xs sm:text-sm text-gray-600 gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ---- Responsive Modals ---- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-lg p-6 animate-slideUp">
            <h2 className="text-lg font-bold mb-4 text-center sm:text-left">
              Create Admin
            </h2>
            {adminCreateMessage && (
              <p
                className={`text-sm mb-2 text-center sm:text-left ${
                  adminCreateMessage.startsWith("Error") ||
                  adminCreateMessage.startsWith("Failed")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {adminCreateMessage}
              </p>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAdminCreateLoading(true);
                setAdminCreateMessage("");
                try {
                  const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/admin/create`,
                    { fullName: adminfullName, email: adminEmail },
                    { withCredentials: true }
                  );
                  if (response.data.success) {
                    setAdminCreateMessage("Admin created successfully!");
                    setAdminfullName("");
                    setAdminEmail("");
                    setUsers((prev) => [...prev, response.data.user]);
                  } else {
                    setAdminCreateMessage(`Failed: ${response.data.message}`);
                  }
                } catch (error) {
                  setAdminCreateMessage(
                    `Error: ${error.response?.data?.message || error.message}`
                  );
                } finally {
                  setAdminCreateLoading(false);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={adminfullName}
                onChange={(e) => setAdminfullName(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="w-full py-2 border rounded text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminCreateLoading}
                  className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {adminCreateLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuperadminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-lg p-6 animate-slideUp">
            <h2 className="text-lg font-bold mb-4 text-center sm:text-left">
              Create Super Admin
            </h2>
            {createMessage && (
              <p
                className={`text-sm mb-2 text-center sm:text-left ${
                  createMessage.startsWith("Error") ||
                  createMessage.startsWith("Failed")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {createMessage}
              </p>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreateLoading(true);
                setCreateMessage("");
                try {
                  const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/admin/create`,
                    { fullName: newfullName, email: newEmail },
                    { withCredentials: true }
                  );
                  if (response.data.success) {
                    setCreateMessage("Admin created successfully!");
                    setNewfullName("");
                    setNewEmail("");
                    setUsers((prev) => [...prev, response.data.user]);
                  } else {
                    setCreateMessage(`Failed: ${response.data.message}`);
                  }
                } catch (error) {
                  setCreateMessage(
                    `Error: ${error.response?.data?.message || error.message}`
                  );
                } finally {
                  setCreateLoading(false);
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Full Name"
                value={newfullName}
                onChange={(e) => setNewfullName(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSuperadminModal(false)}
                  className="w-full py-2 border rounded text-gray-600 hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  {createLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
