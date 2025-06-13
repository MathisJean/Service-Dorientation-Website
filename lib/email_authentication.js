
//Set up libraries
require('dotenv').config();

const nodemailer = require("nodemailer");

//Email pass
const password = process.env.EMAIL_PASS

//----Email Authentication----//

async function email_authentication(recipient, sender, authentication_code)
{
    //Email body
    const html = 
    `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 500px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333;">Bonjour ${recipient.name}!</h2>
                <p style="font-size: 16px; color: #555;">
                    Ton code de vérification est :
                </p>
                <div style="font-size: 20px; font-weight: bold; color: #007BFF; padding: 10px; background: #f0f8ff; border-radius: 5px; display: inline-block;">
                    ${authentication_code}
                </div>
                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                    Ce code expirera dans 3 minutes. Si tu n'as pas demandé ce code, ignore simplement cet email.
                </p>
            </div>
        </div>
    `;

/*
    const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth: 
        {
            user: sender.email,
            pass: password,
        },
    });
*/    
    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: 
        {
            user: sender.email,
            pass: "2025.courriel!!",
        },
    });

    try 
    {
        const info = await transporter.sendMail(
        {
            from: `"Orientation ESN" <${sender.email}>`,
            to: recipient.email,
            subject: "Vérification du E-mail",
            html: html,
        });

        console.log("Authentication Email Sent: " + info.messageId);
    } 
    catch(error) 
    {
        console.error('Error sending email:', error);
    }
};

//Export function to server file
module.exports = email_authentication;
