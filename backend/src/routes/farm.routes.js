import express from "express";
import { authGuard, roleGuard } from "../middlewares/auth.js";
import { createFarmController, getMyFarmsController } from "../controllers/farm.controller.js";
import { createFarmSchema } from "../validators/farmValidator.js";
import { validateBody } from "../middlewares/validation.js";

const router = express.Router();

router.use(authGuard);
router.use(roleGuard('admin'));

/**
 * @openapi
 * /farms:
 *   post:
 *     tags: [Farms]
 *     summary: Create a farm
 *     description: Creates a new farm owned by the authenticated admin.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FarmInput'
 *     responses:
 *       201:
 *         description: Farm created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Farm'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', validateBody(createFarmSchema), createFarmController);

/**
 * @openapi
 * /farms/my-farms:
 *   get:
 *     tags: [Farms]
 *     summary: List the authenticated admin's farms
 *     description: Returns all farms owned by the authenticated admin.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The admin's farms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Farm'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: No farms found for the logged-in admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/my-farms', getMyFarmsController);



export default router;