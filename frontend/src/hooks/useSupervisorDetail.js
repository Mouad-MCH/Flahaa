import { useQuery, useQueryClient, keepPreviousData, useMutation } from "@tanstack/react-query";
import { getSupervisor, updateSupervisor } from "../services/supervisorService";
import toast from "react-hot-toast";



export const useSupervisorDetail = (supervisorId) => {

    const queryClient = useQueryClient();


    const {data, isLoading: isSupervisorLoading} = useQuery({
        queryKey: ['supervisor', supervisorId],
        queryFn: () => getSupervisor(supervisorId),
        enabled: !!supervisorId,
        placeholderData: keepPreviousData
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}) => updateSupervisor(id, data),
        onSuccess: () => {
            toast.success('Supervisor updated successfully');
            queryClient.invalidateQueries({queryKey: ['supervisors']});
            queryClient.invalidateQueries({queryKey: ['supervisor', supervisorId]});
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update Supervisor'),
    })

    const workers = data?.workers || [];
    const {total: totalWorkers = 0, active: activeWorkers = 0} = data?.workerStats || {};


  return {
    supervisor: data?.supervisor ?? null,
    isSupervisorLoading,
    workers,
    isWorkersLoading: isSupervisorLoading,
    totalWorkers,
    activeWorkers,
  };
};
