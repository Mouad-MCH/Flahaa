import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listMyTasks, updateMyTaskStatus } from '../services/taskService';

const STATUS_LIST = ['pending', 'in_progress', 'done'];

export const useMyTasks = () => {
  const queryClient = useQueryClient();

  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');

  const tasksQueryKey = ['my-tasks', { date, status }];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => listMyTasks({ date: date || undefined, status: status || undefined, limit: 100 }),
    placeholderData: keepPreviousData,
  });

  const tasks = data?.tasks || [];
  const total = data?.pagination?.total || 0;

  const counts = STATUS_LIST.reduce(
    (acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.my_assignment?.status === s).length }),
    {}
  );

  const statusMutation = useMutation({
    mutationFn: ({ taskId, status: nextStatus }) => updateMyTaskStatus(taskId, nextStatus),
    onSuccess: (task) => {
      queryClient.setQueryData(tasksQueryKey, (prev) =>
        prev ? { ...prev, tasks: prev.tasks.map((t) => (t._id === task._id ? task : t)) } : prev
      );
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  return {
    date,
    setDate,
    status,
    setStatus,

    tasks,
    total,
    counts,
    isLoading,
    isFetching,

    handleStatusUpdate: (taskId, nextStatus) => statusMutation.mutate({ taskId, status: nextStatus }),
    updatingTaskId: statusMutation.isPending ? statusMutation.variables?.taskId : null,
  };
};
