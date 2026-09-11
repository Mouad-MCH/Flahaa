import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";


const AuthRedirect = ({ children }) => {
    
    const {user, token} = useAuthStore()

    if(token || user) {
        return <Navigate to={'/'} replace/>
    }

  return children
}


export default AuthRedirect
