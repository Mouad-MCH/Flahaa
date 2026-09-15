import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore"
import { useFarmStore } from "../store/farmStore";
import { getDashboard } from "../services/dashboardService";



export const useDashboard = () => {
    const user = useAuthStore(state => state.user);
    const activeFarmId = useFarmStore(state => state.activeFarmId);

    const farmId = 
        user?.role === "admin"
        ? activeFarmId
        : null;

    const { data: dashboard, isLoading, isError } = useQuery({
        queryKey: ["dashboard", user?.role, farmId],
        queryFn: () => getDashboard(),
        enabled:
        !!user &&
        (
            user.role !== "admin" ||
            !!activeFarmId
        ),
        staleTime: 60_000,
    });

    return { dashboard, isLoading, isError }
}