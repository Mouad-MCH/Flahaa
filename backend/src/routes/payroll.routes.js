import express from "express";
import { authGuard, roleGuard } from '../middlewares/auth.js'
import { resolveAdminFarm } from "../middlewares/resolveAdminFarm.js";
import { calculatePayrollController, getMyPayrollsController, getPayrollByWorkerController, getPayrollsController, updatePayrollStatusController } from "../controllers/payroll.controller.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.js";
import { calculatePayrollSchema, getMyPayrollsQuery, getPayrollByWorkerParamsSchema, getPayrollsQuerySchema, updatePayrollStatusBodySchema, updatePayrollStatusParamsSchema } from "../validators/payrollValidator.js";

const router = express.Router();

router.use(authGuard);

/**
 * @openapi
 * /payrolls/me:
 *   get:
 *     tags: [Payroll]
 *     summary: Get the logged-in worker's payroll records
 *     description: Returns payroll records for the authenticated worker, filtered by month/year, for accounts linked to a worker record.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *     responses:
 *       200:
 *         description: The worker's payroll records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: This account is not linked to a worker record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', validateQuery(getMyPayrollsQuery), getMyPayrollsController)

router.use(roleGuard('admin', 'supervisor'));
router.use(resolveAdminFarm);


/**
 * @openapi
 * /payrolls/calculate:
 *   post:
 *     tags: [Payroll]
 *     summary: Calculate (or recalculate) a worker's payroll for a month
 *     description: Computes base salary from attendance, subtracts advances and deductions, adds bonuses, and upserts the payroll record for that worker/month/year on the caller's farm.
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
 *             $ref: '#/components/schemas/CalculatePayrollInput'
 *     responses:
 *       200:
 *         description: Payroll calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
 */
router.post(
    '/calculate',
    validateBody(calculatePayrollSchema),
    calculatePayrollController
);

/**
 * @openapi
 * /payrolls:
 *   get:
 *     tags: [Payroll]
 *     summary: List payroll records for a farm
 *     description: Returns payroll records on the caller's farm, optionally filtered by worker, status, month, and year.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: worker_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *     responses:
 *       200:
 *         description: Matching payroll records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/',
    validateQuery(getPayrollsQuerySchema),
    getPayrollsController
);

/**
 * @openapi
 * /payrolls/{worker_id}/{month}/{year}:
 *   get:
 *     tags: [Payroll]
 *     summary: Get a specific worker's payroll for a month
 *     description: Returns the payroll record for a given worker/month/year on the caller's farm. Returns 404 if it hasn't been calculated yet.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: worker_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 8
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *     responses:
 *       200:
 *         description: The worker's payroll record for the given month
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Payroll record not found. Calculate first.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    '/:worker_id/:month/:year',
    validateParams(getPayrollByWorkerParamsSchema),
    getPayrollByWorkerController
);

/**
 * @openapi
 * /payrolls/{id}/status:
 *   patch:
 *     tags: [Payroll]
 *     summary: Update a payroll record's status
 *     description: Sets a payroll record's status to paid or pending. Setting it to paid stamps paid_at with the current date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Payroll record id
 *         schema:
 *           type: string
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
 *             $ref: '#/components/schemas/UpdatePayrollStatusInput'
 *     responses:
 *       200:
 *         description: Updated payroll record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
    '/:id/status',
    validateParams(updatePayrollStatusParamsSchema),
    validateBody(updatePayrollStatusBodySchema),
    updatePayrollStatusController
);


export default router;
