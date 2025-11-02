import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import axios from "axios";
import Swal from "sweetalert2";
import { AppContent } from "../context/AppContext";

const UploadReceipt = () => {
  const { id } = useParams();
  const { userData, isAdmin } = useContext(AppContent);
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // NEW for percentage
  const navigate = useNavigate();

  // Redirect if admin
  useEffect(() => {
    if (isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  const handleUploadClick = () => {
    if (!loading) {
      document.getElementById("receiptInput").click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceipt(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveReceipt = () => {
    setReceipt(null);
    setPreviewUrl(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!receipt) {
      Swal.fire({
        icon: "error",
        title: "No Receipt Uploaded",
        text: "Please upload your receipt before registering.",
      });
      return;
    }

    setLoading(true);
    setLoadingMessage("Uploading Receipt...");
    setUploadProgress(0);

    let imageUrl = "";

    try {
      const formData = new FormData();
      formData.append("file", receipt);
      formData.append("upload_preset", "event_preset");

      const uploadRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dqbnc38or/image/upload",
        formData,
        {
          withCredentials: false,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          },
        }
      );

      imageUrl = uploadRes.data.secure_url;
    } catch (err) {
      setLoading(false);
      setLoadingMessage("");
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Image upload failed. Please check your network or try again.",
      });
      return;
    }

    try {
      setLoadingMessage("Registering...");
      setUploadProgress(0);

      await axios.post(
        `/api/admin/event_register/${id}`,
        {
          fullName: userData.fullName,
          userId: userData.id,
          userType: userData.userType,
          receipt: imageUrl,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setLoading(false);
      setLoadingMessage("");
      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Your receipt and details have been submitted.",
      }).then(() => {
        navigate("/home");
      });
    } catch (err) {
      setLoading(false);
      setLoadingMessage("");
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "There was a problem submitting your registration.",
      });
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen w-full px-4 
      bg-gradient-to-br from-blue-200 via-sky-300 to-sky-500 relative"
    >
      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>

          {/* Dynamic Message */}
          <p className="mt-4 text-white font-semibold text-lg">
            {loadingMessage}
          </p>

          {/* Upload progress info */}
          {loadingMessage === "Uploading Receipt..." && (
            <div className="mt-3 w-64">
              <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-400 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-blue-200 text-sm text-center">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}
        </div>
      )}

      {/* Logo (center on mobile, top-left on sm+) */}
      <img
        src={assets.logo}
        alt="Logo"
        className="
          absolute top-8 left-1/2 -translate-x-1/2   
          sm:left-5 sm:translate-x-0                 
          w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40
          cursor-pointer transition-transform duration-300 hover:scale-105
        "
      />

      {/* Upload Container */}
      <div className="flex items-center justify-center w-full">
        <div
          className="
          bg-white p-6 sm:p-8 md:p-10 
          w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl 
          rounded-2xl shadow-2xl text-center transition-all
          mt-28 sm:mt-0
        "
        >
          {/* GCash Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="https://logos-world.net/wp-content/uploads/2023/05/GCash-Logo.png"
              alt="GCash"
              className="w-28 sm:w-32 md:w-36 lg:w-40"
            />
          </div>

          {/* Form */}
          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-4 text-left"
          >
            {/* Account Name */}
            <div>
              <label className="text-base sm:text-sm text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 
                           bg-gray-100 text-gray-700 text-base sm:text-sm 
                           cursor-not-allowed"
                value={"ICpEPNCR"}
                readOnly
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-base sm:text-sm text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 
                           bg-gray-100 text-gray-700 text-base sm:text-sm 
                           cursor-not-allowed"
                value={"09876543211"}
                readOnly
              />
            </div>

            {/* Upload Receipt */}
            <input
              id="receiptInput"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />

            {!previewUrl && (
              <button
                type="button"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white 
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-700"
                  } 
                  transition text-base sm:text-sm`}
                onClick={handleUploadClick}
              >
                Upload Receipt
              </button>
            )}

            {/* Preview */}
            {previewUrl && (
              <div
                className="mt-3 flex flex-col items-center w-full 
                max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl 
                rounded-xl bg-gray-100 p-2"
              >
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="w-full h-auto max-h-72 md:max-h-80 object-contain 
                             rounded-lg shadow-md"
                />
                <button
                  type="button"
                  disabled={loading}
                  className={`mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm 
                    ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    } 
                    text-white transition`}
                  onClick={handleRemoveReceipt}
                >
                  Change Receipt
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white 
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } 
                  transition text-base sm:text-sm`}
              >
                Register
              </button>
              <button
                type="button"
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold text-white 
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  } 
                  transition text-base sm:text-sm`}
                onClick={() => {
                  if (loading) return;
                  Swal.fire({
                    title: "Are you sure?",
                    text: "Your input will be lost.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, cancel it",
                    cancelButtonText: "No, stay here",
                  }).then((result) => {
                    if (result.isConfirmed) {
                      navigate(-1);
                    }
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;
