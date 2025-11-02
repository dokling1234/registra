import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Swal from "sweetalert2";
import SplashScreen from "../components/SplashScreen";

const Spinner = ({ size = 16 }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      strokeOpacity="0.2"
    />
    <path
      d="M22 12a10 10 0 00-10-10"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

const AdminLogin = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, getUserData, setIsAdmin } =
    useContext(AppContent);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password change popup state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Validation states for change password popup
  const [pwTouched, setPwTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  // NEW: loading states
  const [signingIn, setSigningIn] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;
    setSubmitError("");
    setSigningIn(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/auth/admin-login`, {
        email,
        password,
        isAdmin: true, // allows both admin and superadmin
      });

      if (data.passwordChangeRequired) {
        setAdminId(data.adminId);
        setShowPasswordChangePopup(true);
        setSigningIn(false);
        return;
      }

      if (data.success) {
        const userType = data.user?.userType;
        if (!userType) {
          setSubmitError("userType not found. Something went wrong.");
          setSigningIn(false);
          return;
        }

        setIsAdmin(true);
        setIsLoggedin(true);
        await getUserData(true);

        Swal.fire({
          icon: "success",
          title: "Login successful",
          timer: 900,
          showConfirmButton: false,
        });

        const to =
          userType === "admin"
            ? "/admin/dashboard"
            : userType === "superadmin"
            ? "/superadmin/dashboard"
            : null;

        if (!to) {
          setSubmitError("Invalid user type.");
          setSigningIn(false);
          return;
        }

        // stop spinner before navigating (clean UI)
        setSigningIn(false);
        navigate("/splash?to=" + encodeURIComponent(to), {
          replace: true,
          state: { to },
        });
      } else {
        // Backend returned success: false (wrong credentials or blocked user)
        setSubmitError(data.message || "Invalid email or password");
        setSigningIn(false);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setSubmitError("Incorrect email or password.");
        } else {
          const msg = error.response.data?.message || "Something went wrong.";
          setSubmitError(msg);
        }
      } else {
        setSubmitError("Network error. Please try again.");
      }
      setSigningIn(false);
    }
  };

  // client-side validators
  const passwordIsValid = newPassword.trim().length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const canUpdatePassword = passwordIsValid && passwordsMatch && adminId;

  const handlePasswordChange = async () => {
    setPwTouched(true);
    setConfirmTouched(true);

    if (!canUpdatePassword) return;

    setUpdatingPassword(true);
    try {
      const res = await axios.post(
        `${
          backendUrl || import.meta.env.VITE_BACKEND_URL
        }/api/admin/change-password`,
        {
          adminId,
          newPassword,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password updated. Please log in again.",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowPasswordChangePopup(false);
        setNewPassword("");
        setConfirmPassword("");
        setPwTouched(false);
        setConfirmTouched(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data.message || "Failed to update password.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("Password change failed:", error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to change password. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setUpdatingPassword(false);
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
        message="Loading admin login..."
        defaultTo={"/admin"}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-200 to-[#60B5FF] px-4 py-8">
      {/* Decorative logo on large screens */}
      <img
        src={assets.logo}
        alt="Logo"
        onClick={() => navigate("/")}
        className="hidden lg:block absolute left-20 top-8 w-32 cursor-pointer"
      />

      <div className="relative w-full max-w-md sm:max-w-lg">
        {/* Small-screen centered logo */}
        <div className="flex justify-center lg:hidden mb-4">
          <img
            src={assets.logo}
            alt="Logo"
            onClick={() => navigate("/")}
            className="w-24 cursor-pointer"
          />
        </div>

        <div className="bg-slate-900/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl text-indigo-300">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2 text-center">
            Admin Login
          </h2>

          <p className="text-center text-sm text-indigo-200 mb-6">
            Enter your credentials
          </p>

          <form onSubmit={onSubmitHandler} className="space-y-4">
            <label className="block">
              <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full bg-[#333A5C]">
                <img src={assets.mail_icon} alt="mail" className="w-5 h-5" />
                <input
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setSubmitError("");
                  }}
                  value={email}
                  className="bg-transparent outline-none w-full text-sm text-white placeholder:text-indigo-200"
                  type="email"
                  placeholder="Email"
                  required
                  aria-label="Email"
                />
              </div>
            </label>

            <label className="block relative">
              <div className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full bg-[#333A5C]">
                <img src={assets.lock_icon} alt="lock" className="w-5 h-5" />
                <input
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSubmitError("");
                  }}
                  value={password}
                  className="bg-transparent outline-none text-sm text-white placeholder:text-indigo-200 flex-1"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="flex-shrink-0"
                >
                  <img
                    src={
                      showPassword
                        ? assets.eye_open_icon
                        : assets.eye_closed_icon
                    }
                    alt={showPassword ? "Hide" : "Show"}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={signingIn}
              className={`w-full mt-1 py-3 rounded-full text-white font-medium shadow-md hover:brightness-105 transition flex items-center justify-center gap-2 ${
                signingIn
                  ? "bg-indigo-400 cursor-wait"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-900"
              }`}
            >
              {signingIn ? (
                <>
                  <Spinner size={16} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {submitError && (
            <div
              role="alert"
              className="mt-3 ml-1 text-xs text-red-300 bg-red-800/20 p-2 rounded"
            >
              {submitError}
            </div>
          )}

          {/* Removed "Forgot password" link as requested */}
        </div>
      </div>

      {/* ----- Redesigned Change Password Popup ----- */}
      {showPasswordChangePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Change Your Password
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  For security, please pick a new password (min 8 characters).
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordChangePopup(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setPwTouched(false);
                  setConfirmTouched(false);
                }}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <div className="flex items-center gap-3 px-4 py-2 rounded bg-gray-50 border">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => setPwTouched(true)}
                    className="w-full outline-none text-sm text-gray-900 bg-transparent"
                    aria-label="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((s) => !s)}
                    className="text-gray-500"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                    title={passwordVisible ? "Hide password" : "Show password"}
                  >
                    {passwordVisible ? "Hide" : "Show"}
                  </button>
                </div>
                {/* hint */}
                <div className="mt-2 text-xs">
                  <p
                    className={`${
                      passwordIsValid ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {passwordIsValid
                      ? "Good — password length OK."
                      : "Password must be at least 8 characters."}
                  </p>
                </div>
              </label>

              <label className="block text-sm">
                <div className="flex items-center gap-3 px-4 py-2 rounded bg-gray-50 border">
                  <input
                    type={confirmVisible ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    className="w-full outline-none text-sm text-gray-900 bg-transparent"
                    aria-label="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmVisible((s) => !s)}
                    className="text-gray-500"
                    aria-label={
                      confirmVisible ? "Hide password" : "Show password"
                    }
                    title={confirmVisible ? "Hide password" : "Show password"}
                  >
                    {confirmVisible ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="mt-2 text-xs">
                  {!passwordsMatch && confirmTouched ? (
                    <p className="text-red-500">Passwords do not match.</p>
                  ) : (
                    passwordsMatch &&
                    confirmTouched && (
                      <p className="text-green-600">Passwords match.</p>
                    )
                  )}
                </div>
              </label>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    // cancel & reset
                    setShowPasswordChangePopup(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setPwTouched(false);
                    setConfirmTouched(false);
                  }}
                  className="flex-1 py-2 border rounded text-gray-700 hover:bg-gray-50"
                  disabled={updatingPassword}
                >
                  Cancel
                </button>

                <button
                  onClick={handlePasswordChange}
                  disabled={!canUpdatePassword || updatingPassword}
                  className={`flex-1 py-2 rounded text-white flex items-center justify-center gap-2 ${
                    canUpdatePassword && !updatingPassword
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-indigo-300 cursor-not-allowed"
                  }`}
                >
                  {updatingPassword ? (
                    <>
                      <Spinner size={16} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
