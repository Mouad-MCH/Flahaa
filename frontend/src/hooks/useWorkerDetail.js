import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getWorker, updateWorker } from '../services/workerService.js';
import { getWorkerAttendance } from '../services/attendanceService.js';
import { createRegistrationToken } from '../services/registrationTokenService.js';

export const useWorkerDetail = (workerId) => {
  const queryClient = useQueryClient();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data: worker, isLoading: isWorkerLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => getWorker(workerId),
    enabled: !!workerId,
  });

  const { data: attendance, isLoading: isAttendanceLoading, isFetching: isAttendanceFetching } = useQuery({
    queryKey: ['worker-attendance', workerId, year, month],
    queryFn: () => getWorkerAttendance(workerId, { year, month }),
    enabled: !!workerId,
    placeholderData: keepPreviousData,
  });
  
  const updateMutation = useMutation({
    mutationFn: (payload) => updateWorker(workerId, payload),
    onSuccess: () => {
      toast.success('Worker updated successfully');
      setIsEditOpen(false);
      queryClient.invalidateQueries({queryKey: ['worker', workerId]});
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        'Failed to update worker'
      )
    }
  })

  const inviteMutation = useMutation({
    mutationFn: createRegistrationToken,
    onSuccess: () => {
      toast.success('Worker invited successfully');
      setIsInviteOpen(false);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
        'Failed to invite worker'
      )
    }
  })

  return {
    worker,
    isWorkerLoading,

    month,
    setMonth,
    year,
    setYear,

    records: attendance?.records || [],
    summary: attendance?.summary || { present: 0, absent: 0, excused: 0 },
    total: attendance?.total || 0,
    isAttendanceLoading: isAttendanceLoading || isAttendanceFetching,

    isEditOpen,
    openEdit: () => setIsEditOpen(true),
    closeEdit: () => setIsEditOpen(false),
    handleUpdate: (payload) => updateMutation.mutate(payload),
    isUpdating: updateMutation.isPending,

    isInviteOpen,
    openInvite: () => setIsInviteOpen(true),
    closeInvite: () => setIsInviteOpen(false),
    handleInvite: (payload) => inviteMutation.mutate(payload),
    isInviting: inviteMutation.isPending,
  };
};
