import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyFarms } from "../services/farmService.js";
import { useFarmStore } from "../store/farmStore.js";

export function useSelectFarmPage() {
    const navigate = useNavigate();
    const { activeFarmId, setActiveFarmId } = useFarmStore();

    const { data: farms = [], isLoading, isError } = useQuery({
        queryKey: ["farms", "mine"],
        queryFn: getMyFarms,
    });

    useEffect(() => {
        if (activeFarmId) {
            navigate("/dashboard", { replace: true });
            return;
        }

        if (isLoading || isError) return;

        if (farms.length <= 1) {
            if (farms.length === 1) setActiveFarmId(farms[0]._id);
            navigate("/dashboard", { replace: true });
        }
    }, [activeFarmId, isLoading, isError, farms, navigate, setActiveFarmId]);

    const selectFarm = (farmId) => {
        setActiveFarmId(farmId);
        navigate("/dashboard", { replace: true });
    };

    return { farms, isLoading, isError, selectFarm };
}
