import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import Swal from "sweetalert2";
import SplashScreen from "../components/SplashScreen";
import { motion } from "framer-motion";
const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData, setIsAdmin } =
    useContext(AppContent);

  const [state, setState] = useState("Login");
  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [icpepId, setIcpepId] = useState("");
  const [userType, setuserType] = useState("student");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [membership, setMembership] = useState("member");
  const [agree, setAgree] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Error states for form validation
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    icpepId: "",
    agree: "",
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const savedPassword = localStorage.getItem("userPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleMembershipChange = (value) => {
    setMembership(value);
    if (value === "non-member") {
      setIcpepId("");
      setErrors((prev) => ({ ...prev, icpepId: "" }));
    }
  };

  // Clear errors when user starts typing
  const clearError = (fieldName) => {
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };
  const [passwordStrength, setPasswordStrength] = useState("");

  // Helper: Evaluate password strength
  const getPasswordStrength = (password) => {
    if (!password) return "";
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (strongRegex.test(password)) return "strong";
    if (mediumRegex.test(password)) return "medium";
    return "weak";
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (state === "Sign Up") {
      // Validate full name
      if (!fullName.trim()) {
        newErrors.fullName = "Full name is required";
      } else if (fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters";
      }

      // Validate contact number
      if (!contactNumber.trim()) {
        newErrors.contactNumber = "Contact number is required";
      } else {
        const formattedContact = contactNumber.trim().replace(/[\s-()]/g, "");
        if (!/^0\d{10}$/.test(formattedContact)) {
          newErrors.contactNumber =
            "Please enter a valid PH number (e.g., 09291234567)";
        }
      }

      // Validate ICPEP ID for members
      if (membership === "member" && !icpepId.trim()) {
        newErrors.icpepId = "ICPEP ID is required for members";
      }

      // Validate agreement
      if (!agree) {
        newErrors.agree =
          "You must agree to the Terms and Conditions and Privacy Policy";
      }
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // ✅ Strong Password Validation
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (state === "Sign Up") {
      // Password must be at least 8 characters, include uppercase, lowercase, number, and special char
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!strongPasswordRegex.test(password)) {
        newErrors.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    setSubmitError("");
    if (!validateForm()) {
      if (!errors.email) {
        setSubmitError("Please fill in all required fields correctly");
      }
      return;
    }

    setLoading(true); // ⏳ disable button and show spinner
    axios.defaults.withCredentials = true;

    try {
      if (state === "Sign Up") {
        let formattedContact = contactNumber.trim().replace(/[\s-()]/g, "");

        // Validate number starts with 09 and has 11 digits
        if (!/^09\d{9}$/.test(formattedContact)) {
          setSubmitError(
            "Invalid mobile number. Please enter a valid PH number (e.g., 09291234567)"
          );
          return;
        }

        const { data } = await axios.post(`${backendUrl}/api/auth/register`, {
          fullName,
          email,
          password,
          contactNumber: formattedContact,
          icpepId,
          userType,
        });

        if (data.success) {
          // 🔹 remove this if backend already sends OTP
          await axios.post(`${backendUrl}/api/auth/send-verify-otp`, { email });
          // keep success feedback for signup via navigation only
          navigate("/email-verify");
        } else {
          // Map server signup errors under specific fields
          const serverMsg = (
            data.message || "Registration failed"
          ).toLowerCase();
          const newFieldErrors = {};
          if (serverMsg.includes("email")) {
            newFieldErrors.email =
              data.message || "Email is invalid or already in use";
          }
          if (serverMsg.includes("password")) {
            newFieldErrors.password =
              data.message || "Password does not meet requirements";
          }
          if (serverMsg.includes("icpep")) {
            newFieldErrors.icpepId = data.message || "Invalid ICPEP ID";
          }
          if (Object.keys(newFieldErrors).length > 0) {
            setErrors((prev) => ({ ...prev, ...newFieldErrors }));
            setSubmitError("");
          } else {
            setSubmitError(data.message || "Registration failed");
          }
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
          email,
          password,
        });

        if (data.success) {
          const userResponse = await axios.get(
            `${backendUrl}/api/user/alldata`,
            {
              withCredentials: true,
            }
          );
          const currentUser = userResponse.data.users.find(
            (user) => user.email === email
          );

          if (currentUser?.disabled) {
            Swal.fire({
              icon: "error",
              title: "Account Disabled",
              text: "Your account has been disabled. Please contact the administrator.",
            });
            return;
          }

          if (!data.user?.isVerified) {
            // 🔹 remove this if backend already sends OTP
            await axios.post(`${backendUrl}/api/auth/send-verify-otp`, {
              email,
            });
            setSubmitError("Please verify your email first.");
            navigate("/email-verify");
            return;
          }

          if (rememberMe) {
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userPassword", password);
          } else {
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userPassword");
          }

          setIsAdmin(false);
          setIsLoggedin(true);
          await getUserData();
          toast.success(data.message || "Login successful");
          navigate("/splash?to=%2Fhome", {
            replace: true,
            state: { to: "/home" },
          });
        } else {
          // Determine specific field error by checking if email exists in system
          try {
            const userResponse = await axios.get(
              `${backendUrl}/api/user/alldata`,
              {
                withCredentials: true,
              }
            );
            const exists = userResponse.data.users.some(
              (u) => u.email === email
            );
            if (!exists) {
              setErrors((prev) => ({
                ...prev,
                email: data.message || "Email not found",
              }));
              setSubmitError("");
            } else {
              setErrors((prev) => ({
                ...prev,
                password: data.message || "Incorrect password",
              }));
              setSubmitError("");
            }
          } catch {
            const msg = data.message || "Invalid email or password";
            setSubmitError(msg);
          }
        }
      }
    } catch (error) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.message;
      if (status === 401) {
        // Try to infer whether email or password is wrong
        try {
          const userResponse = await axios.get(
            `${backendUrl}/api/user/alldata`,
            {
              withCredentials: true,
            }
          );
          const exists = userResponse.data.users.some((u) => u.email === email);
          if (!exists) {
            setErrors((prev) => ({
              ...prev,
              email: serverMsg || "Email not found",
            }));
          } else {
            setErrors((prev) => ({
              ...prev,
              password: serverMsg || "Incorrect password",
            }));
          }
          setSubmitError("");
        } catch {
          setSubmitError(serverMsg || "Incorrect email or password");
        }
      } else {
        const msg = serverMsg || error.message || "Something went wrong";
        setSubmitError(msg);
      }
    } finally {
      setLoading(false); // ✅ re-enable button when done
    }
  };

  const [showPreSplash, setShowPreSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowPreSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (showPreSplash) {
    return (
      <SplashScreen
        duration={900}
        message="Loading login..."
        defaultTo={"/login"}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <div className="flex flex-row w-full max-w-4xl md:max-w-3xl lg:max-w-5xl bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Left side – Logo / Illustration */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-blue-300 to-blue-500 p-6 sm:p-8">
          <img
            src={assets.logo}
            alt="Logo"
            className="w-24 sm:w-32 md:w-40 lg:w-48 xl:w-56 h-auto max-w-full mb-4"
          />
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center">
            Welcome to Registra
          </h2>
          <p className="text-white/80 mt-3 text-center text-sm sm:text-base md:text-lg">
            Sign in or create an account to continue
          </p>
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full md:w-1/2 p-6 sm:p-8"
        >
          {/* Always-visible logo on small screens */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="md:hidden flex flex-col items-center justify-center mb-6"
          >
            {/* Floating & glowing logo */}
            <motion.div
              className="bg-gradient-to-br from-blue-400 to-indigo-600 p-4 rounded-full flex items-center justify-center"
              initial={{ y: 0, boxShadow: "0px 0px 15px rgba(59,130,246,0.5)" }}
              animate={{
                y: [0, -8, 0],
                boxShadow: [
                  "0px 0px 15px rgba(59,130,246,0.4)",
                  "0px 0px 30px rgba(59,130,246,0.8)",
                  "0px 0px 15px rgba(59,130,246,0.4)",
                ],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <motion.img
                src={assets.logo}
                alt="Logo"
                className="w-20 sm:w-24 md:w-28 h-auto max-w-full"
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.div>

            {/* Subtle welcome tagline */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-3 text-sm sm:text-base text-gray-300 text-center"
            >
              Welcome to Registra
            </motion.p>
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {state === "Sign Up" ? "Create your account" : "Login"}
          </h2>
          <div className="flex-1 pr-2"></div>
          <form onSubmit={onSubmitHandler}>
            {state === "Sign Up" && (
              <>
                {/* Full Name */}
                <div className="mb-3 sm:mb-4">
                  <div
                    className={`flex items-center gap-3 w-full px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full ${
                      errors.fullName
                        ? "bg-red-900/20 border border-red-500"
                        : "bg-[#333A5C]"
                    }`}
                  >
                    <img
                      src={assets.person_icon}
                      alt=""
                      className="w-4 sm:w-5 h-4 sm:h-5"
                    />
                    <input
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError("fullName");
                      }}
                      value={fullName}
                      className="bg-transparent outline-none w-full text-white text-sm sm:text-base"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-400 text-xs mt-1 ml-5">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Contact Number */}
                <div className="mb-3 sm:mb-4">
                  <div
                    className={`flex items-center gap-3 w-full px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full ${
                      errors.contactNumber
                        ? "bg-red-900/20 border border-red-500"
                        : "bg-[#333A5C]"
                    }`}
                  >
                    <img
                      src={assets.phone_icon}
                      width="14"
                      height="16"
                      alt=""
                    />
                    <input
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 11) {
                          if (value === "" || value.startsWith("0")) {
                            setContactNumber(value);
                            clearError("contactNumber");
                          }
                        }
                      }}
                      value={contactNumber}
                      className="bg-transparent outline-none w-full text-white text-sm sm:text-base"
                      type="tel"
                      placeholder="Contact Number (e.g. 09XXXXXXXXX)"
                      required
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-red-400 text-xs mt-1 ml-5">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>

                {/* User Type + Membership (Side by Side) */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  {/* User Type */}
                  <div className="relative flex-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-[#333A5C] text-white text-sm sm:text-base">
                      <img
                        src={assets.person_icon}
                        alt=""
                        className="w-5 h-5"
                      />
                      <select
                        value={userType}
                        onChange={(e) => setuserType(e.target.value)}
                        className="appearance-none bg-transparent outline-none w-full text-white text-base pr-6 cursor-pointer"
                        required
                      >
                        <option
                          value="student"
                          style={{ backgroundColor: "#333A5C", color: "white" }}
                        >
                          Student
                        </option>
                        <option
                          value="professional"
                          style={{ backgroundColor: "#333A5C", color: "white" }}
                        >
                          Professional
                        </option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 w-4 h-4 text-indigo-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Membership */}
                  <div className="relative flex-1">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full w-full ${
                        errors.icpepId
                          ? "bg-red-900/20 border border-red-500"
                          : "bg-[#333A5C]"
                      } text-white text-sm sm:text-base`}
                    >
                      <img src={assets.id_icon} alt="" className="w-5 h-5" />
                      <select
                        value={membership}
                        onChange={(e) => handleMembershipChange(e.target.value)}
                        className="appearance-none bg-transparent outline-none w-full text-white text-base pr-6 cursor-pointer"
                        required
                      >
                        <option
                          value="member"
                          style={{ backgroundColor: "#333A5C", color: "white" }}
                        >
                          Member
                        </option>
                        <option
                          value="non-member"
                          style={{ backgroundColor: "#333A5C", color: "white" }}
                        >
                          Non-Member
                        </option>
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 w-4 h-4 text-indigo-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    {errors.icpepId && (
                      <p className="text-red-400 text-xs mt-1 ml-5">
                        {errors.icpepId}
                      </p>
                    )}
                  </div>
                </div>

                {/* ICPEP ID (only if member) */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    membership === "member"
                      ? "opacity-100 max-h-40 mb-4"
                      : "opacity-0 max-h-0 mb-0 overflow-hidden"
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 w-full px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full ${
                      errors.icpepId
                        ? "bg-red-900/20 border border-red-500"
                        : "bg-[#333A5C]"
                    }`}
                  >
                    <img src={assets.id_icon} width="14" height="16" alt="" />
                    <input
                      onChange={(e) => {
                        setIcpepId(e.target.value);
                        clearError("icpepId");
                      }}
                      value={icpepId}
                      className="bg-transparent outline-none w-full text-white text-sm sm:text-base"
                      placeholder="ICPEP ID"
                      required={membership === "member"}
                    />
                  </div>

                  {errors.icpepId && (
                    <p className="text-red-400 text-xs mt-1 ml-5">
                      {errors.icpepId}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mb-3 sm:mb-4">
              <div
                className={`flex items-center gap-3 w-full px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full ${
                  errors.email && email.trim() !== ""
                    ? "bg-red-900/20 border border-red-500"
                    : "bg-[#333A5C]"
                } text-white`}
              >
                <img src={assets.mail_icon} alt="" className="w-4 sm:w-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    setSubmitError("");

                    const emailRegex =
                      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/;
                    if (!val.trim()) {
                      setErrors((prev) => ({
                        ...prev,
                        email: "Email is required",
                      }));
                    } else if (!emailRegex.test(val.trim())) {
                      setErrors((prev) => ({
                        ...prev,
                        email: "Please enter a valid email address",
                      }));
                    } else {
                      setErrors((prev) => {
                        const { email, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className="appearance-none bg-transparent outline-none w-full text-white text-sm sm:text-base"
                  required
                />
              </div>
              {errors.email && email.trim() !== "" && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <div
                className={`flex items-center gap-3 w-full px-4 py-1.5 sm:px-5 sm:py-2.5 rounded-full ${
                  errors.password
                    ? "bg-red-900/20 border border-red-500"
                    : "bg-[#333A5C]"
                } relative text-white`}
              >
                <img
                  src={assets.lock_icon}
                  alt="Lock Icon"
                  className="w-4 sm:w-5"
                />
                <input
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    clearError("password");
                    setPasswordStrength(getPasswordStrength(val));
                    setSubmitError("");
                  }}
                  value={password}
                  className="bg-transparent outline-none flex-1 text-sm sm:text-base"
                  type={showPassword ? " " : "password"}
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-indigo-300"
                >
                  <img
                    src={
                      showPassword
                        ? assets.eye_open_icon
                        : assets.eye_closed_icon
                    }
                    alt={showPassword ? "Hide Password" : "Show Password"}
                    className="w-4 sm:w-5 h-4 sm:h-5"
                  />
                </button>
              </div>

              {/* 🔴 Show error if invalid */}
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 ml-5">
                  {errors.password}
                </p>
              )}

              {/* 🟢 Password strength bar (only on Sign Up) */}
              {state === "Sign Up" && password && !errors.password && (
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
                    />
                  </div>
                  {/* Label */}
                  <p
                    className={`mt-1 text-xs font-medium ${
                      passwordStrength === "weak"
                        ? "text-red-400"
                        : passwordStrength === "medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {passwordStrength.charAt(0).toUpperCase() +
                      passwordStrength.slice(1)}{" "}
                    password
                  </p>
                </div>
              )}
            </div>

            {/* Show submit-level error just for Login, directly under inputs */}
            {state !== "Sign Up" && submitError && (
              <div className="mt-2 ml-1 text-xs text-red-300">
                {submitError}
              </div>
            )}

            {state === "Sign Up" && (
              <div className="mb-4">
                <div
                  className={`flex items-start gap-2 text-indigo-300 text-xs sm:text-sm ${
                    errors.agree
                      ? "border border-red-500 rounded p-1.5 sm:p-2"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => {
                      setAgree(e.target.checked);
                      clearError("agree");
                    }}
                    className="mt-0.5 accent-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                    required
                  />
                  <span className="leading-relaxed">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      Terms and Conditions
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-blue-400 underline hover:text-blue-300"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </div>

                {errors.agree && (
                  <p className="text-red-400 text-xs mt-1 ml-6">
                    {errors.agree}
                  </p>
                )}
              </div>
            )}

            {state !== "Sign Up" && (
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center text-indigo-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2"
                  />
                  Remember Me
                </label>
                <p
                  onClick={() => navigate("/reset-password")}
                  className="text-indigo-500 cursor-pointer"
                >
                  Forgot password?
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base transition-all duration-200 ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-900 hover:from-indigo-600 hover:to-indigo-950"
              } text-white flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                state
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="https://github.com/dokling1234/registra/releases/download/v0.01/Registra-release.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download Mobile App
            </a>
          </div>

          {state === "Sign Up" ? (
            <p className="text-gray-400 text-center text-xs mt-4">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setState("Login");
                  setRememberMe(false);
                  setEmail("");
                  setPassword("");
                  setErrors({}); // Clear all errors when switching to login
                  localStorage.removeItem("userEmail");
                  localStorage.removeItem("userPassword");
                }}
                className="text-blue-400 cursor-pointer underline"
              >
                Login Here
              </span>
            </p>
          ) : (
            <p className="text-gray-400 text-center text-xs mt-4">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setState("Sign Up");
                  setRememberMe(false);
                  setEmail("");
                  setPassword("");
                  setErrors({}); // Clear all errors when switching to sign up
                  localStorage.removeItem("userEmail");
                  localStorage.removeItem("userPassword");
                }}
                className="text-blue-400 cursor-pointer underline"
              >
                Sign up
              </span>
            </p>
          )}
        </motion.div>
      </div>

      {/* Terms Modal - only for Sign Up */}
      {showTerms && state === "Sign Up" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
        >
          <motion.div
            initial={{
              y:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 50
                  : 0,
              scale:
                typeof window !== "undefined" && window.innerWidth >= 768
                  ? 0.95
                  : 1,
              opacity: 0,
            }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-2xl w-full 
            max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl text-gray-800 
            overflow-y-auto modal-scroll max-h-[75vh] lg:max-h-[70vh] relative overflow-hidden px-0"
          >
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Terms and Conditions
                </h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6 text-sm leading-relaxed">
                <p className="font-semibold text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  By using Registra, you agree to the following terms and
                  conditions:
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        1
                      </span>
                      Account Registration
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>
                        You must provide accurate and complete information
                        during registration
                      </li>
                      <li>
                        You are responsible for maintaining the confidentiality
                        of your account
                      </li>
                      <li>You must be at least 17+ years old to register</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        2
                      </span>
                      Event Registration
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>Event registrations are subject to availability</li>
                      <li>
                        Registration fees are non-refundable unless otherwise
                        specified
                      </li>
                      <li>
                        Event organizers reserve the right to modify or cancel
                        events
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        3
                      </span>
                      Data Privacy
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>
                        We collect and process your personal data for event
                        management
                      </li>
                      <li>
                        Your data is stored securely and used only for app
                        functionality
                      </li>
                      <li>
                        We do not share your personal information with third
                        parties
                      </li>
                      <li>
                        You have the right to request deletion of your personal
                        data
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        4
                      </span>
                      User Conduct
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>You agree to use the app for lawful purposes only</li>
                      <li>
                        You will not attempt to gain unauthorized access to the
                        system
                      </li>
                      <li>
                        You will not interfere with the website's functionality
                      </li>
                      <li>
                        You will not engage in any form of harassment or
                        inappropriate behavior
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        5
                      </span>
                      Limitation of Liability
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>
                        Registra is not liable for any damages arising from app
                        use
                      </li>
                      <li>
                        We reserve the right to modify or discontinue services
                      </li>
                      <li>
                        Event organizers are responsible for their own events
                      </li>
                      <li>
                        We are not responsible for any technical issues or data
                        loss
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                        6
                      </span>
                      Contact Information
                    </h3>
                    <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                      <li>
                        Visit our website:{" "}
                        <a
                          href="https://www.icpepncr.org/contact"
                          className="text-blue-500 underline hover:text-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          www.icpepncr.org
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setAgree(true);
                    setShowTerms(false);
                    Swal.fire({
                      icon: "success",
                      title: "Terms Accepted!",
                      text: "You have successfully agreed to the Terms and Conditions.",
                      confirmButtonText: "Continue",
                      confirmButtonColor: "#3B82F6",
                      timer: 2000,
                      timerProgressBar: true,
                      showConfirmButton: false,
                    });
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Apply & Accept
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Privacy Policy Modal - only for Sign Up */}
      {showPrivacy && state === "Sign Up" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
        >
          <motion.div
            initial={{
              y:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? 50
                  : 0,
              scale:
                typeof window !== "undefined" && window.innerWidth >= 768
                  ? 0.95
                  : 1,
              opacity: 0,
            }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl text-gray-800 overflow-y-auto hide-scrollbar max-h-[75vh] lg:max-h-[70vh] relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Privacy Policy
              </h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 text-sm leading-relaxed">
              <p className="font-semibold text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                This Privacy Policy describes how Registra collects, uses, and
                protects your personal information:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      1
                    </span>
                    Information We Collect
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>
                      Personal identification information (name, email address,
                      phone number)
                    </li>
                    <li>
                      Professional information (user type, ICPEP ID for members)
                    </li>
                    <li>Event registration and participation data</li>
                    <li>Account credentials and authentication data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      2
                    </span>
                    How We Use Your Information
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>
                      To provide and maintain our event registration services
                    </li>
                    <li>To communicate with you about events and updates</li>
                    <li>To verify your identity and prevent fraud</li>
                    <li>To improve our services and user experience</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      3
                    </span>
                    Data Protection
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>We implement industry-standard security measures</li>
                    <li>
                      Your data is encrypted during transmission and storage
                    </li>
                    <li>
                      Access to your personal information is strictly controlled
                    </li>
                    <li>Regular security audits and updates are performed</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      4
                    </span>
                    Data Sharing
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>
                      We do not sell, trade, or rent your personal information
                    </li>
                    <li>
                      Information may be shared with event organizers for event
                      management
                    </li>
                    <li>
                      We may share data when required by law or to protect our
                      rights
                    </li>
                    <li>
                      Third-party service providers are bound by confidentiality
                      agreements
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      5
                    </span>
                    Your Rights
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>You have the right to access your personal data</li>
                    <li>
                      You can request correction of inaccurate information
                    </li>
                    <li>You may request deletion of your account and data</li>
                    <li>You can opt-out of marketing communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      6
                    </span>
                    Data Retention
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>
                      We retain your data as long as your account is active
                    </li>
                    <li>
                      Event data is kept for administrative and legal purposes
                    </li>
                    <li>You can request data deletion at any time</li>
                    <li>Backup data is securely deleted within 30 days</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">
                      7
                    </span>
                    Contact Us
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>
                      For privacy concerns, contact us at{" "}
                      <a
                        href="https://www.icpepncr.org/contact"
                        className="text-blue-500 underline hover:text-blue-700"
                      >
                        privacy@registra.com
                      </a>
                    </li>
                    <li>
                      Visit our website:{" "}
                      <a
                        href="https://www.icpepncr.org"
                        className="text-blue-500 underline hover:text-blue-700"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        www.icpepncr.org
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPrivacy(false)}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPrivacy(false);
                  setShowTerms(true);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Terms and Conditions
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Login;
