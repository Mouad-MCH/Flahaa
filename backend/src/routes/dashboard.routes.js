import express from 'express';

import { authGuard } from '../middlewares/auth.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';
import { getDashboardController } from '../controllers/dashboard.controller.js';


const router = express.Router();


router.use(authGuard);
router.use(resolveAdminFarm);


/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get the role-specific dashboard summary
 *     description: >
 *       Returns a summary for the authenticated user's role: admin, supervisor, or worker.
 *       Admin attendance/task/payroll figures are for today and the current month; worker
 *       attendance and payroll are for the current month; recent tasks are the latest 5.
 *       The response shape depends on the caller's role — see the examples below.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *           example: 664f1c2e5b3c2a0012a3b100
 *         description: >
 *           Required only for admin users, to select which of their farms to summarize.
 *           Must belong to the authenticated admin. Not used for supervisor or worker,
 *           whose farm is resolved from their own account.
 *     responses:
 *       200:
 *         description: Dashboard summary for the authenticated user's role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Shape varies by role. See the examples for admin, supervisor, and worker.
 *             examples:
 *               admin:
 *                 summary: Admin dashboard
 *                 value:
 *                   status: true
 *                   data:
 *                     role: admin
 *                     period:
 *                       month: 9
 *                       year: 2026
 *                     summary:
 *                       total_workers: 42
 *                       active_workers: 39
 *                       supervisors: 4
 *                       today_present: 30
 *                       today_absent: 5
 *                       today_excused: 2
 *                       attendance_not_recorded: 2
 *                       tasks_pending: 6
 *                       tasks_in_progress: 3
 *                       tasks_done: 12
 *                       payroll_pending: 8
 *                       payroll_paid: 31
 *                       payroll_total: 48500
 *                     attendance:
 *                       present: 30
 *                       absent: 5
 *                       excused: 2
 *                       not_recorded: 2
 *                     payroll:
 *                       pending_count: 8
 *                       paid_count: 31
 *                       total_net_salary: 48500
 *                     recent_tasks:
 *                       - _id: 664f1c2e5b3c2a0012a3b333
 *                         farm_id: 664f1c2e5b3c2a0012a3b100
 *                         assigned_by: 664f1c2e5b3c2a0012a3b456
 *                         title: Irrigate north field
 *                         description: Run drip irrigation for 2 hours
 *                         date: '2026-09-14T00:00:00.000Z'
 *                         status: pending
 *                         assignments:
 *                           - _id: 664f1c2e5b3c2a0012a3b222
 *                             worker_id:
 *                               _id: 664f1c2e5b3c2a0012a3b789
 *                               name: Ahmed Bennani
 *                               avatar: /uploads/avatar-123.jpg
 *                             status: pending
 *                             rating: null
 *                             note: null
 *                             completed_at: null
 *                         createdAt: '2026-09-13T08:00:00.000Z'
 *                         updatedAt: '2026-09-13T08:00:00.000Z'
 *               supervisor:
 *                 summary: Supervisor dashboard
 *                 value:
 *                   status: true
 *                   data:
 *                     role: supervisor
 *                     summary:
 *                       total_workers: 12
 *                       active_workers: 11
 *                       today_present: 9
 *                       today_absent: 1
 *                       today_excused: 1
 *                       attendance_not_recorded: 0
 *                       tasks_pending: 3
 *                       tasks_in_progress: 2
 *                       tasks_done: 5
 *                     attendance:
 *                       present: 9
 *                       absent: 1
 *                       excused: 1
 *                       not_recorded: 0
 *                     recent_tasks:
 *                       - _id: 664f1c2e5b3c2a0012a3b333
 *                         farm_id: 664f1c2e5b3c2a0012a3b100
 *                         assigned_by: 664f1c2e5b3c2a0012a3b456
 *                         title: Irrigate north field
 *                         description: Run drip irrigation for 2 hours
 *                         date: '2026-09-14T00:00:00.000Z'
 *                         status: pending
 *                         assignments:
 *                           - _id: 664f1c2e5b3c2a0012a3b222
 *                             worker_id:
 *                               _id: 664f1c2e5b3c2a0012a3b789
 *                               name: Ahmed Bennani
 *                               avatar: /uploads/avatar-123.jpg
 *                             status: pending
 *                             rating: null
 *                             note: null
 *                             completed_at: null
 *                         createdAt: '2026-09-13T08:00:00.000Z'
 *                         updatedAt: '2026-09-13T08:00:00.000Z'
 *               worker:
 *                 summary: Worker dashboard
 *                 value:
 *                   status: true
 *                   data:
 *                     role: worker
 *                     period:
 *                       month: 9
 *                       year: 2026
 *                     summary:
 *                       tasks_pending: 2
 *                       tasks_in_progress: 1
 *                       tasks_done: 8
 *                       present_days_this_month: 18
 *                       absent_days_this_month: 1
 *                       excused_days_this_month: 1
 *                     attendance:
 *                       present: 18
 *                       absent: 1
 *                       excused: 1
 *                     current_payroll:
 *                       month: 9
 *                       year: 2026
 *                       working_days: 18
 *                       daily_rate: 150
 *                       base_salary: 2700
 *                       bonuses: 0
 *                       deductions: 0
 *                       net_salary: 2700
 *                       status: pending
 *                       paid_at: null
 *                     recent_tasks:
 *                       - _id: 664f1c2e5b3c2a0012a3b333
 *                         farm_id: 664f1c2e5b3c2a0012a3b100
 *                         assigned_by: 664f1c2e5b3c2a0012a3b456
 *                         title: Irrigate north field
 *                         description: Run drip irrigation for 2 hours
 *                         date: '2026-09-14T00:00:00.000Z'
 *                         status: pending
 *                         assignments:
 *                           - _id: 664f1c2e5b3c2a0012a3b222
 *                             worker_id:
 *                               _id: 664f1c2e5b3c2a0012a3b789
 *                               name: Ahmed Bennani
 *                               avatar: /uploads/avatar-123.jpg
 *                             status: pending
 *                             rating: null
 *                             note: null
 *                             completed_at: null
 *                         createdAt: '2026-09-13T08:00:00.000Z'
 *                         updatedAt: '2026-09-13T08:00:00.000Z'
 *       400:
 *         description: Admin request is missing the required farm_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               statusCode: 400
 *               message: farm_id query parameter is required for admin requests
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Admin selected a farm they do not own, or the worker account is not linked to a worker record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               farmNotOwned:
 *                 summary: Admin does not own the selected farm
 *                 value:
 *                   status: error
 *                   statusCode: 403
 *                   message: Farm not found or not yours
 *               workerNotLinked:
 *                 summary: Worker account has no linked worker record
 *                 value:
 *                   status: error
 *                   statusCode: 403
 *                   message: This account is not linked to a worker record
 */
router.get('/', getDashboardController);


export default router;