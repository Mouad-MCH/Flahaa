import express from 'express';
import { authGuard, roleGuard } from '../middlewares/auth.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';
import { 
  addAssigneesController, 
  createTaskController, 
  deleteTaskController, 
  getMyTasksController, 
  getTasksByWorkerController, 
  getTasksController, 
  rateAssignmentController, 
  removeAssigneeController, 
  updateAssignmentStatusController, 
  updateMyTaskStatusController 
} from '../controllers/task.controller.js';

import { validateBody, validateParams, validateQuery } from '../middlewares/validation.js';

import { 
  addAssigneesParamsSchema, 
  addAssigneesSchema, 
  createTaskSchema, 
  deleteTaskParamsSchema, 
  getMyTasksQuerySchema, 
  getTasksByWorkerParamsSchema, 
  getTasksByWorkerQuerySchema, 
  getTasksQuerySchema, 
  rateAssignmentParamsSchema, 
  rateAssignmentSchema, 
  removeAssigneeParamSchema, 
  updateAssignmentStatusParamsSchema, 
  updateAssignmentStatusSchema 
} from '../validators/taskValidator.js';


const router = express.Router();

router.use(authGuard)

/**
 * @openapi
 * /tasks/me:
 *   get:
 *     tags: [Tasks]
 *     summary: Get the logged-in worker's tasks
 *     description: Returns tasks the authenticated worker is assigned to, with their own assignment attached as `my_assignment`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-08-25'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, done]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 50
 *     responses:
 *       200:
 *         description: The worker's tasks
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
 *                     $ref: '#/components/schemas/MyTask'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/me", roleGuard('worker'), validateQuery(getMyTasksQuerySchema), getMyTasksController);

/**
 * @openapi
 * /tasks/me/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update the logged-in worker's status on a task
 *     description: Lets a worker update their own assignment status on a task they are assigned to. Setting status to 'done' stamps completed_at; any other status clears it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskStatusInput'
 *     responses:
 *       200:
 *         description: Updated task with the worker's assignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MyTask'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not allowed, or this account is not linked to a worker record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found for this worker
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/me/:id/status", roleGuard('worker'), updateMyTaskStatusController)


router.use(roleGuard('admin', 'supervisor'))
router.use(resolveAdminFarm)

/**
 * @openapi
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task and assign it to one or more workers
 *     description: Creates a task on the caller's farm and assigns it to the given workers. Supervisors may only assign workers they supervise (or unsupervised workers); admins can assign any worker on the farm.
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
 *             $ref: '#/components/schemas/TaskInput'
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: One or more workers are not supervised by the caller
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 unauthorized_worker_ids:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: One or more workers were not found on this farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks for a farm
 *     description: Returns tasks on the caller's farm, optionally filtered by worker, status, and date.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: worker_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-08-25'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, done]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 50
 *     responses:
 *       200:
 *         description: Matching tasks
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
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/')
  .post(validateBody(createTaskSchema), createTaskController)
  .get(validateQuery(getTasksQuerySchema), getTasksController);

/**
 * @openapi
 * /tasks/worker/{worker_id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a specific worker's tasks for a month
 *     description: Returns tasks assigned to a given worker on the caller's farm, filtered by year/month and status, each with that worker's assignment attached as `my_assignment`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: worker_id
 *         required: true
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
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, done]
 *     responses:
 *       200:
 *         description: The worker's tasks for the given month
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
 *                     $ref: '#/components/schemas/MyTask'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/worker/:worker_id',
  validateQuery(getTasksByWorkerQuerySchema),
  validateParams(getTasksByWorkerParamsSchema),
  getTasksByWorkerController
)

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     description: Deletes a task on the caller's farm. Admin/supervisor only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *     responses:
 *       200:
 *         description: Task deleted
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
 *                   example: Task deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', validateParams(deleteTaskParamsSchema), deleteTaskController);


/**
 * @openapi
 * /tasks/{id}/assignments:
 *   post:
 *     tags: [Tasks]
 *     summary: Add assignees to a task
 *     description: Assigns one or more additional workers to an existing task. Supervisors may only assign workers they supervise (or unsupervised workers); admins can assign any worker on the farm.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task id
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
 *             $ref: '#/components/schemas/AddAssigneesInput'
 *     responses:
 *       201:
 *         description: Task with the new assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/assignments',
  validateParams(addAssigneesParamsSchema),
  validateBody(addAssigneesSchema),
  addAssigneesController
);

/**
 * @openapi
 * /tasks/{id}/assignments/{worker_id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Remove an assignee from a task
 *     description: Removes a worker's assignment from a task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task id
 *         schema:
 *           type: string
 *       - in: path
 *         name: worker_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *     responses:
 *       200:
 *         description: Task with the assignment removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id/assignments/:worker_id',
  validateParams(removeAssigneeParamSchema),
  removeAssigneeController
);

/**
 * @openapi
 * /tasks/{id}/assignments/{worker_id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a worker's assignment status on a task
 *     description: Lets an admin/supervisor update a specific worker's assignment status on a task. Setting status to 'done' stamps completed_at; any other status clears it. The task's overall status is recomputed from all assignments.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task id
 *         schema:
 *           type: string
 *       - in: path
 *         name: worker_id
 *         required: true
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
 *             $ref: '#/components/schemas/UpdateTaskStatusInput'
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/assignments/:worker_id/status',
   validateParams(updateAssignmentStatusParamsSchema),
   validateBody(updateAssignmentStatusSchema),
   updateAssignmentStatusController
  );

/**
 * @openapi
 * /tasks/{id}/assignments/{worker_id}/rating:
 *   patch:
 *     tags: [Tasks]
 *     summary: Rate a worker's assignment on a task
 *     description: Lets an admin/supervisor set a rating (and optional note) for a worker's assignment on a task.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task id
 *         schema:
 *           type: string
 *       - in: path
 *         name: worker_id
 *         required: true
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
 *             $ref: '#/components/schemas/RateAssignmentInput'
 *     responses:
 *       200:
 *         description: Updated task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/assignments/:worker_id/rating',
  validateParams(rateAssignmentParamsSchema),
  validateBody(rateAssignmentSchema),
  rateAssignmentController
);



export default router