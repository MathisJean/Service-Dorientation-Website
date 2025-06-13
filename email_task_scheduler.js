
//node email_task_scheduler.js

//Set up libraries
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const lockfile = require('proper-lockfile');

const express = require('express')

const nodemailer = require("nodemailer");
const cron = require("node-cron")

//----Methods----//

//Custom Method to Replace Characters from a list to regular versions
String.prototype.replaceSpecialChar = function()
{
    //Charcters that will be replaced
    const character_array   = ["é", "è", "û"];
    const replacement_array = ["e", "e", "u"];

    let string = this;

    character_array.forEach((character, index) =>
    {
        string = string.toLowerCase().replaceAll(character, replacement_array[index]);
    });

    return string;
};

//----Email Task Scheduling----//

const password = process.env.EMAIL_PASS

let scholarship_path = "database/bourses_data.json" //Path to data file
let account_path = "database/compte_data.json" //Path to account data file

let sender_email;

let is_running = false;

let current_year = new Date().getFullYear();
let months = {
    "septembre": { "m": 8, "y": current_year },
    "octobre": { "m": 9, "y": current_year },
    "novembre": { "m": 10, "y": current_year },
    "decembre": { "m": 11, "y": current_year },
    "janvier": { "m": 0, "y": current_year },
    "fevrier": { "m": 1, "y": current_year },
    "mars": { "m": 2, "y": current_year },
    "avril": { "m": 3, "y": current_year },
    "mai": { "m": 4, "y": current_year },
    "juin": { "m": 5, "y": current_year },
    "juillet": { "m": 6, "y": current_year },
    "aout": { "m": 7, "y": current_year }
};

//Task scheduler
cron.schedule("0 0 * * *", compare_dates);

console.log("Schedule started: " + new Date().getHours() + ":" + new Date().getMinutes())

async function compare_dates()
{
    if(is_running)
    {
        return;
    }

    is_running = true;

    console.log("Running schedule: " + new Date().getHours() + ":" + new Date().getMinutes())

    let current_date = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    current_date.setUTCHours(0, 0, 0, 0); //Set time to midnight

    try
    {
        //Read file
        const scholarship_data = await fs.promises.readFile(scholarship_path);

        //Define data
        let scholarships = await JSON.parse(scholarship_data)?.scholarships;

        //Loop through every scholarship
        for(const scholarship of scholarships)
        {
            let day = Number(scholarship.date.day);
            let month_name = String(scholarship.date.month.replaceSpecialChar());

            let { m, y } = months[month_name]; //Get base month and year

            //Adjust the year for this specific scholarship
            let scholarship_date = new Date(y, m, day);
            scholarship_date.setUTCHours(0, 0, 0, 0);

            if(scholarship_date < current_date) 
            {
                scholarship_date.setFullYear(scholarship_date.getFullYear() + 1);
            };

            function days(a, b)
            {
                return (a - b) / (24 * 60 * 60 * 1000)
            }

            if(days(scholarship_date, current_date) === 30 || days(scholarship_date, current_date) === 14 || days(scholarship_date, current_date) === 1) 
            {
                try
                {
                    //Read file
                    const account_data = await fs.promises.readFile(account_path);

                    //Define data
                    sender_email = await JSON.parse(account_data)?.accounts[0].email;
                }
                catch(err)
                {
                    console.error(err);
                }

                console.log("-Sending emails")

                //Loop through every user
                scholarship.subscribedUsers.forEach(user_email =>
                {
                    //Send Email reminder of scholarship
                    email_reminder({ email: user_email }, { email: sender_email }, scholarship, days(scholarship_date, current_date));
                });
            }
        };
    }
    catch(err)
    {
        console.error(err);
    }
    finally
    {
        is_running = false;
    }
}

async function email_reminder(recipient, sender, scholarship, days)
{
    //Email body
    const html =
    `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 500px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333;">Bonjour,</h2>
                <p style="font-size: 16px; color: #555;">
                    Un rappel pour la bourse : <strong>${scholarship.name}</strong>
                </p>
                <p style="font-size: 16px; color: #d9534f; font-weight: bold;">
                    La date limite de remise est dans ${days} jours.
                </p>
                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                    Ne manque pas cette opportunité !
                </p>
                <p style="font-size: 16px; font-weight: bold; color: #007BFF;">
                    Bonne chance !
                </p>
            </div>
        </div>
    `;


    const transporter = nodemailer.createTransport(
    {
        service: "gmail",
        auth: 
        {
            user: sender.email,
            pass: password,
        },
    });

    /*
    const transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: sender.email,
            pass: "your_password",
        },
    });
    */

    try 
    {
        const info = await transporter.sendMail(
        {
            from: `"Orientation ESN" <${sender.email}>`,
            to: recipient.email,
            subject: "Vérification du E-mail",
            html: html,
        });
    } 
    catch(error) 
    {
        console.error('Error sending email:', error);
    }
};