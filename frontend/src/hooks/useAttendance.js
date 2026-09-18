import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { bulkCreateAttendance, getAttendanceByDate } from "../services/attendanceService";




export const useAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);


    const queryClient = useQueryClient();

    const { data: attendance, isLoading } = useQuery({
        queryKey: ['workers_attendance', date],
        queryFn: () => getAttendanceByDate({date: date}),
        placeholderData: keepPreviousData,
    });

    const markMutation = useMutation({
        mutationFn: ({ workerId, status }) =>
            bulkCreateAttendance({ date, records: [{ worker_id: workerId, status }] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers_attendance', date] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update attendance');
        },
    });

    const markAttendance = (workerId, status) => {
        markMutation.mutate({ workerId, status });
    };

    const notRecorded = attendance?.total_unrecorded || 0;
    const present = attendance?.records?.filter((p) => p.status === "present").length || 0;
    const absent = attendance?.records?.filter((a) => a.status === "absent").length || 0;
    const excused = attendance?.records?.filter((x) => x.status === "excused").length || 0;

    const totalWorkers = (attendance?.total_recorded + attendance?.total_unrecorded) || 0;

    const workers = [
        ...(attendance?.records || []),
        ...(attendance?.unrecorded_workers || []),
    ];



    return {
        workers,
        date,
        setDate,
        counts: { present, absent, excused, notRecorded },
        state: {totalWorkers, totalPresent: present, notRecorded},
        markAttendance,
        markingWorkerId: markMutation.isPending ? markMutation.variables?.workerId : null,
        isLoading
    }
}