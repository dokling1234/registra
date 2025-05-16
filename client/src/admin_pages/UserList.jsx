import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../admin_components/Sidebar";
import { AppContent } from "../context/AppContext";
import { assets } from "../assets/assets";
import axios from "axios";

const UserList = () => {
  const { userData } = useContext(AppContent);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
            <div className="w-10 h-10 flex justify-center items-center rounded-full bg-black text-white text-lg">
              {userData.fullName[0].toUpperCase()}
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
                  currentUsers.map((user, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{user.fullName}</td>
                      <td className="p-3">{user.userType}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.contactNumber}</td>
                      <td className="p-3">{user.icpepId}</td>
                      <td className="p-3">{user.aboutMe}</td>
                      <td className="p-3">
                        <select
                          className="border rounded px-2 py-1"
                          defaultValue={
                            user.isVerified ? "active" : "inactive"
                          }
                          onChange={async (e) => {
                            const newStatus = e.target.value === "active";
                            try {
                              const response = await axios.put(
                                `${
                                  import.meta.env.VITE_BACKEND_URL
                                }/api/user/update`,
                                {
                                  userId: user._id,
                                  isVerified: newStatus,
                                },
                                { withCredentials: true }
                              );
                              if (response.data.success) {
                                console.log(
                                  `User ${user.fullName} status updated to ${
                                    newStatus ? "active" : "inactive"
                                  }`
                                );
                                if (!newStatus) {
                                  alert(
                                    `User ${user.fullName}'s account has been frozen.`
                                  );
                                }
                                setUsers((prevUsers) =>
                                  prevUsers.map((u) =>
                                    u._id === user._id
                                      ? { ...u, isVerified: newStatus }
                                      : u
                                  )
                                );
                              } else {
                                console.error(
                                  "Failed to update user status:",
                                  response.data.message
                                );
                              }
                            } catch (error) {
                              console.error(
                                "Error updating user status:",
                                error.message
                              );
                            }
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                    </tr>
                  ))
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