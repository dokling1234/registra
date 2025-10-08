import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { backendUrl, isAdmin } = useContext(AppContent);
  axios.defaults.withCredentials = true;
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState("");
  const [otp, setOtp] = useState(0);
  const [isOtpSubmited, setIsOtpSubmited] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(false);
  const [btnError, setBtnError] = useState(false);

  const inputRefs = React.useRef([]);
  // auto next yung box kada input yung value

  const resendOtpHandler = async () => {
    if (cooldown > 0 || resendLoading) return; // ✅ prevent multiple clicks
    setResendLoading(true); // ✅ show loading spinner on button

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-reset-otp`,
        { email }
      );

      if (data.success) {
        toast.success(data.message || "A new OTP has been sent to your email.");
        setCooldown(40); // ✅ start cooldown
      } else {
        toast.error(data.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
      setBtnError(true);
      setTimeout(() => setBtnError(false), 600);
    } finally {
      setResendLoading(false); // ✅ always reset loading state even if error happens
    }
  };

  // ⏱️ Cooldown timer for both buttons
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };
  // auto backspace yung box pag nag backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    const pastArray = paste.split("");
    pastArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
        inputRefs.current[index].focus();
      }
    });
  };
  const triggerErrorEffect = () => {
    setError(true);
    setTimeout(() => setError(false), 600);
    inputRefs.current.forEach((el) => (el.value = ""));
    inputRefs.current[0]?.focus();
  };
  const onSubmitEmail = async (e) => {
    e.preventDefault();

    if (cooldown > 0 || emailLoading) return; // prevent multiple clicks
    setEmailLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/send-reset-otp`,
        { email }
      );

      if (data.success) {
        toast.success(data.message);
        setIsEmailSent(true);
        setCooldown(40); // ✅ start cooldown timer for resend button
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setEmailLoading(false); // ✅ always reset loading
    }
  };

  {
    /* function to ng para mapagana yung otp */
  }
  const onSubmitOTP = async (e) => {
    e.preventDefault();
    if (verifyLoading) return; // prevent multiple clicks
    setVerifyLoading(true);

    const otpArray = inputRefs.current.map((e) => e.value);
    const enteredOtp = otpArray.join("");

    if (enteredOtp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      setVerifyLoading(false); // ✅ reset immediately
      return;
    }

    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/verify-reset-otp",
        { email, otp: enteredOtp }
      );

      if (data.success) {
        toast.success(data.message || "OTP verified successfully!");
        setOtp(enteredOtp);
        setIsOtpSubmited(true);
      } else {
        toast.error(data.message || "Invalid OTP, please try again.");
        triggerErrorEffect();
        setVerifyLoading(false); // ✅ stop loading when invalid
        return; // ✅ stop further execution
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      triggerErrorEffect();
      setVerifyLoading(false); // ✅ ensure reset on any failure
    }
  };
  const getPasswordStrength = (password) => {
    if (!password) return "";
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (strongRegex.test(password)) return "strong";
    if (mediumRegex.test(password)) return "medium";
    return "weak";
  };

  {
    /* function to ng para naman don sa input ng new password */
  }
  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    if (passwordLoading) return; // prevent multiple clicks
    setPasswordLoading(true);

    // Password validation
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.password = "Password is required.";
    } else {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!strongPasswordRegex.test(newPassword)) {
        newErrors.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
      setPasswordLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/reset-password`,
        {
          email,
          newPassword,
        }
      );

      if (data.success) {
        toast.success(data.message || "Password reset successfully!");
        navigate("/");
      } else {
        toast.error(data.message || "Failed to reset password.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Not an admin, redirect to home or another page
      navigate("/");
    }
  }, [isAdmin, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt=""
        className="absolute left-5 sm:left-20
        top-5 w-28 sm:w-32 cursor-pointer"
      />

      {/* enter email id */}

      {!isEmailSent && (
        <form
          onSubmit={onSubmitEmail}
          className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm"
        >
          <h1 className="text-center mb-6 text-indigo-300">Reset Password</h1>
          <p className="text-center mb-6 text-indigo-300">
            Enter your registered email Address
          </p>
          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.mail_icon} alt="" className="w-3 h-3" />
            <input
              type="email"
              placeholder="Email"
              className="bg-transparent outline-none text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={cooldown > 0 || emailLoading}
            className={`w-full py-2 rounded-full transition-all duration-300 flex justify-center items-center gap-2 ${
              cooldown > 0 || emailLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-indigo-700 text-white hover:bg-indigo-800"
            }`}
          >
            {emailLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Send OTP in ${cooldown}s`
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
      )}
      {/* otp input form*/}

      {!isOtpSubmited && isEmailSent && (
        <form
          onSubmit={onSubmitOTP}
          className="bg-slate-900 p-8 rounded-2xl shadow-xl w-96 text-sm"
        >
          <h1 className="text-center mb-6 text-indigo-300 text-xl font-semibold">
            Verify OTP
          </h1>
          <p className="text-center mb-6 text-indigo-300">
            Enter the 6-digit code sent to your email.
          </p>

          <div
            className={`flex justify-between mb-8 gap-2 ${
              error ? "animate-shake" : ""
            }`}
            onPaste={handlePaste}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <input
                  type="text"
                  maxLength="1"
                  key={index}
                  required
                  className={`w-12 h-12 text-center text-lg rounded-xl border-2 transition-all ${
                    error
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "bg-[#2e3553] border-transparent text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
                  }`}
                  ref={(e) => (inputRefs.current[index] = e)}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
          </div>

          <button
            type="button"
            onClick={resendOtpHandler}
            disabled={cooldown > 0 || resendLoading}
            className={`w-full py-2 rounded-full transition-all duration-300 flex justify-center items-center gap-2 ${
              cooldown > 0 || resendLoading
                ? "bg-gray-500 cursor-not-allowed text-gray-300"
                : btnError
                ? "bg-red-600 text-white animate-flash"
                : "bg-indigo-700 text-white hover:bg-indigo-800"
            }`}
          >
            {resendLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Resending...
              </>
            ) : cooldown > 0 ? (
              `Resend OTP in ${cooldown}s`
            ) : (
              "Resend OTP"
            )}
          </button>

          <button
            type="submit"
            disabled={verifyLoading}
            className={`w-full mt-4 py-2 rounded-full flex justify-center items-center gap-2 transition-all duration-300
    ${
      verifyLoading
        ? "bg-gray-500 text-gray-300 cursor-not-allowed"
        : "bg-gradient-to-r from-indigo-500 to-indigo-900 text-white hover:opacity-90"
    }`}
          >
            {verifyLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>
      )}
      {/* enter new password*/}

      {isOtpSubmited && isEmailSent && (
        <form
          onSubmit={onSubmitNewPassword}
          className="bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm"
        >
          <h1 className="text-center mb-6 text-indigo-300">New Password</h1>
          <p className="text-center mb-6 text-indigo-300">
            Enter your new password below
          </p>

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.lock_icon} alt="" className="w-3 h-3" />
            <input
              type="password"
              placeholder="Password"
              className="bg-transparent outline-none text-white w-full"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordStrength(getPasswordStrength(e.target.value)); // ✅ Update strength dynamically
              }}
              required
            />
          </div>

          {/* ✅ Password Strength Indicator Bar */}
          {newPassword && (
            <div className="ml-5 mt-2">
              {/* Bar background */}
              <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                {/* Fill bar */}
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
                ></div>
              </div>

              {/* Text indicator */}
              <p
                className={`text-sm mt-1 ${
                  passwordStrength === "strong"
                    ? "text-green-400"
                    : passwordStrength === "medium"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                Strength:{" "}
                <span className="capitalize font-semibold">
                  {passwordStrength}
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className={`w-full py-2.5 mt-5 rounded-full flex justify-center items-center gap-2 transition-all duration-300 ${
              passwordLoading
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-indigo-900 text-white hover:opacity-90"
            }`}
          >
            {passwordLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
