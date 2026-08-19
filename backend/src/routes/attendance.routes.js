import express from 'express';
import { authGuard, roleGuard } from '../middlewares/auth.js';
import { bulkCreateAttendanceController, createAttendanceController, getAttendanceByDateController, getMonthlySummaryController, getWorkerAttendanceController } from '../controllers/attendance.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.js';
import { bulkAttendanceSchema, createAttendanceSchema, getAttendanceByDateQuerySchema, getMonthlySummaryQuerySchema, getWorkerAttendanceParamsSchema, getWorkerAttendanceQuerySchema } from '../validators/attendanceValidator.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';


const router = express.Router();

router.use(authGuard);
router.use(roleGuard('admin', 'supervisor'))
router.use(resolveAdminFarm)


/**
 * @openapi
 * /attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Record attendance for a single worker
 *     description: Creates one attendance record for a worker on a given date. Admins must pass farm_id as a query parameter; supervisors are scoped to their own farm automatically.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceInput'
 *     responses:
 *       201:
 *         description: Attendance recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Validation error, or attendance already recorded for this worker on this date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Worker not found on this farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance for a given date
 *     description: Returns all attendance records for a farm on a given date, plus the list of active workers with no record yet for that date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: '2026-08-18'
 *     responses:
 *       200:
 *         description: Attendance for the given date
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
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     total_recorded:
 *                       type: integer
 *                     total_unrecorded:
 *                       type: integer
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *                     unrecorded_workers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Worker'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validateBody(createAttendanceSchema), createAttendanceController);

/**
 * @openapi
 * /attendance/bulk:
 *   post:
 *     tags: [Attendance]
 *     summary: Record attendance for multiple workers at once
 *     description: Upserts attendance for a list of workers on a given date. Records for workers not found on the farm are reported in the errors array instead of failing the whole request.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkAttendanceInput'
 *     responses:
 *       201:
 *         description: Bulk attendance processed
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
 *                   properties:
 *                     recorded:
 *                       type: integer
 *                       example: 4
 *                     failed:
 *                       type: integer
 *                       example: 1
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           worker_id:
 *                             type: string
 *                           message:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/bulk', validateBody(bulkAttendanceSchema), bulkCreateAttendanceController);

/**
 * @openapi
 * /attendance/summary:
 *   get:
 *     tags: [Attendance]
 *     summary: Get monthly attendance summary
 *     description: Returns present/absent/excused totals bucketed by month for the trailing N months (max 12).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *     responses:
 *       200:
 *         description: Monthly attendance buckets, oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MonthlyAttendanceSummary'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/summary', validateQuery(getMonthlySummaryQuerySchema), getMonthlySummaryController)

router.get('/', validateQuery(getAttendanceByDateQuerySchema), getAttendanceByDateController)

/**
 * @openapi
 * /attendance/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get a worker's attendance history
 *     description: Returns a worker's attendance records and status summary for a given month/year.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Worker id
 *         schema:
 *           type: string
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *     responses:
 *       200:
 *         description: Worker attendance history
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
 *                   properties:
 *                     worker_id:
 *                       type: string
 *                     total:
 *                       type: integer
 *                     summary:
 *                       type: object
 *                       properties:
 *                         present:
 *                           type: integer
 *                         absent:
 *                           type: integer
 *                         excused:
 *                           type: integer
 *                     records:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Attendance'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/:id', validateParams(getWorkerAttendanceParamsSchema), validateQuery(getWorkerAttendanceQuerySchema), getWorkerAttendanceController)


export default router
