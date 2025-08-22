import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";
import Swal from "sweetalert2";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData } = useContext(AppContent);

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
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;

    try {
      if (state === "Sign Up" && !agree) {
        toast.error(
          "You must agree to the Terms and Conditions and Privacy Policy."
        );
        return;
      }
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

          setIsLoggedin(true);
          await getUserData();
          navigate("/home");
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

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
              <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                <img src={assets.person_icon} alt="" />
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={fullName}
                  className="bg-transparent outline-none w-full text-white"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                <img src={assets.phone_icon} width="16" height="18" alt="" />
                <input
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 11) {
                      if (value === "" || value.startsWith("0")) {
                        setContactNumber(value);
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
                <div className="flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                  <img src={assets.id_icon} width="16" height="18" alt="" />
                  <input
                    onChange={(e) => setIcpepId(e.target.value)}
                    value={icpepId}
                    className="bg-transparent outline-none w-full text-white"
                    placeholder="ICPEP ID"
                    required={membership === "member"}
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white">
            <img src={assets.mail_icon} alt="" />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none w-full"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] relative text-white">
            <img src={assets.lock_icon} alt="Lock Icon" />
            <input
              onChange={(e) => setPassword(e.target.value)}
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

          {state === "Sign Up" && (
            <div className="mb-4 flex items-center text-indigo-300 text-xs">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
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
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  Privacy Policy
                </a>
              </span>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full text-gray-800 overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-bold mb-4">Terms and Conditions</h2>
            <p className="font-semibold">
              By using Registra, you agree to the following terms and
              conditions:
            </p>
            <br />
            <p className="font-bold">1. Account Registration:</p>
            <ul className="list-disc list-inside mb-2">
              <li>
                You must provide accurate and complete information during
                registration
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your
                account
              </li>
              <li>You must be at least 18 years old to register</li>
            </ul>
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowTerms(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
