import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";

const ResetPassword = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // States
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isOtpSubmited, setIsOtpSubmited] = useState(false);
  const [otp, setOtp] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [emailLoading, setEmailLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(false);
  const [btnError, setBtnError] = useState(false);

  const [showPasswords, setShowPasswords] = useState({ newPassword: false });
  const [alert, setAlert] = useState(null);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Redirect if admin
  useEffect(() => {
    if (isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    paste.split("").forEach((char, index) => {
      if (inputRefs.current[index]) inputRefs.current[index].value = char;
    });
  };

  const triggerErrorEffect = () => {
    setError(true);
    setTimeout(() => setError(false), 600);
    inputRefs.current.forEach((el) => (el.value = ""));
    inputRefs.current[0]?.focus();
  };

  const getPasswordStrength = (password) => {
    if (!password) return "";
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (strongRegex.test(password)) return "strong";
    if (mediumRegex.test(password)) return "medium";
    return "weak";
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Email submit
  const onSubmitEmail = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || emailLoading) return;

    setEmailLoading(true);
    setAlert(null);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-reset-otp`,
        { email }
      );
      if (data.success) {
        setIsEmailSent(true);
        setCooldown(40);
        setAlert({ type: "success", message: "OTP sent to your email." });
      } else {
        setAlert({ type: "error", message: data.message });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Failed to send OTP.",
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Resend OTP
  const resendOtpHandler = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setAlert(null);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-reset-otp`,
        { email }
      );
      if (data.success) {
        setCooldown(40);
        setAlert({ type: "success", message: "A new OTP has been sent." });
      } else {
        setAlert({ type: "error", message: data.message });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Failed to resend OTP.",
      });
      setBtnError(true);
      setTimeout(() => setBtnError(false), 600);
    } finally {
      setResendLoading(false);
    }
  };

  // OTP submit
  const onSubmitOTP = async (e) => {
    e.preventDefault();
    if (verifyLoading) return;
    setVerifyLoading(true);
    setAlert(null);

    const enteredOtp = inputRefs.current.map((i) => i.value).join("");
    if (enteredOtp.length !== 6) {
      setAlert({ type: "error", message: "Please enter the 6-digit OTP." });
      setVerifyLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/verify-reset-otp`,
        { email, otp: enteredOtp }
      );
      if (data.success) {
        setOtp(enteredOtp);
        setIsOtpSubmited(true);
        setAlert({ type: "success", message: "OTP verified successfully!" });
      } else {
        setAlert({ type: "error", message: data.message || "Invalid OTP" });
        triggerErrorEffect();
      }
    } catch {
      setAlert({
        type: "error",
        message: "Verification failed. Please try again.",
      });
      triggerErrorEffect();
    } finally {
      setVerifyLoading(false);
    }
  };

  // New password submit
  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    if (passwordLoading) return;
    setPasswordLoading(true);
    setAlert(null);

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setAlert({
        type: "error",
        message:
          "Password must be 8+ chars, include uppercase, lowercase, number & special char.",
      });
      setPasswordLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/reset-password`,
        { email, newPassword }
      );
      if (data.success) {
        setAlert({
          type: "success",
          message: "Password reset successfully! Redirecting...",
        });
        setTimeout(() => navigate("/"), 1500);
      } else {
        setAlert({ type: "error", message: data.message });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ✅ Alert Component
  const AlertMessage = ({ type, message }) => {
    return (
      <div
        className={`mt-4 flex items-center justify-center gap-2 transition-all duration-500 ${
          type === "success" ? "text-green-400" : "text-red-400"
        }`}
      >
        {type === "success" ? (
          <span className="w-5 h-5 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center">✖</span>
        )}
        <span className="font-semibold text-sm sm:text-base">{message}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      {/* ✅ Logo Top Center */}
      <div className="w-full flex justify-center mb-6 sm:mb-10">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="logo"
          className="w-20 sm:w-28 md:w-32 cursor-pointer"
        />
      </div>

      {/* Email Form */}
      {!isEmailSent && (
        <form
          onSubmit={onSubmitEmail}
          className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg text-sm"
        >
          <h1 className="text-center mb-4 sm:mb-6 text-indigo-300 text-lg sm:text-xl font-semibold">
            Reset Password
          </h1>
          <p className="text-center mb-6 text-indigo-300 text-sm sm:text-base">
            Enter your registered email
          </p>
          <div className="mb-4 flex items-center gap-3 w-full px-4 py-2 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="" className="w-4 h-4" />
            <input
              type="email"
              placeholder="Email"
              className="bg-transparent outline-none text-white flex-1 text-sm sm:text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={cooldown > 0 || emailLoading}
            className={`w-full py-2 sm:py-2.5 rounded-full flex justify-center items-center gap-2 transition-all duration-300 text-sm sm:text-base ${
              cooldown > 0 || emailLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-indigo-700 text-white hover:bg-indigo-800"
            }`}
          >
            {emailLoading
              ? "Sending..."
              : cooldown > 0
              ? `Send OTP in ${cooldown}s`
              : "Send OTP"}
          </button>

          {alert && <AlertMessage type={alert.type} message={alert.message} />}
        </form>
      )}

      {/* OTP Form */}
      {isEmailSent && !isOtpSubmited && (
        <form
          onSubmit={onSubmitOTP}
          className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg text-sm"
        >
          <h1 className="text-center mb-4 sm:mb-6 text-indigo-300 text-lg sm:text-xl font-semibold">
            Verify OTP
          </h1>
          <p className="text-center mb-6 text-indigo-300 text-sm sm:text-base">
            Enter the 6-digit code sent to your email
          </p>

          <div
            className={`flex justify-between mb-8 gap-1 sm:gap-2 ${
              error ? "animate-shake" : ""
            }`}
            onPaste={handlePaste}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  required
                  className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-base sm:text-lg rounded-xl border-2 transition-all ${
                    error
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "bg-[#2e3553] border-transparent text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
                  }`}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
          </div>

          <button
            type="button"
            onClick={resendOtpHandler}
            disabled={cooldown > 0 || resendLoading}
            className={`w-full py-2 sm:py-2.5 rounded-full flex justify-center items-center gap-2 transition-all duration-300 text-sm sm:text-base ${
              cooldown > 0 || resendLoading
                ? "bg-gray-500 cursor-not-allowed text-gray-300"
                : btnError
                ? "bg-red-600 text-white animate-flash"
                : "bg-indigo-700 text-white hover:bg-indigo-800"
            }`}
          >
            {resendLoading
              ? "Sending..."
              : cooldown > 0
              ? `Resend OTP in ${cooldown}s`
              : "Resend OTP"}
          </button>

          <button
            type="submit"
            disabled={verifyLoading}
            className={`w-full mt-4 py-2 sm:py-2.5 rounded-full flex justify-center items-center gap-2 transition-all duration-300 text-sm sm:text-base ${
              verifyLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-indigo-900 text-white hover:opacity-90"
            }`}
          >
            {verifyLoading ? "Verifying..." : "Verify OTP"}
          </button>

          {alert && <AlertMessage type={alert.type} message={alert.message} />}
        </form>
      )}

      {/* New Password Form */}
      {isEmailSent && isOtpSubmited && (
        <form
          onSubmit={onSubmitNewPassword}
          className="bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-lg text-sm"
        >
          <h1 className="text-center mb-6 text-indigo-300 text-lg sm:text-xl font-semibold">
            Set New Password
          </h1>
          <div className="relative mb-6 flex items-center gap-3 w-full px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.lock_icon} alt="" className="w-4 h-4" />
            <input
              type={showPasswords.newPassword ? "text" : "password"}
              placeholder="Enter new password"
              className="bg-transparent outline-none text-white w-full text-sm sm:text-base"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordStrength(getPasswordStrength(e.target.value));
              }}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("newPassword")}
            >
              <img
                src={
                  showPasswords.newPassword
                    ? assets.eye_open_icon
                    : assets.eye_closed_icon
                }
                alt={
                  showPasswords.newPassword ? "Hide Password" : "Show Password"
                }
                className="w-5 h-5"
              />
            </button>
          </div>

          {/* ✅ Password Strength (only if user types) */}
          {newPassword.length > 0 && (
            <div className="ml-3 sm:ml-5 mt-2 animate-fadeIn">
              <div className="w-40 sm:w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-2 transition-all duration-300 ${
                    passwordStrength === "weak"
                      ? "w-1/3 bg-red-500"
                      : passwordStrength === "medium"
                      ? "w-2/3 bg-yellow-400"
                      : passwordStrength === "strong"
                      ? "w-full bg-green-500"
                      : "w-0"
                  }`}
                />
              </div>
              {passwordStrength && (
                <p
                  className={`mt-1 text-xs sm:text-sm font-semibold ${
                    passwordStrength === "weak"
                      ? "text-red-500"
                      : passwordStrength === "medium"
                      ? "text-yellow-400"
                      : "text-green-500"
                  }`}
                >
                  {passwordStrength.charAt(0).toUpperCase() +
                    passwordStrength.slice(1)}{" "}
                  password
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className={`w-full mt-6 py-2 sm:py-2.5 rounded-full flex justify-center items-center gap-2 transition-all duration-300 text-sm sm:text-base ${
              passwordLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-indigo-900 text-white hover:opacity-90"
            }`}
          >
            {passwordLoading ? "Saving..." : "Save New Password"}
          </button>

          {alert && <AlertMessage type={alert.type} message={alert.message} />}
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
