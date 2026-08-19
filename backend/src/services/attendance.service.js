import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Worker from "../models/Worker.js";



export const createAttendanceService = async (farm_id, data, userId) => {
    const { worker_id, date, status, check_in, check_out } = data;
    
    const worker = await Worker.findOne({ _id: worker_id, farm_id });
    if(!worker) {
        const error = new Error('Worker not found on this farm');
        error.statusCode = 404;
        throw error;
    };

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({ worker_id, date: attendanceDate, farm_id });
    if(existing) {
        const error = new Error("Attendance already recorded for this worker on this date");
        error.statusCode = 400;
        throw error;
    }

    let attendance;
    try {
        attendance = await Attendance.create({
            worker_id,
            farm_id,
            date: attendanceDate,
            status,
            check_in: check_in ? new Date(check_in) : undefined,
            check_out: check_out ? new Date(check_out) : undefined,
            recorded_by: userId,
        })
    } catch(err) {
        if(err.code === 11000) {
            const error = new Error("Attendance already recorded for this worker on this date");
            error.statusCode = 400;
            throw error;
        }
        throw err;
    }

    return attendance
}

export const bulkCreateAttendanceService = async (farm_id, data, userId) => {
    const { date, records } = data;

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    const workerIds = records.map(r => r.worker_id);
    const validWorkers = await Worker.find({ _id: { $in: workerIds }, farm_id });
    const validWorkerIdSet = new Set(validWorkers.map(w => w._id.toString()));
    const workerNameById = new Map(validWorkers.map(w => [w._id.toString(), w.name]));

    const absentWorkerNames = [];

    for(const record of records) {
        try {
            if(!validWorkerIdSet.has(record.worker_id?.toString())) {
                errors.push({ 
                    worker_id: record.worker_id, 
                    message: 'Worker not found on this farm' 
                });

                continue;
            }

            const setFields = {
                worker_id: record.worker_id,
                farm_id,
                date: attendanceDate,
                status: record.status || 'present',
                recorded_by: userId,
            };
            const unsetFields = {};

            if (record.check_in) {
                setFields.check_in = new Date(record.check_in);
            } else {
                unsetFields.check_in = "";
            }

            if (record.check_out) {
                setFields.check_out = new Date(record.check_out);
            } else {
                unsetFields.check_out = "";
            }

            const attendance = await Attendance.findOneAndUpdate(
                {
                    worker_id: record.worker_id,
                    farm_id,
                    date: attendanceDate,
                },
                {
                    $set: setFields,
                    $unset: unsetFields,
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );

            results.push(attendance);
            if((record.status || 'present') === "absent") {
                absentWorkerNames.push(workerNameById.get(record.worker_id?.toString()))
            }

        } catch(err) {
           errors.push({ 
            worker_id: record.worker_id,
            message: err.message
           });
        }
    }

    return {
        recorded: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
    }

}

export const getAttendanceByDateService = async (farm_id, query) => {
    const { date } = query;

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const records = await Attendance.find({
        farm_id,
        date: attendanceDate,
    })
    .populate('worker_id', "name CIN avatar status")
    .populate('recorded_by', 'name');

    records.sort((a, b) => (a.worker_id?.name || '').localeCompare(b.worker_id?.name || '') );

    const allActiveWorkers = await Worker.find({
        farm_id,
        status: 'active'
    }).select('name CIN avatar');

    const recordedWorkerIds = records.map(r => r.worker_id?.id?.toString());
    const unrecordedWorkers = allActiveWorkers.filter(w => !recordedWorkerIds.includes(w._id.toString()));

    return {
        date: attendanceDate,
        total_recorded: records.length,
        total_unrecorded: unrecordedWorkers.length,
        records,
        unrecorded_workers: unrecordedWorkers
    }

}

export const getWorkerAttendanceService = async (farm_id, worker_id, { month, year }) => {

   const match = {
        farm_id: new mongoose.Types.ObjectId(farm_id),
        worker_id: new mongoose.Types.ObjectId(worker_id),
    };

   if(month && year) {
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 1));

    match.date = {
        $gte: startDate,
        $lt: endDate,
    };
   }

   const [result] = await Attendance.aggregate([
    {
        $match: match,
    },
    {
        $facet: {
            records: [
                {
                    $sort: {
                        date: -1,
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'recorded_by',
                        foreignField: '_id',
                        as: 'recorded_by'
                    },
                },
                {
                    $unwind: {
                        path: '$recorded_by',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        worker_id: 1,
                        farm_id: 1,
                        date: 1,
                        status: 1,
                        check_in: 1,
                        check_out: 1,
                        recorded_by: {
                            _id: 1,
                            name: 1
                        },
                    }
                }
            ],

            summary: [
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ],

            total: [
                {
                   $count: 'count'
                },
            ]


        }
    }
   ])

   const summary = {
    present: 0,
    absent: 0,
    excused: 0,
   }

   for(const item of result.summary) {
    summary[item._id] = item.count
   }


   return {
    total: result.total[0]?.count || 0,
    summary,
    records: result.records,
   }

}

export const getMonthlySummaryService = async (farm_id, months) => {
  const monthsCount = Math.min(months || 6, 12);

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsCount - 1), 1));

  const results = await Attendance.aggregate([
    { $match: { farm_id, date: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: '$date' },
        },
        
        present: {
          $sum: {
            $cond: [
             { $eq: ['$status', 'present'] },
             1,
             0
            ]
          }
        },

        absent: {
            $sum: {
                $cond: [
                    { $eq: ['$status', 'absent'] },
                    1,
                    0
                ]
            }
        },

        excused: {
            $sum: {
                $cond: [
                    { $eq: ['$status', 'excused'] },
                    1,
                    0
                ]
            }
        },

        total: {
            $sum: 1
        }
      }
    },

    {
        $sort: {
            '_id.year': 1,
            '_id.month': 1,
        }
    }
  ]);

  const resultMap = new Map(
    results.map((r) => [
        `${r._id.year}-${r._id.month}`,
        r
    ])
  );

  const buckets = [];

  for(let i = monthsCount -1; i>= 0; i--) {
    const date = new Date(
       Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - i,
        1
       )
    )

    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;

    const result = resultMap.get(`${year}-${month}`);

    buckets.push({
        year,
        month,
        present: result?.present || 0,
        absent: result?.absent || 0,
        excused: result?.excused || 0,
        total: result?.total || 0,
    })

  }


  return buckets

}

