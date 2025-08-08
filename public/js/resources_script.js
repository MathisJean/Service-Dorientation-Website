
services()

function services()
{
    radio_vie_carriere = document.querySelector("#vie_carriere")

    container_academique = document.querySelector(".academique_container");
    container_vie_carriere = document.querySelector(".vie_carriere_container");

    if(radio_vie_carriere.checked)
    {
        container_academique.style.display = "none";
        container_vie_carriere.style.display = "flex";
    }
    else
    {
        container_academique.style.display = "flex";
        container_vie_carriere.style.display = "none";
    }
}

//Admin feature to edit link data
function edit_link(checkbox, parent, event)
{
    inputs = Array.from(parent.querySelectorAll(".input_scroll"));
    links = Array.from(parent.querySelectorAll(".input_link"));

    //Edit mode
    if(checkbox.checked)
    {
        //Reset value
        values = {name: "", url: ""};

        inputs.forEach(input =>
        {
            input.style.display = "block"

            values.url = input.value; //Store initial values
        });
        links.forEach(link =>
        {
            link.style.display = "none"

            values.name = link.value; //Store initial values
        });
    }
    else
    {
        //Reset value
        edited_values = {name: "", url: ""};

        inputs.forEach(input =>
        {
            input.style.display = "none"   
            input.setAttribute("title", input.value);
            
            edited_values.url = input.value; //Store edited values
        });
        links.forEach(link =>
        {
            link.style.display = "block"

            edited_values.name = link.value; //Store edited values
        });
    }

    //If values have changed
    if(JSON.stringify(values) !== JSON.stringify(edited_values) && !checkbox.checked)
    {
        let id = parent.id.split("_")[1]; //Get id from parent element

        let data = 
        {
            id: id,
            name: edited_values.name,
            url: edited_values.url
        };

        try
        {
            PUT(`/resources/link`, JSON.stringify(data));
        }
        catch(err)
        {
            show_popup(".error_popup", "Impossible de changer l'enregistrement de l'exposant");
        };
    };
};

//----Variables----//

const scholarship_container = document.querySelector(".recherche > .list");
const resources_container = document.querySelector(".websites > .list");

//Values of input fields when editing
let values = [];
let edited_values = [];

//----Script----//

window.key_exchange_complete.then(() => //Wait for public keys to be exchanged
{
    update_records();
})

//----Functions----//

//Gets records and adds them to DOM
async function update_records()
{
    try
    {
        encrypted_data = await GET("/resources/record");

        records = await decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode);

        //If JSON file is empty
        if(records.length == 0)
        {            
            add_record("scholarship");
            add_record("resource");
        };

        records.forEach(record => 
        {
            const new_record = initialize_record(record);

            if(record.type == "scholarship")
            {
                scholarship_container.appendChild(new_record);
            }
            else
            {
                resources_container.appendChild(new_record);
            };
        });

        admin(scholarship_container);
        admin(resources_container);
    }
    catch(err)
    {
        show_popup(".error_popup", "Impossible de récupérer les enregistrements d'exposants");
    };
};

//Adds a new record to the DOM
async function add_record(type)
{
    try
    {
        //Create a new obj
        let obj = JSON.stringify(
        {
            records:
            [
                {
                    id: -1,
                    name: "Name",
                    link: "#",
                    type: String(type)
                }
            ]
        });

        encrypted_data = await POST("/resources/record", obj); //Get data from serverside

        record = await decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode); //Decrypt data

        const new_record = initialize_record(record);

        //Adds to proper dropdown
        if(record.type == "scholarship")
        {
            scholarship_container.appendChild(new_record);
        }
        else
        {
            resources_container.appendChild(new_record);
        };

        let parent = record.type == "scholarship" ? "recherche" : "websites";

        const container = document.querySelector(`.${parent} .list`);

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

//Changes a current records data in the DOM
async function edit_record(checkbox, list)
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

    Array.from(list.querySelectorAll(".record")).forEach(record =>
    {
        //Editable elements
        h6 = record.querySelector("h6")

        a = record.querySelector("a")
        input = record.querySelector("input")

        let parent = h6.parentNode.parentNode.parentNode;
        let type = parent.classList.contains("recherche") ? "scholarship" : "resource";

        if(checkbox.checked) //Edit mode
        {
            h6.contentEditable = true

            a.style.display = "none"
            input.style.display = "block"

            values.push(
            {
                id: parseInt(record.id.split("_")[1]),
                name: h6.textContent,
                link: input.value,
                type: type
            });
        }
        else //Save mode
        {
            h6.contentEditable = false

            a.style.display = "block"
            input.style.display = "none"

            edited_values.push(
            {
                id: parseInt(record.id.split("_")[1]),
                name: h6.textContent,
                link: input.value,
                type: type
            });
        }
    });

    if(JSON.stringify(values) !== JSON.stringify(edited_values) && !checkbox.checked)
    {
        let data = [];

        for(let i = 0; i < edited_values.length; i++) //Loop through records
        {
            //If there is a change in values
            if(JSON.stringify(values[i]) !== JSON.stringify(edited_values[i]))
            {
                data.push(edited_values[i]);
            };
        };

        try
        {
            await PUT("/resources/record", JSON.stringify({records: data}));
        }
        catch(err)
        {
            show_popup(".error_popup", "Impossible de changer l'enregistrement de l'exposant")
        };
    };
}

//Deletes an record from the DOM
async function delete_record(id)
{
    const confirmed = await confirm_popup();

    if(!confirmed) return

    try
    {
        await DELETE(`/resources/record/${id}`, null);

        document.getElementById("record_" + String(id)).remove(); //Delete from DOM
    }
    catch(err)
    {
        show_popup(".error_popup", "Impossible de supprimer l'enregistrement de l'exposant")
    };
};

//Creates a element based on an obj
function initialize_record(record)
{
    let new_element = document.createElement("div");

    new_element.id = "record_" + String(record.id);
    new_element.classList.add("record");

    new_element.innerHTML =
    `
        <h6>${record.name}</h6>
        <a href="${record.url}" target="_blank">Plus d'information</a>
        <input type="text" value="${record.url}" style="display: none;">

        <input type="button" id="delete_button_${record.id}" onclick="delete_record(${record.id})" style="display: none;">

        <label for="delete_button_${record.id}" class="admin icon delete_button">
            <img src="/icons/delete.svg" class="no_select svg" draggable="false"></img>
        </label>
    `;
    
    return new_element;
}; 