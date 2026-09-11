import { ENV } from "../config/env.js";
import RegistrationToken from "../models/RegistrationToken.js";
import { sendInvitationEmail } from "../services/email.service.js";
import { createRegistrationTokenService, getRegistrationTokenInfoService } from "../services/registrationToken.service.js"




export const createRegistrationTokenController = async (req, res, next) => {
    let registrationToken;
    try {

        const {
            role,
            worker_id,
            email,
            name
        } = req.body

        const result = await createRegistrationTokenService(req.scopedFarmId, role, req.user, worker_id, email, name);

        registrationToken = result.registrationToken

        const invitationUrl = 
           `${ENV.FRONTEND_URL}/register?token=${result.rawToken}`;


           await sendInvitationEmail({
            email: registrationToken.email,
            name: result.invitationName,
            farmName: result.farm.name,
            role: registrationToken.role,
            invitationUrl,
           })
        
        return res.status(201).json({
            status: true,
            data: {
                message: "Invitation sent successfully",
                expiresAt: registrationToken.expiresAt,
            }
        })

    } catch(error) {
        if(registrationToken) {
            try {
                await RegistrationToken.findByIdAndDelete(
                    registrationToken._id
                )
            }catch(cleanupError) {
                console.error(
                    "Failed to cleanup registration token:",
                    cleanupError
                )
            }
        }
        next(error);
    }
}

export const getRegistrationTokenInfoController = async (
    req,
    res,
    next
) => {
    try {
        const { token } = req.query;
        const invitation =
            await getRegistrationTokenInfoService(token);

        return res.status(200).json({
            status: true,
            data: invitation
        });

    } catch (error) {
        next(error);
    }
};

