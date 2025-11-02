import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Simple spinner component
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
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
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8H4z"
    />
  </svg>
);

const EmailVerify = () => {
  axios.defaults.withCredentials = true;
  const { backendUrl, isLoggedin, userData, getUserData, setIsLoggedin } =
    useContext(AppContent);

  const navigate = useNavigate();
  const inputRefs = React.useRef([]);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [btnError, setBtnError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alert, setAlert] = useState(null);

  // Auto-hide alerts
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const onSubmitHandler = async (otp) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setAlert(null);

    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/verify-account",
        { otp }
      );

      if (data.success) {
        setIsLoggedin(true);
        await getUserData();
        setAlert({ type: "success", message: data.message });
        setSuccess(true);

        setTimeout(() => {
          navigate("/home");
        }, 1800);
      } else {
        setAlert({ type: "error", message: data.message });
        triggerErrorEffect();
      }
    } catch (error) {
      setAlert({ type: "error", message: error.message });
      triggerErrorEffect();
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerErrorEffect = () => {
    setError(true);
    setTimeout(() => setError(false), 600);
    inputRefs.current.forEach((el) => {
      if (el) el.value = "";
    });
    inputRefs.current[0]?.focus();
  };

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }

    const otp = inputRefs.current.map((el) => el?.value || "").join("");
    if (otp.length === 6) {
      onSubmitHandler(otp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    paste.split("").forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });

    const otp = inputRefs.current.map((el) => el?.value || "").join("");
    if (otp.length === 6) {
      onSubmitHandler(otp);
    }
  };

  const resendOtpHandler = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/resend-otp`);
      setCooldown(40);
      setAlert({ type: "success", message: data.message });
    } catch (error) {
      setAlert({
        type: "error",
        message: error.response?.data?.message || "Failed to resend OTP",
      });
      setBtnError(true);
      setTimeout(() => setBtnError(false), 600);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    isLoggedin && userData && userData.isVerified && navigate("/");
  }, [isLoggedin, userData]);

  // ✅ Inline Alert Component
  const AlertMessage = ({ type, message }) => {
    return (
      <div
        className={`mt-3 flex items-center justify-center gap-2 transition-all duration-500 ${
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      {/* ✅ Logo outside and top center */}
      <div className="w-full flex justify-center mt-6 mb-6">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="Logo"
          className="w-20 sm:w-28 md:w-36 lg:w-40 cursor-pointer"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-5xl">
        <div className="bg-slate-900 p-5 sm:p-7 md:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg text-sm sm:text-base h-auto">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="text-center mb-4 sm:mb-6 text-indigo-300 text-lg sm:text-xl md:text-2xl font-semibold">
                  Verify Your Email
                </h1>
                <p className="text-center mb-4 sm:mb-6 text-indigo-300 text-sm sm:text-base">
                  Enter the 6-digit code sent to your email.
                </p>

                {/* ✅ OTP Inputs responsive */}
                <div
                  className={`grid grid-cols-6 gap-2 sm:gap-3 md:gap-4 justify-items-center mb-6 sm:mb-8 ${
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
                        className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center 
                          text-base sm:text-lg md:text-xl lg:text-lg
                          rounded-xl border-2 transition-all ${
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
                  className={`w-full py-2 rounded-full transition-all duration-300 flex items-center justify-center gap-2
                    ${
                      cooldown > 0 || resendLoading
                        ? "bg-gray-500 cursor-not-allowed text-gray-300"
                        : btnError
                        ? "bg-red-600 text-white animate-flash"
                        : "bg-indigo-700 text-white hover:bg-indigo-800"
                    }`}
                >
                  {resendLoading ? (
                    <>
                      <Spinner /> <span>Sending...</span>
                    </>
                  ) : cooldown > 0 ? (
                    `Resend OTP in ${cooldown}s`
                  ) : (
                    "Resend OTP"
                  )}
                </button>

                {/* ✅ Inline Alert */}
                {alert && <AlertMessage type={alert.type} message={alert.message} />}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                className="flex flex-col items-center justify-center py-6 sm:py-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                <motion.p
                  className="mt-4 sm:mt-6 text-green-400 font-semibold text-base sm:text-lg text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Email Verified! Redirecting...
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EmailVerify;
