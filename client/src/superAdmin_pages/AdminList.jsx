import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../admin_components/Sidebar";
import { assets } from "../assets/assets";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import Swal from "sweetalert2";
import { Menu, Edit2, CheckCircle, XCircle, Save, X } from "lucide-react";

const AdminList = () => {
  const { userData, isAdmin } = useContext(AppContent);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
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

        // combine admins and users (keeps your previous logic)
        const combined = [
          ...(adminResponse.data?.admins || []),
          ...(userResponse.data?.users || []),
        ];
        setUsers(combined);
        setTotalUsers(combined.length);
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handlers for updating (kept from your original logic)
  const handleSave = async (userId) => {
    try {
      const userResponse = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/superadmin/update/${userId}`,
        editedUser,
        { withCredentials: true }
      );

      if (userResponse.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "User updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? userResponse.data.user : user
          )
        );
        setEditingUserId(null);
      }
    } catch (error) {
      console.error("Error updating user:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update user.",
      });
    }
  };

  const handleAdminSave = async (userId) => {
    try {
      const adminResponse = await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/superadmin/admin/update/${userId}`,
        editedUser,
        { withCredentials: true }
      );

      if (adminResponse.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Admin/Superadmin updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? adminResponse.data.user : user
          )
        );
        setEditingUserId(null);
      }
    } catch (error) {
      console.error("Error updating admin/superadmin:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update admin.",
      });
    }
  };

  // Filtering (AdminList context: show admins & related users — keep original filter that excludes students/professionals?).
  // Here we keep your original AdminList logic to show admin-like accounts (filter out student/professional).
  const filteredUsers = users
    .filter(
      (user) =>
        user.userType !== "student" &&
        user.userType !== "professional" &&
        user.userType !== "Professional"
    )
    .filter((user) => {
      const q = searchQuery.toLowerCase();
      return (
        user.fullName?.toLowerCase().includes(q) ||
        user.userType?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
      );
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // reusable actions renderer
  const renderActionButtons = (user) => {
    const canEditUserType =
      user.userType === "student" || user.userType === "professional";
    const canEditAdminType =
      user.userType === "admin" || user.userType === "superadmin";

    return (
      <div className="flex items-center gap-2">
        {/* Enable / Disable icon */}
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
                    }/api/superadmin/admin/update/${user._id}`,
                    { disabled: newStatus },
                    { withCredentials: true }
                  );
                  if (userResponse.status === 200) {
                    setUsers((prevUsers) =>
                      prevUsers.map((u) =>
                        u._id === user._id ? { ...u, disabled: newStatus } : u
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
            aria-label={user.disabled ? "Enable user" : "Disable user"}
            title={user.disabled ? "Enable user" : "Disable user"}
            className={`p-1 rounded-md hover:bg-gray-100 transition ${
              user.disabled ? "text-green-600" : "text-red-600"
            }`}
          >
            {user.disabled ? <CheckCircle size={18} /> : <XCircle size={18} />}
          </button>
        ) : (
          <span className="text-gray-500 italic text-sm">Super Admin</span>
        )}

        {/* Edit / Save / Cancel */}
        {editingUserId === user._id ? (
          <>
            {/* Save */}
            <button
              onClick={() =>
                canEditAdminType
                  ? handleAdminSave(user._id)
                  : handleSave(user._id)
              }
              aria-label="Save changes"
              title="Save"
              className="p-1 rounded-md hover:bg-gray-100 transition text-green-600"
            >
              <Save size={18} />
            </button>

            {/* Cancel */}
            <button
              onClick={() => setEditingUserId(null)}
              aria-label="Cancel editing"
              title="Cancel"
              className="p-1 rounded-md hover:bg-gray-100 transition text-gray-600"
            >
              <X size={18} />
            </button>
          </>
        ) : (
          (canEditUserType || canEditAdminType) && (
            <button
              onClick={() => {
                setEditingUserId(user._id);
                setEditedUser({ ...user });
              }}
              aria-label="Edit user"
              title="Edit"
              className="p-1 rounded-md hover:bg-gray-100 transition text-blue-600"
            >
              <Edit2 size={18} />
            </button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex flex-col flex-1 xl:ml-64 transition-all duration-300">
        {/* Mobile top bar */}
        <div className="bg-gray-900 text-white flex items-center justify-between p-4 shadow-md xl:hidden sticky top-0 z-50">
          <button onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
            <Menu size={24} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold">Admin List</h1>
          <div className="w-6" />
        </div>

        <main className="flex-1 p-3 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="hidden xl:block">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Administrator List
              </h1>
            </div>

            {userData ? (
              <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-auto justify-center sm:justify-end">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-base sm:text-lg">
                    {userData.fullName?.charAt(0).toUpperCase()}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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
                            <td className="p-3">
                              {editingUserId === user._id ? (
                                <input
                                  value={editedUser.fullName}
                                  onChange={(e) =>
                                    setEditedUser({
                                      ...editedUser,
                                      fullName: e.target.value,
                                    })
                                  }
                                  className="border px-2 py-1 rounded w-full"
                                />
                              ) : (
                                user.fullName
                              )}
                            </td>
                            <td className="p-3">
                              {editingUserId === user._id ? (
                                user.userType === "admin" ||
                                user.userType === "superadmin" ? (
                                  <select
                                    value={editedUser.userType}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        userType: e.target.value,
                                      })
                                    }
                                    className="border px-2 py-1 rounded w-full"
                                  >
                                    <option value="admin">admin</option>
                                    <option value="superadmin">
                                      superadmin
                                    </option>
                                  </select>
                                ) : (
                                  <select
                                    value={editedUser.userType}
                                    onChange={(e) =>
                                      setEditedUser({
                                        ...editedUser,
                                        userType: e.target.value,
                                      })
                                    }
                                    className="border px-2 py-1 rounded w-full"
                                  >
                                    <option value="student">Student</option>
                                    <option value="professional">
                                      Professional
                                    </option>
                                  </select>
                                )
                              ) : (
                                user.userType
                              )}
                            </td>
                            <td className="p-3">
                              {editingUserId === user._id ? (
                                <input
                                  value={editedUser.email}
                                  onChange={(e) =>
                                    setEditedUser({
                                      ...editedUser,
                                      email: e.target.value,
                                    })
                                  }
                                  className="border px-2 py-1 rounded w-full"
                                />
                              ) : (
                                user.email
                              )}
                            </td>
                            <td className="p-3">
                              {user.contactNumber || "N/A"}
                            </td>
                            <td className="p-3">
                              {editingUserId === user._id ? (
                                <input
                                  value={editedUser.icpepId}
                                  onChange={(e) =>
                                    setEditedUser({
                                      ...editedUser,
                                      icpepId: e.target.value,
                                    })
                                  }
                                  className="border px-2 py-1 rounded w-full"
                                />
                              ) : (
                                user.icpepId || "N/A"
                              )}
                            </td>
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
                              {renderActionButtons(user)}
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
                            {editingUserId === user._id ? (
                              <input
                                value={editedUser.fullName}
                                onChange={(e) =>
                                  setEditedUser({
                                    ...editedUser,
                                    fullName: e.target.value,
                                  })
                                }
                                className="border px-2 py-1 rounded w-full"
                              />
                            ) : (
                              user.fullName
                            )}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {user.userType}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Email:</span>{" "}
                          {editingUserId === user._id ? (
                            <input
                              value={editedUser.email}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  email: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            user.email
                          )}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Contact:</span>{" "}
                          {user.contactNumber || "N/A"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">ICPEP ID:</span>{" "}
                          {editingUserId === user._id ? (
                            <input
                              value={editedUser.icpepId}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  icpepId: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            user.icpepId || "N/A"
                          )}
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
                                      }/api/superadmin/admin/update/${
                                        user._id
                                      }`,
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

                          {/* Edit / Save / Cancel (mobile) */}
                          <div className="mt-2">
                            {renderActionButtons(user)}
                          </div>
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
                    `${import.meta.env.VITE_BACKEND_URL}/api/superadmin/create`,
                    { fullName: newfullName, email: newEmail },
                    { withCredentials: true }
                  );
                  if (response.data.success) {
                    setCreateMessage("Super Admin created successfully!");
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

export default AdminList;
