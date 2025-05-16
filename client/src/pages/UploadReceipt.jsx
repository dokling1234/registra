import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import "./UploadReceipt.css";

const UploadReceipt = () => {
  const [accountName, setAccountName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [receipt, setReceipt] = useState(null);

  const navigate = useNavigate();

  const handleUploadClick = () => {
    document.getElementById("receiptInput").click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ accountName, mobileNumber, receipt });
  };

  return (
    <div className="page-background">
      {/* Logo Top Left */}
      <img src={assets.logo} alt="GCash" className="top-logo" />
      {/* Centered Form */}
      <div className="upload-container">
        <div className="form-box">
          <div className="logo">
            <img
              src="https://logos-world.net/wp-content/uploads/2023/05/GCash-Logo.png"
              alt="GCash"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <label>Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />

            <label>Mobile Number</label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />

            <input
              id="receiptInput"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setReceipt(e.target.files[0])}
              required
            />

            <button
              type="button"
              className="upload-btn"
              onClick={handleUploadClick}
            >
              Upload Receipt
            </button>

            <div className="action-buttons">
              <button type="submit" className="register-btn">
                Register
              </button>
              <button
                type="button"
                className="register-btn cancel-btn"
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel?")) {
                    navigate(-1);
                  }
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