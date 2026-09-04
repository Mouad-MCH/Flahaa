import express from 'express';
import { authGuard, roleGuard } from '../middlewares/auth.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';
import { 
    getSupervisorsController,
    createSupervisorController,
    getSupervisorByIdController,
    deleteSupervisorController,
    updateSupervisorController
} from '../controllers/user.controller.js';
import { createSupervisorSchema, supervisorIdSchema, updateSupervisorSchema } from '../validators/userValidator.js';
import { validateBody, validateParams } from '../middlewares/validation.js';


const router = express.Router();

router.use(authGuard);
router.use(roleGuard('admin'));
router.use(resolveAdminFarm);

/**
 * @openapi
 * /users/supervisors:
 *   get:
 *     tags: [Users]
 *     summary: List supervisors on a farm
 *     description: Returns all supervisors belonging to the farm owned by the authenticated admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the farm (must be owned by the authenticated admin)
 *     responses:
 *       200:
 *         description: List of supervisors
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
 *                     $ref: '#/components/schemas/Supervisor'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/supervisors', getSupervisorsController);

/**
 * @openapi
 * /users/supervisors:
 *   post:
 *     tags: [Users]
 *     summary: Create a supervisor
 *     description: >
 *       Creates a supervisor account on the admin's farm. A temporary password is
 *       auto-generated and returned once in the response (it is not emailed).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the farm (must be owned by the authenticated admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSupervisorInput'
 *     responses:
 *       201:
 *         description: Supervisor created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateSupervisorResponse'
 *       400:
 *         description: Validation error, or a user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/supervisors', validateBody(createSupervisorSchema), createSupervisorController);

/**
 * @openapi
 * /users/supervisors/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a supervisor's details
 *     description: >
 *       Returns the supervisor, aggregated stats (total/active) for the workers they
 *       supervise, and the list of those workers.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supervisor's user ID
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the farm (must be owned by the authenticated admin)
 *     responses:
 *       200:
 *         description: Supervisor details with worker stats and workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SupervisorDetail'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Supervisor not found on this farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/supervisors/:id', validateParams(supervisorIdSchema), getSupervisorByIdController);

/**
 * @openapi
 * /users/supervisors/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate a supervisor
 *     description: >
 *       Soft-deletes a supervisor by setting their status to `inactive`
 *       (the account and its data are not removed).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supervisor's user ID
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the farm (must be owned by the authenticated admin)
 *     responses:
 *       200:
 *         description: Supervisor deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Supervisor deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Supervisor not found on this farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/supervisors/:id', validateParams(supervisorIdSchema), deleteSupervisorController);

/**
 * @openapi
 * /users/supervisors/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a supervisor
 *     description: Updates a supervisor's name, email, phone, and/or status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Supervisor's user ID
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the farm (must be owned by the authenticated admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSupervisorInput'
 *     responses:
 *       200:
 *         description: Supervisor updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Supervisor'
 *       400:
 *         description: Validation error, or a user with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Supervisor not found on this farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/supervisors/:id', validateParams(supervisorIdSchema), validateBody(updateSupervisorSchema), updateSupervisorController);

export default router;