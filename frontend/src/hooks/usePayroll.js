import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listPayrolls, calculatePayroll, updatePayrollStatus } from '../services/payrollService';
import { listWorkers } from '../services/workerService';

const today = new Date();

export const usePayroll = () => {
  const queryClient = useQueryClient();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [calculateMode, setCalculateMode] = useState(null);
  const [markingPayroll, setMarkingPayroll] = useState(null);

  const payrollsQueryKey = ['payrolls', { month, year }];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: payrollsQueryKey,
    queryFn: () => listPayrolls({ month, year, limit: 100 }),
    placeholderData: keepPreviousData,
  });

  const { data: workersData } = useQuery({
    queryKey: ['workers_payroll'],
    queryFn: () => listWorkers({ limit: 100, status: 'active' }),
  });

  const records = data?.records || [];
  const total = data?.pagination?.total || 0;
  const workers = workersData?.workers || [];

  const totalNet = records.reduce((sum, r) => sum + (r.net_salary || 0), 0);
  const paidCount = records.filter((r) => r.status === 'paid').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;

  const invalidatePayrolls = () => queryClient.invalidateQueries({ queryKey: ['payrolls'] });

  const calculateMutation = useMutation({
    mutationFn: calculatePayroll,
    onSuccess: () => {
      toast.success('Payroll calculated');
      setCalculateMode(null);
      invalidatePayrolls();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to calculate payroll'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => updatePayrollStatus(id, 'paid'),
    onSuccess: () => {
      toast.success('Marked as paid');
      setMarkingPayroll(null);
      invalidatePayrolls();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status'),
  });

  return {
    month,
    setMonth,
    year,
    setYear,

    records,
    total,
    workers,
    isLoading,
    isFetching,

    totalNet,
    paidCount,
    pendingCount,

    calculateMode,
    openCalculate: () => setCalculateMode('calculate'),
    closeCalculate: () => setCalculateMode(null),
    handleCalculate: (payload) => calculateMutation.mutate(payload),
    isCalculating: calculateMutation.isPending,

    markingPayroll,
    setMarkingPayroll,
    handleMarkPaid: () => markingPayroll && markPaidMutation.mutate(markingPayroll._id),
    isMarkingPaid: markPaidMutation.isPending,
  };
};
