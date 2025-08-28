import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import Swal from "sweetalert2";
import SplashScreen from "../components/SplashScreen";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData, setIsAdmin } = useContext(AppContent);

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

  // Error states for form validation
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    icpepId: "",
    agree: ""
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
      setErrors(prev => ({ ...prev, icpepId: "" }));
    }
  };

  // Clear errors when user starts typing
  const clearError = (fieldName) => {
    setErrors(prev => ({ ...prev, [fieldName]: "" }));
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
          newErrors.contactNumber = "Please enter a valid PH number (e.g., 09291234567)";
        }
      }

      // Validate ICPEP ID for members
      if (membership === "member" && !icpepId.trim()) {
        newErrors.icpepId = "ICPEP ID is required for members";
      }

      // Validate agreement
      if (!agree) {
        newErrors.agree = "You must agree to the Terms and Conditions and Privacy Policy";
      }
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (state === "Sign Up" && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    axios.defaults.withCredentials = true;

    try {
      if (state === "Sign Up") {
        let formattedContact = contactNumber.trim().replace(/[\s-()]/g, "");
        if (formattedContact.startsWith("0")) {
          formattedContact = "+63" + formattedContact.slice(1);
        } else if (!formattedContact.startsWith("+63")) {
          formattedContact = "+63" + formattedContact;
        }
        const formattedStringContact = formattedContact.toString();
        if (!/^\+639\d{9}$/.test(formattedContact)) {
          toast.error(
            "Invalid mobile number. Please enter a valid PH number (e.g., 09291234567)"
          );
          return;
        }
        const { data } = await axios.post(`${backendUrl}/api/auth/register`, {
          fullName,
          email,
          password,
          contactNumber: formattedStringContact,
          icpepId,
          userType,
        });

        if (data.success) {
          await axios.post(`${backendUrl}/api/auth/send-verify-otp`, { email });
          toast.success("Registered! Please verify your email.");
          navigate("/email-verify");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
          email,
          password,
        });

        if (data.success) {
          const userResponse = await axios.get(
            `${backendUrl}/api/user/alldata`,
            { withCredentials: true }
          );
          const currentUser = userResponse.data.users.find(
            (user) => user.email === email
          );

          if (currentUser?.disabled) {
            Swal.fire({
              icon: "error",
              title: "Account Disabled",
              text: "Your account has been disabled. Please contact the administrator for assistance.",
              confirmButtonText: "OK",
            });
            return;
          }

          if (!data.user?.isVerified) {
            await axios.post(`${backendUrl}/api/auth/send-verify-otp`, {
              email,
            });
            toast.error("Please verify your email first.");
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
          toast.success(data.message);
          navigate("/splash?to=%2Fhome", { replace: true, state: { to: "/home" } });
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const [showPreSplash, setShowPreSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowPreSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (showPreSplash) {
    return <SplashScreen duration={900} message="Loading login..." defaultTo={"/login"} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-[#60B5FF]">
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt=""
        className="absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer"
      />
      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm">
        <h2 className="text-3xl font-semibold text-white mb-3 text-center">
          {state === "Sign Up" ? "Create your account" : "Login"}
        </h2>

        <form onSubmit={onSubmitHandler}>
          {state === "Sign Up" && (
            <>
              <div className="mb-4">
                <div className={`flex items-center gap-3 w-full px-5 py-2.5 rounded-full ${errors.fullName ? 'bg-red-900/20 border border-red-500' : 'bg-[#333A5C]'}`}>
                  <img src={assets.person_icon} alt="" />
                  <input
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('fullName');
                    }}
                    value={fullName}
                    className="bg-transparent outline-none w-full text-white"
                    placeholder="Full Name"
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-400 text-xs mt-1 ml-5">{errors.fullName}</p>
                )}
              </div>

              <div className="mb-4">
                <div className={`flex items-center gap-3 w-full px-5 py-2.5 rounded-full ${errors.contactNumber ? 'bg-red-900/20 border border-red-500' : 'bg-[#333A5C]'}`}>
                  <img src={assets.phone_icon} width="16" height="18" alt="" />
                  <input
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      if (value.length <= 11) {
                        if (value === "" || value.startsWith("0")) {
                          setContactNumber(value);
                          clearError('contactNumber');
                        }
                      }
                    }}
                    value={contactNumber}
                    className="bg-transparent outline-none w-full text-white"
                    type="tel"
                    placeholder="Contact Number (e.g. 09XXXXXXXXX)"
                    required
                  />
                </div>
                {errors.contactNumber && (
                  <p className="text-red-400 text-xs mt-1 ml-5">{errors.contactNumber}</p>
                )}
              </div>

              <div className="mb-4 w-full px-5 py-2.5 rounded-full bg-[#333A5C] w-full text-white">
                <select
                  value={userType}
                  onChange={(e) => setuserType(e.target.value)}
                  className="bg-transparent outline-none w-full"
                  required
                >
                  <option
                    style={{ backgroundColor: "#333A5C", color: "white" }}
                    value="student"
                  >
                    Student
                  </option>
                  <option
                    style={{ backgroundColor: "#333A5C", color: "white" }}
                    value="professional"
                  >
                    Professional
                  </option>
                </select>
              </div>

              <div className="mb-4 w-full px-5 py-2.5 rounded-full bg-[#333A5C] w-full text-white">
                <select
                  value={membership}
                  onChange={(e) => handleMembershipChange(e.target.value)}
                  className="bg-transparent outline-none w-full"
                  required
                >
                  <option
                    style={{ backgroundColor: "#333A5C", color: "white" }}
                    value="member"
                  >
                    Member
                  </option>
                  <option
                    style={{ backgroundColor: "#333A5C", color: "white" }}
                    value="non-member"
                  >
                    Non-Member
                  </option>
                </select>
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  membership === "member"
                    ? "opacity-100 max-h-40 mb-4"
                    : "opacity-0 max-h-0 mb-0 overflow-hidden"
                }`}
              >
                <div className={`flex items-center gap-3 w-full px-5 py-2.5 rounded-full ${errors.icpepId ? 'bg-red-900/20 border border-red-500' : 'bg-[#333A5C]'}`}>
                  <img src={assets.id_icon} width="16" height="18" alt="" />
                  <input
                    onChange={(e) => {
                      setIcpepId(e.target.value);
                      clearError('icpepId');
                    }}
                    value={icpepId}
                    className="bg-transparent outline-none w-full text-white"
                    placeholder="ICPEP ID"
                    required={membership === "member"}
                  />
                </div>
                {errors.icpepId && (
                  <p className="text-red-400 text-xs mt-1 ml-5">{errors.icpepId}</p>
                )}
              </div>
            </>
          )}

          <div className="mb-4">
            <div className={`flex items-center gap-3 w-full px-5 py-2.5 rounded-full ${errors.email ? 'bg-red-900/20 border border-red-500' : 'bg-[#333A5C]'} text-white`}>
              <img src={assets.mail_icon} alt="" />
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError('email');
                }}
                value={email}
                className="bg-transparent outline-none w-full"
                type="email"
                placeholder="Email"
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 ml-5">{errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <div className={`flex items-center gap-3 w-full px-5 py-2.5 rounded-full ${errors.password ? 'bg-red-900/20 border border-red-500' : 'bg-[#333A5C]'} relative text-white`}>
              <img src={assets.lock_icon} alt="Lock Icon" />
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError('password');
                }}
                value={password}
                className="bg-transparent outline-none w-full pr-10"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 text-indigo-300"
              >
                <img
                  src={
                    showPassword ? assets.eye_open_icon : assets.eye_closed_icon
                  }
                  alt={showPassword ? "Hide Password" : "Show Password"}
                  className="w-5 h-5"
                />
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 ml-5">{errors.password}</p>
            )}
          </div>

          {state === "Sign Up" && (
            <div className="mb-4">
              <div className={`flex items-center text-indigo-300 text-xs ${errors.agree ? 'border border-red-500 rounded p-2' : ''}`}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => {
                    setAgree(e.target.checked);
                    clearError('agree');
                  }}
                  className="mr-2 accent-blue-500 w-4 h-4"
                  required
                />
                <span>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-400 underline"
                  >
                    Terms and Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-blue-400 underline"
                  >
                    Privacy Policy
                  </button>
                </span>
              </div>
              {errors.agree && (
                <p className="text-red-400 text-xs mt-1 ml-5">{errors.agree}</p>
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

          <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium">
            {state}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="https://github.com/dokling1234/registra/releases/download/v0.01/app-release1.apk"
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
      </div>

      {/* Terms Modal - only for Sign Up */}
      {showTerms && state === "Sign Up" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-gray-800 overflow-y-auto max-h-[85vh] relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
              <button
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 text-sm leading-relaxed">
              <p className="font-semibold text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                By using Registra, you agree to the following terms and conditions:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">1</span>
                    Account Registration
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account</li>
                    <li>You must be at least 17+ years old to register</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">2</span>
                    Event Registration
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>Event registrations are subject to availability</li>
                    <li>Registration fees are non-refundable unless otherwise specified</li>
                    <li>Event organizers reserve the right to modify or cancel events</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">3</span>
                    Data Privacy
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>We collect and process your personal data for event management</li>
                    <li>Your data is stored securely and used only for app functionality</li>
                    <li>We do not share your personal information with third parties</li>
                    <li>You have the right to request deletion of your personal data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">4</span>
                    User Conduct
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>You agree to use the app for lawful purposes only</li>
                    <li>You will not attempt to gain unauthorized access to the system</li>
                    <li>You will not interfere with the website's functionality</li>
                    <li>You will not engage in any form of harassment or inappropriate behavior</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">5</span>
                    Limitation of Liability
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>Registra is not liable for any damages arising from app use</li>
                    <li>We reserve the right to modify or discontinue services</li>
                    <li>Event organizers are responsible for their own events</li>
                    <li>We are not responsible for any technical issues or data loss</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">6</span>
                    Contact Information
                  </h3>
                  <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                    <li>Visit our website: <a href="https://www.icpepncr.org/contact" className="text-blue-500 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer">www.icpepncr.org</a></li>
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
                     showConfirmButton: false
                   });
                 }}
                 className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
               >
                 Apply & Accept
               </button>
            </div>
          </div>
                 </div>
       )}

       {/* Privacy Policy Modal - only for Sign Up */}
       {showPrivacy && state === "Sign Up" && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-gray-800 overflow-y-auto max-h-[85vh] relative">
             {/* Header */}
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
               <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
               <button
                 onClick={() => setShowPrivacy(false)}
                 className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Content */}
             <div className="space-y-6 text-sm leading-relaxed">
               <p className="font-semibold text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                 This Privacy Policy describes how Registra collects, uses, and protects your personal information:
               </p>

               <div className="space-y-4">
                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">1</span>
                     Information We Collect
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>Personal identification information (name, email address, phone number)</li>
                     <li>Professional information (user type, ICPEP ID for members)</li>
                     <li>Event registration and participation data</li>
                     <li>Account credentials and authentication data</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">2</span>
                     How We Use Your Information
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>To provide and maintain our event registration services</li>
                     <li>To communicate with you about events and updates</li>
                     <li>To verify your identity and prevent fraud</li>
                     <li>To improve our services and user experience</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">3</span>
                     Data Protection
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>We implement industry-standard security measures</li>
                     <li>Your data is encrypted during transmission and storage</li>
                     <li>Access to your personal information is strictly controlled</li>
                     <li>Regular security audits and updates are performed</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">4</span>
                     Data Sharing
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>We do not sell, trade, or rent your personal information</li>
                     <li>Information may be shared with event organizers for event management</li>
                     <li>We may share data when required by law or to protect our rights</li>
                     <li>Third-party service providers are bound by confidentiality agreements</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">5</span>
                     Your Rights
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>You have the right to access your personal data</li>
                     <li>You can request correction of inaccurate information</li>
                     <li>You may request deletion of your account and data</li>
                     <li>You can opt-out of marketing communications</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">6</span>
                     Data Retention
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>We retain your data as long as your account is active</li>
                     <li>Event data is kept for administrative and legal purposes</li>
                     <li>You can request data deletion at any time</li>
                     <li>Backup data is securely deleted within 30 days</li>
                   </ul>
                 </div>

                 <div>
                   <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                     <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3">7</span>
                     Contact Us
                   </h3>
                   <ul className="list-disc list-inside ml-6 space-y-1 text-gray-700">
                     <li>
                       For privacy concerns, contact us at{" "}
                       <a href="https://www.icpepncr.org/contact" className="text-blue-500 underline hover:text-blue-700">
                         privacy@registra.com
                       </a>
                     </li>
                     <li>Visit our website: <a href="https://www.icpepncr.org" className="text-blue-500 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer">www.icpepncr.org</a></li>
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
           </div>
         </div>
       )}
     </div>
   );
 };

export default Login;
