import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { createFarm, getMyFarms } from "../services/farmService.js";
import { useFarmStore } from "../store/farmStore.js";
import toast from "react-hot-toast";

export function useSelectFarmPage() {
    const queryClient = useQueryClient()
    const navigate = useNavigate();
    const { activeFarmId, setActiveFarmId, setFarmActive } = useFarmStore();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: farms = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["farms", "mine"],
        queryFn: getMyFarms,
    });

    const createFarmMutation = useMutation({
        mutationFn: createFarm,
        onSuccess: () => {
            toast.success('farm is created successfully');
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['farms', 'mine'] })
        },
        onError: (error) => toast.error(error.response?.data?.message ||'Failed to create farm')
    })

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

    return {
        farms, isLoading, isError, selectFarm, refetch,
        createFarm: (payload) => createFarmMutation.mutate(payload),
        createFarmLoading: createFarmMutation.isPending,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
    };
}
