
//Set up libraries
const nodemailer = require("nodemailer");

async function email_authentication(recipient, sender, authentication_code)
{
    console.log(recipient.email, sender.email, authentication_code);

    //Email body
    const html = 
    `
        <h1>Bonjour ${recipient.name}!</h1>
        <p>Ton code de vérification est: ${authentication_code}</p>
    `;

    const transporter = nodemailer.createTransport(
    {
        service: 'gmail',
        auth: 
        {
            user: "orientation.esn.testing@gmail.com",
            pass: 'thmf irbz qsdw iinh', //Encrypt in future
        },
    });

    try 
    {
        const info = await transporter.sendMail(
        {
            from: '"Orientation ESN" <orientation.esn.testing@gmail.com>',
            to: recipient.email,
            subject: 'Vérification du E-mail',
            html: html,
        });

        console.log('Message Sent: ' + info.messageId);
    } 
    catch(error) 
    {
        console.error('Error sending email:', error);
    }
};

//Export function to server file
module.exports = email_authentication;
