import { useNavigate } from "react-router-dom"

export const usePostAuthRedirect = () => {
    const navigate = useNavigate();

    return function redirectAfterAuth(user) {
        if (user.role !== "admin") {
            navigate('/dashboard', { replace: true })
            return
        }

        navigate('/select-farm', { replace: true })
    }
}
