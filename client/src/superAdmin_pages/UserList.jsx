import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../superAdmin_components/Sidebar";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
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

  useEffect(() => {
    if (!isAdmin) {
      // Not an admin, redirect to home or another page
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



  // Search and Pagination
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
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User List</h1>
          {showAdminModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Create Admin</h2>
                {adminCreateMessage && (
                  <p
                    className={`text-sm mb-2 ${
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
                        setAdminCreateMessage(
                          `Failed: ${response.data.message}`
                        );
                      }
                    } catch (error) {
                      setAdminCreateMessage(
                        `Error: ${
                          error.response?.data?.message || error.message
                        }`
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
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                  <div className="flex justify-between gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminModal(false)}
                      className="w-full py-2 border rounded text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminCreateLoading}
                      className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {adminCreateLoading ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showSuperadminModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">Create Super Admin</h2>
                {createMessage && (
                  <p
                    className={`text-sm mb-2 ${
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
                        `${
                          import.meta.env.VITE_BACKEND_URL
                        }/api/superadmin/create`,
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
                        `Error: ${
                          error.response?.data?.message || error.message
                        }`
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
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full border px-3 py-2 rounded"
                  />
                  <div className="flex justify-between gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowSuperadminModal(false)}
                      className="w-full py-2 border rounded text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {createLoading ? "Creating..." : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {userData && userData.fullName
                  ? userData.fullName.charAt(0).toUpperCase()
                  : ""}
              </span>
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-lg font-semibold text-gray-800">
                {userData.fullName}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 text-sm">
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

        <div className="bg-white p-4 rounded-lg shadow overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-4 py-2 rounded"
            />
          </div>

          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-200 text-xs uppercase top-0 z-10">
                <tr className="bg-gray-200 text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">ICPEP ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => {
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {user.fullName}
                        </td>
                        <td className="p-3">
                          {user.userType}
                        </td>
                        <td className="p-3">
                          {user.email}
                        </td>
                        <td className="p-3">
                          {user.contactNumber}
                        </td>
                        <td className="p-3">
                          {user.icpepId}
                        </td>
                        <td className="p-3">
                          {/* Status column: checks if user.disabled is true or false */}
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
                        <td className="p-3 flex items-center gap-4">
                          {user.userType !== "superadmin" && (
                            <button
                              onClick={async () => {
                                const newStatus = !user.disabled;
                                const action = newStatus ? "disable" : "enable";
                                const result = await Swal.fire({
                                  title: `Are you sure?`,
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
                                    console.error(
                                      "Error updating user status:",
                                      error.message
                                    );
                                    Swal.fire({
                                      icon: "error",
                                      title: "Error",
                                      text: "Failed to update user status. Please try again.",
                                      confirmButtonText: "OK",
                                    });
                                  }
                                }
                              }}
                              className={`${
                                user.disabled
                                  ? "text-green-600 hover:text-green-800"
                                  : "text-red-600 hover:text-red-800"
                              } p-1 rounded-full hover:bg-gray-200 transition duration-150 ease-in-out`}
                              aria-label={
                                user.disabled ? "Enable user" : "Disable user"
                              }
                            >
                              {user.disabled ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                  />
                                </svg>
                              )}
                            </button>
                          )}

                          {user.userType === "superadmin" && (
                            <span className="text-gray-500 italic">
                              Super Admin – Cannot Edit
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-gray-500 py-4">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {filteredUsers.length > usersPerPage && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
  );
};

export default UserList;