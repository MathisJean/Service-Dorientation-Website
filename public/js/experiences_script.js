
//----Variables----//

const salon_emplois_container = document.querySelector(".salon_emploi > .list");
const orient_action_container = document.querySelector(".orient_action > .list");

//Values of input fields when editing
let values = [];
let edited_values = [];

//----Script----//

window.key_exchange_complete.then(() => //Wait for public keys to be exchanged
{
    update_exhibitors();

    //Set checkboxes on start to avoid err
    document.querySelector("#salon_emploi_expand").checked = true;
    document.querySelector("#orient_action_expand").checked = true;

    document.querySelector("#edit_checkbox_salon_emploi").checked = false;
    document.querySelector("#edit_checkbox_orient_action").checked = false;
})

//----Functions----//

//Gets exhibitors and adds them to DOM
async function update_exhibitors()
{
    try
    {
        encrypted_data = await GET("/experiences/exhibitor");

        exhibitors = await decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode);

        //If JSON file is empty
        if(exhibitors.length == 0)
        {            
            add_exhibitor("salon_emploi");
            add_exhibitor("orient_action");
        };

        exhibitors.forEach(exhibitor => 
        {
            const new_exhibitor = initialize_exhibitor(exhibitor);

            if(exhibitor.event == "salon_emploi")
            {
                salon_emplois_container.appendChild(new_exhibitor);
            }
            else
            {
                orient_action_container.appendChild(new_exhibitor);
            };
        });

        admin(salon_emplois_container);
        admin(orient_action_container);
    }
    catch(err)
    {
        show_popup(".error_popup", "Impossible de récupérer les enregistrements d'exposants");
    };
};

//Adds a new exhibitor to the DOM
async function add_exhibitor(event)
{
    try
    {
        //Create a new obj
        let obj = JSON.stringify(
        {
            exhibitors:
            [
                {
                    id: -1,
                    name: "Name",
                    link: "#",
                    event: String(event)
                }
            ]
        });

        encrypted_data = await POST("/experiences/exhibitor", obj); //Get data from serverside

        exhibitor = await decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode); //Decrypt data

        const new_exhibitor = initialize_exhibitor(exhibitor);

        //Adds to proper dropdown
        if(exhibitor.event == "salon_emploi")
        {
            salon_emplois_container.appendChild(new_exhibitor);

        }
        else
        {
            orient_action_container.appendChild(new_exhibitor);
        };

        const container = document.querySelector(`.${exhibitor.event} .list`);

        container.style.maxHeight = "none"; //Temporarily unset

        const scrollHeight = container.scrollHeight; //Set height to max height

        container.style.maxHeight = "0px";
        container.style.opacity = "0";
        container.style.margin = "0 2em";

        //Animate in the next frame
        requestAnimationFrame(() => 
        {
            container.style.maxHeight = scrollHeight + "px";
            container.style.opacity = "1";
            container.style.margin = "2em";
        });   
    }
    catch(err)
    {
        show_popup(".error_popup", "Impossible d'ajouter un enregistrement d'exposant");
    };
};

//Changes a current exhibitors data in the DOM
async function edit_exhibitor(checkbox, list)
{
    //Edit mode
    if(checkbox.checked)
    {
        values = []; //Reset values
            
        document.addEventListener("keydown", change_cell_focus);
    }
    //Save mode
    else
    {
        edited_values = []; //Reset values
            
        document.removeEventListener("keydown", change_cell_focus)
    };

    Array.from(list.querySelectorAll(".exhibitor")).forEach(exhibitor =>
    {
        //Editable elements
        h6 = exhibitor.querySelector("h6")

        a = exhibitor.querySelector("a")
        input = exhibitor.querySelector("input")

        let parent = h6.parentNode.parentNode.parentNode;
        let event = parent.classList.contains("salon_emploi") ? "salon_emploi" : "orient_action";

        if(checkbox.checked) //Edit mode
        {
            h6.contentEditable = true

            a.style.display = "none"
            input.style.display = "block"

            values.push(
            {
                id: parseInt(exhibitor.id.split("_")[1]),
                name: h6.textContent,
                link: input.value,
                event: event
            });
        }
        else //Save mode
        {
            h6.contentEditable = false

            a.style.display = "block"
            input.style.display = "none"

            edited_values.push(
            {
                id: parseInt(exhibitor.id.split("_")[1]),
                name: h6.textContent,
                link: input.value,
                event: event
            });
        }
    });

    if(JSON.stringify(values) !== JSON.stringify(edited_values) && !checkbox.checked)
    {
        let data = [];

        for(let i = 0; i < edited_values.length; i++) //Loop through exhibitors
        {
            //If there is a change in values
            if(JSON.stringify(values[i]) !== JSON.stringify(edited_values[i]))
            {
                data.push(edited_values[i]);
            };
        };

        try
        {
            await PUT("/experiences/exhibitor", JSON.stringify({exhibitors: data}));
        }
        catch(err)
        {
            show_popup(".error_popup", "Impossible de changer l'enregistrement de l'exposant")
        };
    };
}

//Deletes an exhibitor from the DOM
async function delete_exhibitor(id)
{
    const confirmed = await confirm_popup();

    if(!confirmed) return

    try
    {
        await DELETE(`/experiences/exhibitor/${id}`, null);

        document.getElementById("exhibitor_" + String(id)).remove(); //Delete from DOM
    }
    catch(err)
    {
        show_popup(".error_popup", "Impossible de supprimer l'enregistrement de l'exposant")
    };
};

//Creates a element based on an obj
function initialize_exhibitor(exhibitor)
{
    let new_element = document.createElement("div");

    new_element.id = "exhibitor_" + String(exhibitor.id);
    new_element.classList.add("exhibitor");

    new_element.innerHTML =
    `
        <h6>${exhibitor.name}</h6>
        <a href="${exhibitor.link}" target="_blank">Plus d'information</a>
        <input type="text" value="${exhibitor.link}" style="display: none;">

        <input type="button" id="delete_button_${exhibitor.id}" onclick="delete_exhibitor(${exhibitor.id})" style="display: none;">

        <label for="delete_button_${exhibitor.id}" class="admin icon delete_button">
            <img src="/icons/delete.svg" class="no_select svg" draggable="false"></img>
        </label>
    `;
    
    return new_element;
};

function toggle_dropdown(container_class, checkbox_id)
{
    const checkbox = document.getElementById(checkbox_id);
    const container = document.querySelector(`.${container_class} .list`);
    
    if(checkbox.checked)
    {
        container.style.maxHeight = "none"; //Temporarily unset

        const scrollHeight = container.scrollHeight; //Set height to max height

        container.style.maxHeight = "0px";
        container.style.opacity = "0";
        container.style.margin = "0 2em";

        //Animate in the next frame
        requestAnimationFrame(() => 
        {
            container.style.maxHeight = scrollHeight + "px";
            container.style.opacity = "1";
            container.style.margin = "2em";
        });   
    }
    else
    {
        container.style.maxHeight = "0";
        container.style.opacity = "0";
        container.style.margin = "0 2em";
    };
};


  