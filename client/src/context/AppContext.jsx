import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
  axios.defaults.withCredentials = true;
  const [authLoading, setAuthLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [isLoggedin, setIsLoggedin] = useState(() => {
    const stored = localStorage.getItem("isLoggedin");
    return stored ? JSON.parse(stored) : false;
  });
  const [userData, setUserData] = useState(() => {
    const stored = localStorage.getItem("userData");
    return stored ? JSON.parse(stored) : false;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    const stored = localStorage.getItem("isAdmin");
    return stored ? JSON.parse(stored) : false;
  });

  const [userType, setUserType] = useState(() => {
    const stored = localStorage.getItem("userType");
    return stored ? JSON.parse(stored) : null;
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem("isLoggedin", JSON.stringify(isLoggedin));
  }, [isLoggedin]);

  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    localStorage.setItem("isAdmin", JSON.stringify(isAdmin));
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem("userType", JSON.stringify(userType));
  }, [userType]);

  const getAuthState = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/auth/is-auth");

      if (data.success) {
        setIsLoggedin(true);

        const derivedIsAdmin =
          typeof data.isAdmin === "boolean"
            ? data.isAdmin
            : data.user?.userType === "admin" ||
              data.user?.userType === "superadmin";

        setIsAdmin(derivedIsAdmin);

        if (data.user?.userType) setUserType(data.user.userType);

        await getUserData(derivedIsAdmin);
      } else {
        setIsLoggedin(false);
        setIsAdmin(false);
        setUserData(false);
        setUserType(null);
      }
    } catch (error) {
      setIsLoggedin(false);
      setIsAdmin(false);
      setUserData(false);
      setUserType(null);
    } finally {
      setAuthLoading(false); // ✅ mark as finished
    }
  };

  const getUserData = async (isAdminFlag = isAdmin) => {
    try {
      const endpoint = isAdminFlag ? "/api/admin/data" : "/api/user/data";

      const { data } = await axios.get(backendUrl + endpoint);

      if (data.success) {
        setUserData(data.userData);
        if (data.userData?.userType) {
          setUserType(data.userData.userType);
        }
        return data.userData;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  const value = {
    backendUrl,
    isLoggedin,
    setIsLoggedin,
    isAdmin,
    setIsAdmin,
    userData,
    setUserData,
    userType, // ✅ Added here for global use
    setUserType,
    getUserData,
    authLoading, 
  };

  return (
    <AppContent.Provider value={value}>{props.children}</AppContent.Provider>
  );
};
