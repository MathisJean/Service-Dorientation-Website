
//----Variables----//

//Values of input fields when editing
let values = [];
let edited_values = [];

//----Script---//

update_orienters();

//----Functions---//

function upload_img(event, input_file, profil)
{
    let url = URL.createObjectURL(input_file.files[0]);

    console.log(input_file.files[0])

    PUT("/data", obj)
    .then(data => 
    {
        let drop_area = profil.querySelector(".drop_area");

        drop_area.style.backgroundImage = "url(" + url + ")"
    })
    .catch(err => 
    {
        popup(".error_popup", String(err))
    });
}

function update_orienters()
{
    GET("/data")
    .then(data => 
    {
        const orientation_container = document.querySelector(".orienters_orientation");
        const vie_carriere_container = document.querySelector(".orienters_vie_carriere");

        data.orienters.forEach(orienter =>
        {
            const profil = initialize_orienter(orienter)

            if(orienter.position.includes("orientation"))
            {                
                orientation_container.appendChild(profil);
            }
            else if(orienter.position.includes("vie-carrière"))
            {                
                vie_carriere_container.appendChild(profil);
            };

            input_file = profil.querySelector(".input_file")

            input_file.addEventListener("change", (event) => 
            {
                upload_img(event, event.target, profil)
            });            
        });

        admin(orientation_container);
        admin(vie_carriere_container);

        let radio = document.querySelector("#orientation").checked ? document.querySelector("#orientation") : document.querySelector("#vie_carriere");

        services(radio)
    })
    .catch(err => 
    {
        popup(".error_popup", String(err))
    });
}

function add_orienter(sibling)
{
    let position = sibling.parentNode.classList.contains("orienters_orientation") ? "Conseiller en orientation" : "Collaboratrice vie-carrière";

    //If edited, create object with the new values
    obj = JSON.stringify({orienters:
        [{
            id: -1,
            name: "Nom",
            position: position,
            email: "Courriel",
            image: "",
        }]
    });

    POST("/data", obj)
    .then(data => 
    {
        let index = data.orienters.length - 1; 

        let profil = initialize_orienter(data.orienters[index]);

        sibling.after(profil);
    })
    .catch(err => 
    {
        popup(".error_popup", String(err))
    });
}

function edit_orienter(checkbox, parent)
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
    }
  
    //Get every element with information in scholarship
    Array.from(parent.querySelectorAll(".admin_edit, .id")).forEach(element =>
    {
        //Edit mode
        if(checkbox.checked)
        {        
            //Make elements other then link and criteria editable
            if(Array.from(element.classList).includes("admin_edit"))
            {
            element.contentEditable = true;
    
            values.push(element.textContent);
            }
    
            //Add id to values list
            else if(Array.from(element.classList).includes("id"))
            {
            values.push(element.textContent);
            };
        }
  
        //Save mode
        else
        {
            //Makes elements other then criteria and link none editable
            if(Array.from(element.classList).includes("admin_edit"))
            {
            element.contentEditable = false;
            edited_values.push(element.textContent);
            }
    
            //Add id to edited values list
            else if(Array.from(element.classList).includes("id"))
            {
            edited_values.push(element.textContent);
            };
        };
    });
  
    //Compare values before and after edit
    if(String(values) !== String(edited_values) && !checkbox.checked)
    {
        //If edited, create object with the new values
        obj = JSON.stringify({orienters:
            [{
                id: edited_values[0],
                name: edited_values[1],
                position: edited_values[2],
                email: edited_values[3],
                image: edited_values[4] ? edited_values[4] : "",
            }]
        });
    
        //Send a request to edit the data
        PUT("/data", obj)
        .then(data => {})
        .catch(err => 
        {
            popup(".error_popup", String(err))
        });
    };
};

function delete_orienter(id)
{
    //Request to delete orienter from json database based on specified id
    DELETE("/data", JSON.stringify({id: id}))
    .then(data => 
    {
        //When HTTP request is succesful, delete
        document.getElementById("profil_" + String(id)).remove();
    })
    .catch(err => 
    {
        popup(".error_popup", String(err))
    });
}

function services(radio)
{
    id = radio.id;

    container_orientation = document.querySelector("#orientation_info");
    container_vie_carriere = document.querySelector("#vie_carriere_info");

    if(id == "orientation")
    {
        container_orientation.style.display = "flex";
        container_vie_carriere.style.display = "none";
    }
    else if(id == "vie_carriere")
    {
        container_orientation.style.display = "none";
        container_vie_carriere.style.display = "flex";
    }
}

function initialize_orienter(orienter)
{
    let new_profil = document.createElement("div");

    new_profil.id = "profil_" + String(orienter.id);

    new_profil.innerHTML =
    `
        <label for="input_file_${orienter.id}" class="drop_area" style="background-image: ${orienter.image};">
            <input type="file" id="input_file_${orienter.id}" class="input_file" accept="image/*" hidden>

            <div id="img_view" class="admin">
                <img src="/icons/add_img.svg" class="no_select" draggable="false"></img>
            </div>
        </label>

        <div>
            <div class="id" style="display: none;">${orienter.id}</div>
            <h3 class="orienter_name admin_edit">${orienter.name}</h3>
            <h5 class="orienter_role admin_edit">${orienter.position}</h5>
            <a class="admin_edit" href="mailto:${orienter.email}">${orienter.email}</a>
        </div>

        <div class="admin_btn">
            <input type="button" id="add_button_${orienter.id}" onclick="add_orienter(this.parentNode.parentNode)" style="display: none;">

            <label for="add_button_${orienter.id}" class="add_button admin icon">
                <img src="/icons/add.svg" class="no_select" draggable="false"></img>
            </label>

            <input type="checkbox" id="edit_checkbox_${orienter.id}" onchange="edit_orienter(this, this.parentNode.parentNode)" style="display: none;">

            <label for="edit_checkbox_${orienter.id}" class="admin icon">
                <img src="/icons/edit.svg" class="unactive_checkbox no_select" draggable="false"></img>
                <img src="/icons/save.svg" class="active_checkbox no_select" draggable="false"></img>
            </label>

            <input type="button" id="delete_button_${orienter.id}" onclick="delete_orienter(${orienter.id})" style="display: none;">

            <label for="delete_button_${orienter.id}" class="admin icon">
                <img src="/icons/delete.svg" class="no_select" draggable="false"></img>
            <label>
        </div>
    `;

    return new_profil
}