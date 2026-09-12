import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyFarms } from "../services/farmService.js";
import { useFarmStore } from "../store/farmStore.js";

export function useSelectFarmPage() {
    const navigate = useNavigate();
    const { activeFarmId, setActiveFarmId, setFarmActive } = useFarmStore();

    const { data: farms = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["farms", "mine"],
        queryFn: getMyFarms,
    });

    useEffect(() => {
        if (activeFarmId) {
            navigate("/dashboard", { replace: true });
        }
    }, [activeFarmId, navigate]);

    const selectFarm = (farm) => {
        setActiveFarmId(farm._id);
        setFarmActive(farm)
        navigate("/dashboard", { replace: true });
    };

    return { farms, isLoading, isError, selectFarm, refetch };
}
