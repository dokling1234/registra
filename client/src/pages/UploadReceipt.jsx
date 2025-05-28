import React, { useState, useEffect, useContext } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { assets } from "../assets/assets";
import axios from "axios";
import "./UploadReceipt.css";
import Swal from "sweetalert2";
import { AppContent } from "../context/AppContext";

const UploadReceipt = () => {
  const { id } = useParams();
  const { userData } = useContext(AppContent);
  const [accountName, setAccountName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const navigate = useNavigate();
  // Set userData to form fields when component mounts
  useEffect(() => {
    if (userData) {
      setAccountName(userData.fullName || "");
      setMobileNumber(userData.contactNumber || "");
    }
  }, [userData]);

  const handleUploadClick = () => {
    document.getElementById("receiptInput").click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setReceipt(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

const handleRegister = async (e) => {
    e.preventDefault();

    let imageUrl = "";

    try {
      // Upload to Cloudinary
      if (receipt) {
        const formData = new FormData();
        formData.append("file", receipt);
        formData.append("upload_preset", "event_preset"); // your cloudinary preset

        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dqbnc38or/image/upload",
          formData,
          {
            withCredentials: false,
          }
        );

        imageUrl = uploadRes.data.secure_url;
        console.log("Cloudinary upload success:", imageUrl);
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      // toast.error("Image upload failed. Please check your network or try a smaller image.");
      return;
    }

    try {
      // Submit registration to your backend
      await axios.post(
        `/api/admin/event_register/${id}`,
        {
          fullName: userData.fullName,
          userId: userData.id,
          userType: userData.userType,
          receipt: imageUrl, // Include uploaded image URL
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Your receipt and details have been submitted.",
      }).then(() => {
        navigate("/home");
      });

      console.log({ accountName, mobileNumber, receipt, receiptUrl: imageUrl });

    } catch (err) {
      console.error("Backend registration error:", err);
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "There was a problem submitting your registration.",
      });
    }
  };

  return (
    <div className="page-background">
      <img src={assets.logo} alt="GCash" className="top-logo" />

      <div className="upload-container">
        <div className="form-box">
          <div className="logo">
            <img
              src="https://logos-world.net/wp-content/uploads/2023/05/GCash-Logo.png"
              alt="GCash"
            />
          </div>

          <form onSubmit={handleRegister}>
            <label>Account Name</label>
            <input
              type="text"
              className="account-name"
              value={accountName}
              readOnly
            />

            <label>Mobile Number</label>
            <input
              type="text"
              className="mobile-number"
              value={mobileNumber}
              readOnly
            />

            <input
              id="receiptInput"
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept="image/*"
              required
            />

            <button
              type="button"
              className="upload-btn"
              onClick={handleUploadClick}
            >
              Upload Receipt
            </button>

            {previewUrl && (
              <div className="receipt-preview">
                <img src={previewUrl} alt="Receipt Preview" />
              </div>
            )}

            <div className="action-buttons">
              <button type="submit" className="register-btn">
                Register
              </button>
              <button
                type="button"
                className="register-btn cancel-btn"
                onClick={() => {
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
