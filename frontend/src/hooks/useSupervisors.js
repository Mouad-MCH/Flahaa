import { useQueryClient, useQuery, keepPreviousData, useMutation } from "@tanstack/react-query"
import { deleteSupervisor, listSupervisor, updateSupervisor } from "../services/supervisorService.js";
import { useState } from "react";
import toast from "react-hot-toast";
import { createRegistrationToken } from "../services/registrationTokenService.js";




export const useSupervisors = () => {
    const queryClient = useQueryClient();

    const [isFormOpen, setIsFormOpen]  = useState(false);
    const [deletingSupervisor, setDeletingSupervisor] = useState(null);
    const [editingSupervisor, setEditingSupervisor] = useState(null)

    const deleteMutation = useMutation({
        mutationFn: deleteSupervisor,
        onSuccess: () => {
            toast.success('Supervisor deleted successfully');
            setDeletingSupervisor(null)
            queryClient.invalidateQueries({ queryKey: ['supervisors'] })
        },
        onError: (error) => {
            toast.error(
                error.response?.data?.message ||'Failed tot delete supervisor'
            )
        }
    })

    const { data: supervisors, isLoading, isFetching } = useQuery({
        queryKey: ['supervisors'],
        queryFn: listSupervisor,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false
    });

    const createMutation = useMutation({
        mutationFn: createRegistrationToken,
        onSuccess: () => {
            toast.success('Supervisor invite successfully');
            setIsFormOpen(false);
            queryClient.invalidateQueries({queryKey: ['supervisors']});
        },

        onError: (error) => toast.error(error.response?.data?.message || 'Failed to add supervisor'),
    });

    const updateMutation = useMutation({
        mutationFn: ({id, data}) => updateSupervisor(id, data),
        onSuccess: () => {
            toast.success('Supervisor updated successfully');
            setIsFormOpen(false);
            queryClient.invalidateQueries({queryKey: ['supervisors']});
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update Supervisor'),
    })

    const handlDeleteConfirm = () => {
        if (deletingSupervisor) deleteMutation.mutate(deleteMutation._id);
    }

    const handleAddSupervisor = () => {
        setEditingSupervisor(null);
        setIsFormOpen(true);
    };

    const handleEditSupervisor = (supervisor) => {
        setEditingSupervisor(supervisor);
        setIsFormOpen(true);
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
        setEditingSupervisor(null)
    }

    const handleFormSubmit = (data) => {
        if(editingSupervisor) {
            updateMutation.mutate({id: editingSupervisor._id, data})
        }else {
            createMutation.mutate(data)
        }
    }

    

    return {
        supervisors,
        isLoading: isLoading || isFetching,

        isFormOpen,
        editingSupervisor,

        deletingSupervisor,
        setDeletingSupervisor,
        handlDeleteConfirm,

        handleAddSupervisor,
        handleEditSupervisor,
        handleFormSubmit,

        handleCloseForm,

        isSubmitting: createMutation.isPending,
        isDeleting: deleteMutation.isPending
    }

}