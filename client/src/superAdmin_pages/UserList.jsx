import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../superAdmin_components/Sidebar";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";

const UserList = () => {
  const { userData } = useContext(AppContent);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [totalUsers, setTotalUsers] = useState(0);

  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/alldata`,
          { withCredentials: true }
        );

        if (response.data.success) {
          setUsers(response.data.users);
          setTotalUsers(response.data.count);
          console.log("Total users:", response.data.count); // Debugging
          console.log("Fetched users:"); // Debugging
          console.log(response.data);
        } else {
          console.error("Failed to fetch users:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSave = async (userId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/superadmin/update/${userId}`,
        editedUser,
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("User updated successfully.");
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === userId ? response.data.user : user
          )
        );
        setEditingUserId(null);
      }
    } catch (error) {
      console.error("Error updating user:", error.message);
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User List</h1>
          {userData ? (
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {userData.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-500">Welcome back,</p>
                <p className="text-lg font-semibold text-gray-800">
                  {userData.fullName}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 border border-gray-500 rounded-full px-6 py-2 text-gray-800 hover:bg-gray-100"
            >
              Login <img src={assets.arrow_icon} alt="Arrow Icon" />
            </button>
          )}
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
              <thead className="bg-gray-200 text-xs uppercase sticky top-0 z-10">
                <tr className="bg-gray-200 text-left">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">ICPEP ID</th>
                  <th className="p-3">About Us</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => {
                    const isEditing = user._id === editingUserId;

                    return (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          {isEditing ? (
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
                        <td className="p-3">{user.userType}</td>
                        <td className="p-3">
                          {isEditing ? (
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
                          {isEditing ? (
                            <input
                              value={editedUser.contactNumber}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  contactNumber: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            user.contactNumber
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
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
                            user.icpepId
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              value={editedUser.aboutMe}
                              onChange={(e) =>
                                setEditedUser({
                                  ...editedUser,
                                  aboutMe: e.target.value,
                                })
                              }
                              className="border px-2 py-1 rounded w-full"
                            />
                          ) : (
                            user.aboutMe
                          )}
                        </td>
                        <td className="p-3 flex items-center gap-4">
                          <button
                            onClick={async () => {
                              const newStatus = !user.disabled;
                              try {
                                const response = await axios.put(
                                  `${
                                    import.meta.env.VITE_BACKEND_URL
                                  }/api/superadmin/update/${user._id}`,
                                  { disabled: newStatus },
                                  { withCredentials: true }
                                );
                                if (response.status === 200) {
                                  setUsers((prevUsers) =>
                                    prevUsers.map((u) =>
                                      u._id === user._id
                                        ? { ...u, disabled: newStatus }
                                        : u
                                    )
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error updating user status:",
                                  error.message
                                );
                              }
                            }}
                            className={`${
                              user.disabled
                                ? "text-green-600 hover:underline"
                                : "text-red-600 hover:underline"
                            }`}
                          >
                            {user.disabled ? "Enable" : "Disable"}
                          </button>

                          {editingUserId === user._id ? (
                            <>
                              <button
                                onClick={() => handleSave(user._id)}
                                className="text-green-600 hover:underline"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="text-gray-600 hover:underline"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUserId(user._id);
                                setEditedUser({ ...user });
                              }}
                              className="text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
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
          {users.length > usersPerPage && (
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
