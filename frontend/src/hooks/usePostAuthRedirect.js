import { useNavigate } from "react-router-dom"
import { useFarmStore } from "../store/farmStore.js";
import { getMyFarms } from "../services/farmService.js";

export const usePostAuthRedirect = () => {
    const navigate = useNavigate();
    const {activeFarmId, setActiveFarmId} = useFarmStore();


    return async function redirectAfterAuth(user) {
        if(user.role !== "admin") {
            navigate('/dashboard', { replace: true })
            return
        }

        try {
            const farms = await getMyFarms();

            if(farms.length <= 1) {
                if(farms.length == 1) setActiveFarmId(farms[0]._id);
                navigate('/dashboard', { replace: true })
            } else {
                navigate('/select-farm', { replace: true })
            }

        } catch {
             navigate('/dashboard', { replace: true })
        }
    }

    
}