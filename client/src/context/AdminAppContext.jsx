import axios from "axios"
import { createContext, useEffect, useState } from "react"
import { toast } from "react-toastify"

export const AppContent = createContext()

export const AppContextProvider = (props) => {

    axios.defaults.withCredentials = true; // kahit irefresh ang page, nakasave pa rin ang cookies makikita yung name

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)

    const getAuthState = async () => {
        try {
            const {data} = await axios.get(backendUrl + '/api/auth/is-auth')
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }
        } catch (error) {
            toast.error(data.message)
            
        }
    }

    const getUserData = async () => {
        try {
          const { data } = await axios.get(backendUrl + '/api/admin/data');
          if (data.success) {
            setUserData(data.userData);
            return data.userData; // return it for immediate access
          } else {
            toast.error(data.message);
          }
        } catch (error) {
          toast.error(error.message);
        }
      };
    useEffect(()=>{
        getAuthState();
    },[])
   
    const value ={
        backendUrl,
        isLoggedin, setIsLoggedin,
        userData, setUserData,
        getUserData
    }

    return (
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    )
}
