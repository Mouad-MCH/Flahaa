import express from 'express';
import { authGuard, roleGuard } from '../middlewares/auth.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';
import { createWorkerController, deleteWorkerController, getWorkerController, listWorkersController, updateWorkerController } from '../controllers/worker.controller.js';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.js';
import { createWorkerSchema, listWorkersQuerySchema, QueyCreateWorkerSchema, updateWorkerSchema, workerIdParamSchema } from '../validators/workerValidator.js';
import { uploadAvatar, uploadSingle } from '../middlewares/upload.js';


const router = express.Router();

router.use(authGuard)
router.use(roleGuard('admin', 'supervisor'));
router.use(resolveAdminFarm);

/**
 * @openapi
 * /workers:
 *   post:
 *     tags: [Workers]
 *     summary: Create a worker
 *     description: Creates a worker within a farm. Admins must pass farm_id as a query parameter; supervisors are scoped to their own farm automatically.
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/WorkerFormInput'
 *           encoding:
 *             avatar:
 *               contentType: image/jpeg, image/png, image/webp
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkerInput'
 *     responses:
 *       201:
 *         description: Worker created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   type: object
 *                   properties:
 *                     worker:
 *                       $ref: '#/components/schemas/Worker'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: A worker with this CIN already exists for the farm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags: [Workers]
 *     summary: List workers
 *     description: Lists workers for a farm, with optional filtering and pagination. Admins must pass farm_id; supervisors are scoped to their own farm automatically.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         schema:
 *           type: string
 *         description: Required for admins, identifies the target farm.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     workers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Worker'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route('/')
  .post(uploadSingle, uploadAvatar, validateQuery(QueyCreateWorkerSchema) , validateBody(createWorkerSchema), createWorkerController)
  .get(validateQuery(listWorkersQuerySchema), listWorkersController);

/**
 * @openapi
 * /workers/{id}:
 *   get:
 *     tags: [Workers]
 *     summary: Get a worker by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worker found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     worker:
 *                       $ref: '#/components/schemas/Worker'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Workers]
 *     summary: Update a worker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/WorkerFormInput'
 *           encoding:
 *             avatar:
 *               contentType: image/jpeg, image/png, image/webp
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkerInput'
 *     responses:
 *       200:
 *         description: Worker updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Worker'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Workers]
 *     summary: Delete a worker
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worker deleted
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
 *                   example: Worker deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route('/:id')
  .get(validateParams(workerIdParamSchema), getWorkerController)
  .put(uploadSingle, uploadAvatar, validateParams(workerIdParamSchema), validateBody(updateWorkerSchema), updateWorkerController)
  .delete(validateParams(workerIdParamSchema), deleteWorkerController);


export default router;
