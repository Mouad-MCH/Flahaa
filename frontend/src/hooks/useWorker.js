import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listWorkers, createWorker, updateWorker, deleteWorker } from '../services/workerService';
import { listSupervisor } from '../services/supervisorService.js';
import { useAuthStore } from '../store/authStore.js';

const LIMIT = 10;

export const useWorker = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user)

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [editingWorker, setEditingWorker] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingWorker, setDeletingWorker] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['workers', { search: debouncedSearch, status, page }],
    queryFn: () =>
      listWorkers({
        search: debouncedSearch || undefined,
        status: status || undefined,
        page,
        limit: LIMIT,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const {data: supervisors } = useQuery({
    queryKey: ['supervisors_wokrer_form'],
    queryFn: listSupervisor,
    enabled: isFormOpen && user?.role === "admin"
  });

  const workers = data?.workers || [];
  const totalPages = data?.pagination?.pages || 1;
  const total = data?.pagination?.total || 0;

  const invalidateWorkers = () => queryClient.invalidateQueries({ queryKey: ['workers'] });

  const createMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () => {
      toast.success('Worker added successfully');
      setIsFormOpen(false);
      invalidateWorkers();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add worker'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateWorker(id, payload),
    onSuccess: () => {
      toast.success('Worker updated successfully');
      setIsFormOpen(false);
      setEditingWorker(null);
      invalidateWorkers();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update worker'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorker,
    onSuccess: () => {
      toast.success('Worker deleted successfully');
      setDeletingWorker(null);
      invalidateWorkers();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete worker'),
  });

  const handleAddWorker = () => {
    setEditingWorker(null);
    setIsFormOpen(true);
  };

  const handleEditWorker = (worker) => {
    setEditingWorker(worker);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingWorker(null);
  };

  const handleFormSubmit = (payload) => {
    if (editingWorker) {
      updateMutation.mutate({ id: editingWorker._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingWorker) deleteMutation.mutate(deletingWorker._id);
  };

  return {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,

    workers,
    total,
    totalPages,
    isLoading,
    isFetching,

    editingWorker,
    isFormOpen,
    deletingWorker,
    setDeletingWorker,

    handleAddWorker,
    handleEditWorker,
    handleCloseForm,
    handleFormSubmit,
    handleDeleteConfirm,

    supervisors,

    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
