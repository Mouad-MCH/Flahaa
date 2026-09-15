import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Task from "../models/Task.js";
import Payroll from "../models/Payroll.js";
import { buildWorkerScope } from '../utils/workerScope.js'


export const getDashboardService  = async (farm_id, user) => {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);


    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();


    const monthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1));

    const nextMonthStart = new Date(
        Date.UTC(currentYear, currentMonth, 1)
    );

    const sixMonthsAgo = new Date(
        Date.UTC(currentYear, currentMonth - 6, 1)
    )


    if(user.role === "admin") {
        const [
            totalWorkers,
            activeWorkers,
            supervisors,
            attendanceStats,
            taskStats,
            payrollStats,
            recentTasks,
            recentWorkers,
            monthlyAttendance
        ] = await Promise.all([
            Worker.countDocuments({ farm_id }),
            Worker.countDocuments({ farm_id, status: "active" }),

            User.countDocuments({ farm_id, role: "supervisor", status: "active" }),

            Attendance.aggregate([
                {
                    $match: {
                        farm_id,
                        date: { $gte: todayStart, $lt: todayEnd },
                    }
                },

                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),

            Task.aggregate([
                {
                    $match: {
                        farm_id,
                    },

                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),

            Payroll.aggregate([
                {
                    $match: {
                        farm_id,
                        month: currentMonth,
                        year: currentYear
                    }
                },
                {
                    $group: {
                        _id: null,

                        pending_count: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                            }
                        },

                        paid_count: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "paid"] }, 1, 0]
                            }
                        },

                        total_net_salary: { $sum: "$net_salary" }
                    }
                }
            ]),

            Task.find({ farm_id }).populate('assignments.worker_id', 'name avatar').sort({ date: -1 }).limit(5).lean(),
            
            Worker.find({
                farm_id
            })
              .sort({
                createdAt: -1,
              })
              .limit(5)
              .select(
                "name phone CIN contract_type daily_rate status avatar createdAt"
              )
              .lean(),

            Attendance.aggregate([
                {
                    $match: {
                        farm_id,
                        date: {
                            $gte: sixMonthsAgo,
                            $lt: nextMonthStart
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$date"
                            },
                            month: {
                                $month: '$date'
                            },
                            status: "$status"
                        },
                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $group: {
                        _id: {
                            year: "$_id.year",
                            month: "$_id.month"
                        },

                        present: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.status", "present"] }, "$count", 0],
                            }
                        },

                        absent: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.status", "absent"] }, "$count", 0]
                            }
                        },

                        excused: {
                            $sum: {
                                $cond: [{ $eq: ["$_id.status", "excused"] }, "$count", 0]
                            }
                        }
                    }
                },
                {
                    $sort: {
                        "_id.year": 1,
                        "_id.month": 1
                    }
                }
            ])
        ])

        const present = attendanceStats.find(stat => stat._id === 'present')?.count || 0;
        const absent = attendanceStats.find(stat => stat._id === 'absent')?.count || 0;
        const excused = attendanceStats.find(stat => stat._id === 'excused')?.count || 0;

        const notRecorded = Math.max(
            0,
            activeWorkers - (present + absent + excused)
        )

        const tasksPending = taskStats.find(stat => stat._id === 'pending')?.count || 0;
        const tasksInProgress = taskStats.find(stat => stat._id === 'in_progress')?.count || 0;
        const tasksDone = taskStats.find(stat => stat._id === 'done')?.count || 0;

        const payroll = payrollStats[0] || {
            pending_count: 0,
            paid_count: 0,
            total_net_salary: 0
        }

        const monthlyAttendanceFormatted = [];


        for(let i = 5; i >= 0; i--) {
            const date = new Date(
                Date.UTC(
                    currentYear,
                    currentMonth - 1 - i,
                    1
                )
            );


            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();

            const attendanceMonth = monthlyAttendance.find(
                item => 
                    item._id.month === month &&
                    item._id.year === year
            );


            monthlyAttendanceFormatted.push({
                month,
                year,
                present: attendanceMonth?.present || 0,
                absent: attendanceMonth?.absent || 0,
                excused: attendanceMonth?.excused ||0
            })
        }


        return {
            role: "admin",

            period: {
                month: currentMonth,
                year: currentYear
            },

            summary: {
                total_workers: totalWorkers,
                active_workers: activeWorkers,
                supervisors: supervisors,

                today_present: present,
                today_absent: absent,
                today_excused: excused,
                attendance_not_recorded: notRecorded,

                tasks_pending: tasksPending,
                tasks_in_progress: tasksInProgress,
                tasks_done: tasksDone,

                payroll_pending: payroll.pending_count,
                payroll_paid: payroll.paid_count,
                total_net_salary: payroll.total_net_salary
            },

            attendance: {
                present,
                absent,
                excused,
                not_recorded: notRecorded
            },

            payroll: {
                pending_count: payroll.pending_count,
                paid_count: payroll.paid_count,
                total_net_salary: payroll.total_net_salary
            },

            monthly_attendance: monthlyAttendanceFormatted,

            recent_workers: recentWorkers,

            recent_tasks: recentTasks
        }
    }

    if(user.role === "supervisor") {
        const workerScope = buildWorkerScope(farm_id, user);

        const allWorkers = await Worker.find(workerScope)
            .select('_id status')
            .lean();

        const activeWorkers = allWorkers.filter(
            worker => worker.status === "active"
        );

        const workerIds = allWorkers.map(
            worker => worker._id
        );

        const activeWorkerIds = activeWorkers.map(
            worker => worker._id
        );

        const [
            attendanceStats,
            taskStats,
            recentTasks
        ] = await Promise.all([
            Attendance.aggregate([
                {
                    $match: {
                        farm_id,
                        worker_id: {
                            $in: activeWorkerIds,
                        },
                        date: {
                            $gte: todayStart,
                            $lt: todayEnd
                        }
                    }
                },

                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]),

            Task.aggregate([
                {
                    $match: {
                        farm_id,
                        'assignments.worker_id': {
                            $in: workerIds
                        }
                    }
                },
                {
                    $unwind: "$assignments"
                },

                {
                    $match: {
                        "assignments.worker_id": {
                            $in: workerIds
                        }
                    }
                },

                {
                    $group: {
                        _id: '$assignments.status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Task.find({
                farm_id,
                'assignments.worker_id': {
                    $in: workerIds,
                }
            })
              .populate('assignments.worker_id', 'name avatar')
              .sort({ date: -1 })
              .limit(5)
              .lean()
        ])


        const present = attendanceStats.find(item => item._id === "present")?.count || 0;
        const absent = attendanceStats.find(item => item._id === 'absent')?.count || 0;
        const excused = attendanceStats.find(item => item._id === "excused")?.count ||0;

        const notRecorded = Math.max(
            0,
            activeWorkers.length - (present + absent + excused)
        );

        const tasksPending = taskStats.find(item => item._id === 'pending')?.count || 0;
        const tasksInProgress = taskStats.find(item => item._id === 'in_progress')?.count || 0;
        const tasksDone = taskStats.find(item => item._id === 'done')?.count || 0;

        const recentTasksFiltered = recentTasks.map(task => {
            const assignments = task.assignments.filter(
                assignment => {
                    const workerId = assignment.worker_id?._id ?? assignment.worker_id;
                    return workerIds.some(
                        id => String(id) === String(workerId)
                    )
                }
            )

            return {
                ...task,
                assignments
            }
        })


        return {
            role: 'supervisor',

            summary: {
                total_workers: allWorkers.length,
                active_workers: activeWorkers.length,

                today_present: present,
                today_absent: absent,
                today_excused: excused,
                attendance_not_recorded: notRecorded,

                tasks_pending: tasksPending,
                tasks_in_progress: tasksInProgress,
                tasks_done: tasksDone
            },

            attendance: {
                present,
                absent,
                excused,
                not_recorded: notRecorded
            },

            recent_tasks: recentTasksFiltered
        };



    }

    if(user.role === "worker") {
        if(!user.worker_id) {
            const error = new Error(
                "This account is not linked to a worker record"
            );
            error.statusCode = 403;
            throw error;
        }

        const [
            attendanceStats,
            taskStats,
            currentPayroll,
            recentTasks
        ] = await Promise.all([
            Attendance.aggregate([
                {
                    $match: {
                        farm_id,
                        worker_id: user.worker_id,
                        date: {
                            $gte: monthStart,
                            $lt: nextMonthStart
                        }
                    },

                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Task.aggregate([
                {
                    $match: {
                        farm_id,
                        'assignments.worker_id': user.worker_id
                    }
                },
                {
                    $unwind: '$assignments'
                },

                {
                    $match: {
                        'assignments.worker_id': user.worker_id
                    }
                },

                {
                    $group: {
                        _id: '$assignments.status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Payroll.findOne({
                farm_id,
                worker_id: user.worker_id,
                month: currentMonth,
                year: currentYear
            })
            .select(
                'month year working_days daily_rate base_salary bonuses deductions net_salary status paid_at'
            )
            .lean(),

            Task.find({
                farm_id,
                'assignments.worker_id': user.worker_id
            })
               .populate('assignments.worker_id', 'name avatar')
               .sort({ date: -1 })
               .limit(5)
               .lean()
        ]);

        const present = attendanceStats.find(item => item._id === 'present')?.count || 0;
        const absent = attendanceStats.find(item => item._id === 'absent')?.count || 0;
        const excused = attendanceStats.find(item => item._id === 'excused')?.count || 0;


        const tasksPending = taskStats.find(item => item._id === 'pending')?.count || 0;
        const tasksInProgress = taskStats.find(item => item._id === 'in_progress')?.count || 0;
        const tasksDone = taskStats.find(item => item._id === 'done')?.count || 0;


        const recentTasksFiltered = recentTasks.map(task => {

            const assignments = task.assignments.filter(
                assignment => {

                    const workerId =
                        assignment.worker_id?._id ??
                        assignment.worker_id;

                    return String(workerId) === String(user.worker_id);
                }
            );

            return {
                ...task,
                assignments
            };
        });


        return {
            role: 'worker',

            period: {
                month: currentMonth,
                year: currentYear
            },

            summary: {
                tasks_pending: tasksPending,
                tasks_in_progress: tasksInProgress,
                tasks_done: tasksDone,

                present_days_this_month: present,
                absent_days_this_month: absent,
                excused_days_this_month: excused
            },

            attendance: {
                present,
                absent,
                excused
            },

            current_payroll: currentPayroll || null,

            recent_tasks: recentTasksFiltered
        };
    }

    const error = new Error('Role not supported');
    error.statusCode = 403;
    throw error;
}