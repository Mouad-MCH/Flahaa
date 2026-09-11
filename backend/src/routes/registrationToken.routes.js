import express from 'express';
import { authGuard, roleGuard } from '../middlewares/auth.js';
import { resolveAdminFarm } from '../middlewares/resolveAdminFarm.js';
import { createRegistrationTokenController, getRegistrationTokenInfoController } from '../controllers/registrationToken.controller.js';
import { validateBody, validateQuery } from '../middlewares/validation.js';
import { getRegistrationTokenInfoSchema, registrationTokenSchema } from '../validators/registrationTokenValidator.js';



const router = express.Router();

/**
 * @openapi
 * /registration-tokens/validate:
 *   get:
 *     tags: [RegistrationTokens]
 *     summary: Validate an invitation token
 *     description: >
 *       Returns invitation details for the registration form without consuming the token.
 *       No authentication or farm_id is required. Pass the raw token from the invitation link.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Raw registration token from the invitation URL (not its SHA-256 hash).
 *         schema:
 *           type: string
 *           minLength: 1
 *     responses:
 *       200:
 *         description: Invitation is valid and has remaining uses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, data]
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   required: [name, email, role, farm_name, expiresAt]
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Invited supervisor name or the linked worker's current name.
 *                       example: Karim Alaoui
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: karim@example.com
 *                     role:
 *                       type: string
 *                       enum: [supervisor, worker]
 *                       example: supervisor
 *                     farm_name:
 *                       type: string
 *                       example: Green Farm
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: '2026-09-11T12:00:00.000Z'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Registration token has expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invalid registration token, or the associated farm or worker was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Registration token has already been used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/validate', validateQuery(getRegistrationTokenInfoSchema), getRegistrationTokenInfoController)

router.use(authGuard);
router.use(roleGuard('admin', 'supervisor'));
router.use(resolveAdminFarm);

/**
 * @openapi
 * /registration-tokens:
 *   post:
 *     tags: [RegistrationTokens]
 *     summary: Create a registration token
 *     description: >
 *       Generates a single-use registration token (valid 24h) that lets an invitee create their account.
 *       Admins may create tokens for supervisors or workers within a farm they own; supervisors may only
 *       create worker tokens for their own farm. farm_id must be passed as a query parameter for admins.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: farm_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifies the target farm. Required for admin requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [role]
 *                 properties:
 *                   role:
 *                     type: string
 *                     enum: [supervisor]
 *               - type: object
 *                 required: [role, worker_id]
 *                 properties:
 *                   role:
 *                     type: string
 *                     enum: [worker]
 *                   worker_id:
 *                     type: string
 *                     example: 664f1c2e5b3c2a0012a3b789
 *     responses:
 *       201:
 *         description: Registration token created
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
 *                     token:
 *                       type: string
 *                       description: Raw registration token; shown only once, share it with the invitee
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/', validateBody(registrationTokenSchema), createRegistrationTokenController);



export default router;
