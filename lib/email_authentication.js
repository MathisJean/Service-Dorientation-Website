
//Set up libraries
const nodemailer = require("nodemailer");

//----Email Authentication----//

async function email_authentication(recipient, sender, authentication_code)
{
    //Email body
    const html = 
    `
        <p>Bonjour ${recipient.name}!</p>
        <p>Ton code de vérification est: ${authentication_code}</p>
    `;

    const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth: 
        {
            user: sender.email,
            pass: "wmcw jeso nuhc xmlx", // TODO: Encrypt in future
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
