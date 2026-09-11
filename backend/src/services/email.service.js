import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: ENV.MAILTRAP_HOST,
    port: ENV.MAILTRAP_PORT,
    secure: false,
    auth: {
        user: ENV.MAILTRAP_USER,
        pass: ENV.MAILTRAP_PASS,
    },
});

export const sendInvitationEmail = async ({
    email,
    name,
    farmName,
    role,
    invitationUrl,
}) => {

    const info = await transporter.sendMail({
        from: '"Flahaa" <noreply@flahaa.local>',
        to: email,
        subject: `Invitation to join ${farmName} on Flahaa`,

        html: `
            <h2>Welcome to Flahaa 🌱</h2>

            <p>Hello ${name},</p>

            <p>
                You have been invited to join
                <strong>${farmName}</strong>
                as a <strong>${role}</strong>.
            </p>

            <p>
                Click the link below to create your account:
            </p>

            <a href="${invitationUrl}">
                Create my account
            </a>

            <p>
                This invitation expires in 24 hours.
            </p>
        `,
    });

    return info;
};