import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";

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
  const [age, setAge] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [membership, setMembership] = useState("member");

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
      if (state === "Sign Up") {
        const { data } = await axios.post(`${backendUrl}/api/auth/register`, {
          fullName,
          email,
          password,
          contactNumber: Number(contactNumber),
          icpepId,
          userType,
          age: Number(age),
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
          if (rememberMe) {
            localStorage.setItem("userEmail", email);
            localStorage.setItem("userPassword", password);
          } else {
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userPassword");
          }

          navigate("/home");
          setIsLoggedin(true);
          await getUserData();
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
                <img src={assets.person_icon} alt="" />
                <input
                  onChange={(e) => setAge(e.target.value)}
                  value={age}
                  className="bg-transparent outline-none w-full text-white"
                  type="tel"
                  placeholder="Age"
                  required
                  min="0"
                />
              </div>

              <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
                <img src={assets.phone_icon} width="16" height="18" alt="" />
                <input
                  onChange={(e) => setContactNumber(e.target.value)}
                  value={contactNumber}
                  className="bg-transparent outline-none w-full text-white"
                  type="tel"
                  placeholder="Contact Number"
                  required
                />
              </div>
              <div className="mb-4 w-full px-5 py-2.5 rounded-full bg-[#333A5C] w-full text-white">
                <select
                  value={userType}
                  onChange={(e) => setuserType(e.target.value)}
                  className="bg-transparent outline-none w-full"
                  s
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
              {/* Animated ICPEP Field */}
              <div
                className={`transition-all duration-300 ease-in-outbg-transparent ${
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
                    className="bg-transparent outline-none focus:outline-none border-transparent w-full text-white"
                    placeholder="ICPEP ID"
                    required={membership === "member"}
                  />
                </div>
              </div>
            </>
          )}

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] w-full text-white">
            <img src={assets.mail_icon} alt="" />
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="bg-transparent outline-none"
              type="email"
              placeholder="Email"
              required
            />
          </div>

          <div className="mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] relative w-full text-white">
            <img src={assets.lock_icon} alt="Lock Icon" />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              className="bg-transparent outline-none w-full text-white pr-10"
              type={showPassword ? "" : "password"}
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
    </div>
  );
};

export default Login;
