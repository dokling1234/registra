import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContent = createContext();

export const AppContextProvider = (props) => {
    axios.defaults.withCredentials = true;

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false); // NEW: track if admin

    const getAuthState = async () => {
    try {
        const { data } = await axios.get(backendUrl + "/api/auth/is-auth");

        if (data.success) {
            setIsLoggedin(true);
            setIsAdmin(data.isAdmin || false);
            await getUserData(data.isAdmin || false);
        } else {
            console.warn("Auth check failed:", data);
        }
    } catch (error) {
        console.error("Auth check error:", error);  // LOG ERROR DETAILS

        if (error.response) {
            // Server responded with a status outside 2xx
            console.error("Response error:", error.response.data);
            //toast.error(error.response.data?.message || "Server error");
        } else if (error.request) {
            // Request made, no response
            console.error("No response received:", error.request);
            toast.error("No response from server");
        } else {
            // Something else happened setting up the request
            console.error("Request setup error:", error.message);
            toast.error(error.message);
        }

        setIsLoggedin(false);
        setIsAdmin(false);
    }
};
    const getUserData = async (isAdminFlag = isAdmin) => {
        try {
            const endpoint = isAdminFlag 
                ? "/api/admin/data" 
                : "/api/user/data";

            const { data } = await axios.get(backendUrl + endpoint);

            if (data.success) {
                setUserData(data.userData);
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
        userData,
        setUserData,
        getUserData,
    };

    return (
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    );
};
