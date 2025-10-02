import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const EmailVerify = () => {
  axios.defaults.withCredentials = true;
  const { backendUrl, isLoggedin, userData, getUserData, setIsLoggedin } =
    useContext(AppContent);

  const navigate = useNavigate();
  const inputRefs = React.useRef([]);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const onSubmitHandler = async (otp) => {
    if (isVerifying) return; // prevent double calls
    setIsVerifying(true);
    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/verify-account",
        { otp }
      );

      if (data.success) {
        toast.success(data.message);
        setIsLoggedin(true);
        await getUserData();
        navigate("/home");
      } else {
        toast.error(data.message);
        triggerErrorEffect();
      }
    } catch (error) {
      toast.error(error.message);
      triggerErrorEffect();
    } finally {
      setIsVerifying(false);
    }
  };

  // Error shake effect
  const triggerErrorEffect = () => {
    setError(true);
    setTimeout(() => setError(false), 600); // reset after animation
    inputRefs.current.forEach((el) => {
      if (el) el.value = "";
    });
    inputRefs.current[0]?.focus();
  };

  // Auto focus + auto submit
  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // check if all filled
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

  // inside component
  const [btnError, setBtnError] = useState(false);

  const resendOtpHandler = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/resend-otp`);
      toast.success(data.message);
      setCooldown(40);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
      setBtnError(true);
      setTimeout(() => setBtnError(false), 600);
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

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt=""
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-96 text-sm">
        <h1 className="text-center mb-6 text-indigo-300 text-xl font-semibold">
          Verify Your Email
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
          disabled={cooldown > 0}
          className={`w-full py-2 rounded-full transition-all duration-300 
    ${
      cooldown > 0
        ? "bg-gray-500 cursor-not-allowed text-gray-300"
        : btnError
        ? "bg-red-600 text-white animate-flash"
        : "bg-indigo-700 text-white hover:bg-indigo-800"
    }`}
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </button>
      </div>
    </div>
  );
};

export default EmailVerify;
