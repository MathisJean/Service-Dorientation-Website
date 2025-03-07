
//Set up libraries
const fs = require('fs');
const path = require('path');

const lockfile = require('proper-lockfile');

const express = require('express')

const nodemailer = require("nodemailer");
const cron = require("node-cron")

//----Email Task Scheduling----//

let scholarship_path = "database/bourses_data.json" //Path to data file
let sender_email;

//Task scheduler
cron.schedule("0 0 * * *", test);

async function test()
{
    let current_date = new Date();
    let current_month = current_date.toLocaleString("fr-FR", {month: "long"})

    try
    {
        //Readfile
        const scholarship_data = await fs.promises.readFile(scholarship_path);

        //Define data
        let scholarships = await JSON.parse(scholarship_data)?.scholarships;

        //Loops through every scholarship
        scholarships.forEach(scholarship =>
        {
            let scholarship_date = new Date(scholarship.date)
            let scholarship_month = scholarship_date.toLocaleString("fr-FR", {month: "long"});

            console.log(scholarship_date, scholarship.date)
/*
            if(scholarship_month === current_month)
            {
                //Loops through every user
                scholarship.subscribedUsers.forEach(user_email =>
                {
                    //Send Email reminder of scholarship
                    email_reminder({email: user_email}, {email: sender_email}, scholarship)
                });
            };*/
        });
    }
    catch(err)
    {
        
    };
}

test()

async function email_reminder(recipient, sender, scholarship)
{
    //Email body
    const html = 
    `
        <p>Bonjour!</p>
        <p>Ton code de vérification est: ${scholarship}</p>
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