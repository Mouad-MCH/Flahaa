import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listTasks,
  createTask,
  deleteTask,
  addAssignees,
  removeAssignee,
  updateAssignmentStatus,
  rateAssignment,
} from '../services/taskService';
import { listWorkers } from '../services/workerService';

const STATUS_LIST = ['pending', 'in_progress', 'done'];

// A 403 from createTask/addAssignees carries unauthorized_worker_ids when the
// caller doesn't own one or more of the requested workers and has no approved
// loan for this date — surface that distinctly from a generic failure.
function assignmentErrorMessage(error, fallback) {
  const count = error.response?.data?.unauthorized_worker_ids?.length;
  if (count) {
    return `${count} worker${count > 1 ? 's' : ''} need an approved loan request for this date`;
  }
  return error.response?.data?.message || fallback;
}

export const useTasks = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const tasksQueryKey = ['tasks', { date, status }];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => listTasks({ date: date || undefined, status: status || undefined, limit: 100 }),
    placeholderData: keepPreviousData,
  });

  const { data: workersData } = useQuery({
    queryKey: ['workers_task_assign'],
    queryFn: () => listWorkers({ limit: 100, status: 'active' }),
  });

  const tasks = data?.tasks || [];
  const total = data?.pagination?.total || 0;
  const workers = workersData?.workers || [];

  const counts = STATUS_LIST.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s).length }), {});

  const invalidateTasks = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

  const replaceTaskInCache = (updated) => {
    queryClient.setQueryData(tasksQueryKey, (prev) =>
      prev ? { ...prev, tasks: prev.tasks.map((t) => (t._id === updated._id ? updated : t)) } : prev
    );
  };

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success('Task assigned');
      setIsFormOpen(false);
      invalidateTasks();
    },
    onError: (error) => toast.error(assignmentErrorMessage(error, 'Failed to create task')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (_data, id) => {
      toast.success('Task deleted');
      queryClient.setQueryData(tasksQueryKey, (prev) =>
        prev ? { ...prev, tasks: prev.tasks.filter((t) => t._id !== id) } : prev
      );
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete task'),
  });

  const addAssigneesMutation = useMutation({
    mutationFn: ({ taskId, workerIds }) => addAssignees(taskId, workerIds),
    onSuccess: (task) => {
      toast.success('Worker added');
      replaceTaskInCache(task);
    },
    onError: (error) => toast.error(assignmentErrorMessage(error, 'Failed to add worker')),
  });

  const removeAssigneeMutation = useMutation({
    mutationFn: ({ taskId, workerId }) => removeAssignee(taskId, workerId),
    onSuccess: (task) => replaceTaskInCache(task),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to remove worker'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ taskId, workerId, status: nextStatus }) => updateAssignmentStatus(taskId, workerId, nextStatus),
    onSuccess: (task) => replaceTaskInCache(task),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  const ratingMutation = useMutation({
    mutationFn: ({ taskId, workerId, rating }) => rateAssignment(taskId, workerId, rating),
    onSuccess: (task) => replaceTaskInCache(task),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to rate worker'),
  });

  const toggleExpand = (taskId) => setExpandedTaskId((prev) => (prev === taskId ? null : taskId));

  const handleDelete = (taskId) => {
    if (!confirm('Delete this task?')) return;
    deleteMutation.mutate(taskId);
  };

  return {
    date,
    setDate,
    status,
    setStatus,

    tasks,
    total,
    counts,
    workers,
    isLoading,
    isFetching,

    expandedTaskId,
    toggleExpand,

    isFormOpen,
    openForm: () => setIsFormOpen(true),
    closeForm: () => setIsFormOpen(false),

    handleCreateTask: (payload) => createMutation.mutate(payload),
    isCreating: createMutation.isPending,

    handleDelete,
    handleAddAssignees: (taskId, workerIds) => addAssigneesMutation.mutateAsync({ taskId, workerIds }),
    handleRemoveAssignee: (taskId, workerId) => removeAssigneeMutation.mutate({ taskId, workerId }),
    handleStatusUpdate: (taskId, workerId, nextStatus) => statusMutation.mutate({ taskId, workerId, status: nextStatus }),
    handleRating: (taskId, workerId, rating) => ratingMutation.mutate({ taskId, workerId, rating }),
  };
};
