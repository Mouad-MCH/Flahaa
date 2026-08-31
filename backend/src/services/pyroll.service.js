import Worker from '../models/Worker.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';



export const calculatePayrollService = async (farm_id, data) => {
    const { worker_id, month, year, bonuses, deductions, notes } = data;

    const worker = await Worker.findOne({
        _id: worker_id,
        farm_id
    });

    if(!worker) {
        throw Object.assign(
            new Error('Worker not found'),
            {
                statusCode: 404
            }
        )
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const present = await Attendance.aggregate([
        {
            $match: {
                worker_id,
                farm_id,
                date: {
                    $gte: start,
                    $lt: end,
                }
            }
        },
        
        {
           $group :{
             _id: null,

             total: {
                $sum: {
                    $cond: [
                        { $eq: ["$status", "present"] },
                        1,
                        0
                    ]
                }
             }
           }
        }
    ]);

    const daily_rate = worker.daily_rate;
    const base_salary = daily_rate * (present[0]?.total || 0);

    const advances_total = await Worker.aggregate([
        {
            $match: {
                _id: worker_id,
                farm_id,
                advances : {
                    $elemMatch: {
                        date: {
                            $gte: start,
                            $lt: end
                        }
                    }
                }
            }
        },

        {
            $unwind: '$advances',
        },

        {
            $match: {
                'advances.date': {
                    $gte: start,
                    $lt: end
                }
            }
        },

        {
            $group: {
                _id: null,
                total: {
                    $sum: '$advances.amount'
                }
            }
        }
    ]);


    const net_salary = Math.max(
        0,
        base_salary + bonuses - (advances_total[0]?.total || 0) - deductions
    );

    const payroll = await Payroll.findOneAndUpdate(
        {
            worker_id,
            month,
            year
        },
        {
            farm_id,
            worker_id,
            month,
            year,
            working_days: present[0]?.total || 0,
            daily_rate,
            bonuses,
            deductions,
            advances_total: advances_total[0]?.total || 0,
            net_salary,
            notes,
            calculated_at: new Date(),
        },
        { upsert: true, new: true, runValidators: true }
    )
    .populate('worker_id', 'name CIN avatar daily_rate contract_type');

    return payroll
}

export const getPayrollsService = async (farm_id, reqQuery) => {
    const { 
        month, 
        year, 
        worker_id, 
        status, 
        page, 
        limit 
    } = reqQuery;

    const query = { farm_id };

    if(month) query.month = month;
    if(year) query.year = year;
    if(status) query.status = status;
    if(worker_id) query.worker_id = worker_id;

    const skip = (page - 1) * limit;

    const [result] = await Payroll.aggregate([
        {
            $match: query
        },
        {
            $facet: {
                records: [
                    {
                        $sort: {
                            year: -1,
                            month: -1,
                        }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    },
                    {
                        $lookup: {
                            from: 'workers',
                            localField: 'worker_id',
                            foreignField: '_id',
                            as: 'worker'
                        }
                    },

                    {
                        $unwind: {
                            path: '$worker',
                            preserveNullAndEmptyArrays: true,
                        }
                    },

                    {
                        $project: {
                            farm_id: 1,
                            worker_id: 1,
                            calculated_at: 1,
                            month: 1,
                            year: 1,
                            working_days: 1,
                            net_salary: 1,
                            status: 1,
                            "worker.name": 1,
                            "worker.avatar": 1,
                            "worker.CIN": 1,
                            "worker.contract_type": 1,
                        }
                    },
                ],

                total: [
                    {
                        $count: 'total'
                    }
                ]
            }
        }
    ])

    return {
        pagination : {
            total: result.total[0]?.total || 0,
            page,
            limit,
            pages: Math.ceil((result.total[0]?.total || 0) / limit),
        },
        records: result.records
    }
}

export const getPayrollByWorkerService = async (farm_id, reqParams) => {
    const { worker_id, month, year } = reqParams;

    const payroll = await Payroll.findOne({
        farm_id,
        worker_id,
        month,
        year
    })
    .populate('worker_id', 'name CIN avatar daily_rate contract_type phone address join_date');

    if(!payroll) {
        throw Object.assign(
            new Error('Payroll record not found. Calculate first.'),
            {
                statusCode: 404
            }
        )
    }

    return payroll
}

export const updatePayrollStausService = async (farm_id, payrollId, data) => {
    const { status } = data;

    const update = { status };
    if(status === 'paid') update.paid_at = new Date();
    
    const payroll = await Payroll.findOneAndUpdate(
        { _id: payrollId, farm_id },
        update,
        { new: true, runValidators: true,  }
    ).populate('worker_id', 'name CIN avatar');
    

    if(!payroll) {
        throw Object.assign(
            new Error('Payroll record not found'),
            {
                statusCode: 404
            }
        )
    }

    return payroll
}

export const getMyPayrollsService = async (user, reqQuery) => {
    if(!user.worker_id) {
        throw Object.assign(
            new Error('This account is not linked to a worker record'),
            {
                statusCode: 403
            }
        )
    }

    const { month, year, page, limit } = reqQuery;

    const query = { worker_id: user.worker_id };

    if(month) query.month = month;
    if(year) query.year = year;

    const skip = (page - 1) * limit;

    const [result] = await Payroll.aggregate([
        {
            $match: query
        },
        {
            $facet: {
                records: [
                    {
                        $sort: {
                            year: -1,
                            month: -1
                        }
                    },
                    
                    {
                        $skip: skip
                    },

                    {
                        $limit: limit
                    },

                    {
                        $lookup: {
                            from: 'workers',
                            localField: 'worker_id',
                            foreignField: '_id',
                            as: 'worker'
                        }
                    },

                    {
                        $unwind: {
                            path: '$worker',
                            preserveNullAndEmptyArrays: true,
                        }
                    },

                    {
                        $project: {
                            farm_id: 1,
                            worker_id: 1,
                            calculated_at: 1,
                            month: 1,
                            year: 1,
                            working_days: 1,
                            net_salary: 1,
                            status: 1,
                            "worker.name": 1,
                            "worker.avatar": 1,
                            "worker.CIN": 1,
                            "worker.contract_type": 1,
                        }
                    },

                ],

                total: [
                    {
                        $count: 'total'
                    }
                ]

            }
        }
    ]);

    const total = result.total[0]?.total || 0;

    return {
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        records: result.records
    }

}