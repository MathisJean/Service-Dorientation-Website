
//----Variables----//

//Values of input fields when editing
let values = [];
let edited_values = [];

//----Script---//
//----Functions---//

function upload_img(event, input_file, profil)
{
    let img = input_file.files[0]
    let url = URL.createObjectURL(img);
    
    let profil_id = profil.querySelector(".id").textContent
    
    let reader = new FileReader();

    reader.onload = function ()
    {
        let base64img = reader.result;

        //Create object with the new img
        let obj = JSON.stringify({orienters:
            [{
                id: profil_id,
                name: "",
                position: "",
                email: "",
                image: base64img,
            }]
        });

        PUT("/orienter", obj)
        .then(data => 
        {
            let drop_area = profil.querySelector(".drop_area");
    
            drop_area.style.backgroundImage = "url(" + url + ")"
        })
        .catch(err => 
        {
            show_popup(".error_popup", "Impossible de changer l'enregistrement de l'orienteur")
        });
    }

    reader.readAsDataURL(img); //Convert img to Base 64
}

function clear_img(id)
{
    //If create object with the empty values
    obj = JSON.stringify({orienters:
        [{
            id: id,
            name: "",
            position: "",
            email: "",
            image: "/clear/",
        }]
    });

    //Request to delete orienter from json database based on specified id
    PUT("/orienter", obj)
    .then(data => 
    {
        //When HTTP request is succesful, clear background
        let profil = document.getElementById("profil_" + String(id));

        profil.querySelector(".drop_area").style.backgroundImage = ""
    })
    .catch(err => 
    {
        show_popup(".error_popup", "Impossible de changer l'enregistrement de l'orienteur")
    });
}

function update_orienters()
{
    GET("/orienter")
    .then(encrypted_data => 
    {
        decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
        .then(orienters => 
        {
            const orientation_container = document.querySelector(".orienters_orientation");
            const vie_carriere_container = document.querySelector(".orienters_vie_carriere");

            if(orienters.length == 0)
            {
                let orientation_sibling = document.createElement("div");
                let vie_carriere_sibling = document.createElement("div");

                orientation_container.append(orientation_sibling)
                vie_carriere_container.append(vie_carriere_sibling)

                add_orienter(orientation_sibling);
                add_orienter(vie_carriere_sibling);

            };

            orienters.forEach(orienter =>
            {
                const profil = initialize_orienter(orienter)

                if(orienter.position.includes("orientation"))
                {                
                    orientation_container.appendChild(profil);
                }
                else
                {                
                    vie_carriere_container.appendChild(profil);
                };

                let input_file = profil.querySelector(".input_file")
                let drop_area = profil.querySelector(".drop_area")

                input_file.addEventListener("change", event => 
                {
                    upload_img(event, event.target, profil)
                });        
                
                //Drag and drop functionality
                drop_area.addEventListener("dragover", event => 
                {
                    event.preventDefault();

                    event.dataTransfer.dropEffect = "copy"; //Change effect to "copy"
                });

                drop_area.addEventListener("drop", event => 
                {
                    event.preventDefault();

                    event.target.files = event.dataTransfer.files;

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
            throw new Error("Decryption failed: " + err.message);
        })
    })
    .catch(err => 
    {
        show_popup(".error_popup", "Impossible de récupérer les enregistrements des orienteurs")
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

    POST("/orienter", obj)
    .then(encrypted_data => 
    {
        decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
        .then(orienters => 
        {
            let index = orienters.length - 1;

            let profil = initialize_orienter(orienters[index]);

            sibling.after(profil);
        })
        .catch(err =>
        {
            throw new Error("Decryption failed: " + err.message);
        })
    })
    .catch(err => 
    {
        show_popup(".error_popup", "Impossible d'ajouter un enregistrement d'orienteur")
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
                image: "",
            }]
        });
    
        //Send a request to edit the data
        PUT("/orienter", obj)
        .then(data => 
        {
            //Succesful request
        })
        .catch(err => 
        {
            show_popup(".error_popup", "Impossible de changer l'enregistrement de l'orienteur")
        });
    };
};

async function delete_orienter(id)
{
    const confirmed = await confirm_popup();

    if(!confirmed) return

    //Request to delete orienter from json database based on specified id
    DELETE(`/orienter/${id}`, null)
    .then(data => 
    {
        //When HTTP request is succesful, delete
        document.getElementById("profil_" + String(id)).remove();
    })
    .catch(err => 
    {
        show_popup(".error_popup", "Impossible de supprimer l'enregistrement de l'orienteur")
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
    let img_link = orienter.image.trim() === "" ? "" : URL.createObjectURL(base64ToImg(orienter.image));

    new_profil.id = "profil_" + String(orienter.id);

    new_profil.innerHTML =
    `
        <label for="input_file_${orienter.id}" class="drop_area" style="background-image: url('${img_link}');">
            <input type="file" id="input_file_${orienter.id}" class="input_file admin_input" accept="image/*" hidden>

            <div id="img_view" class="admin">
                <img src="/icons/add_img.svg" class="no_select svg" draggable="false"></img>
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
                <img src="/icons/add.svg" class="no_select svg" draggable="false"></img>
            </label>

            <input type="checkbox" id="edit_checkbox_${orienter.id}" onchange="edit_orienter(this, this.parentNode.parentNode)" style="display: none;">

            <label for="edit_checkbox_${orienter.id}" class="admin icon">
                <img src="/icons/edit.svg" class="unactive_checkbox no_select svg" draggable="false"></img>
                <img src="/icons/save.svg" class="active_checkbox no_select svg" draggable="false"></img>
            </label>

            <input type="button" id="delete_button_${orienter.id}" onclick="delete_orienter(${orienter.id})" style="display: none;">

            <label for="delete_button_${orienter.id}" class="admin icon">
                <img src="/icons/delete.svg" class="no_select svg" draggable="false"></img>
            </label>

            <input type="button" id="clear_button_${orienter.id}" onclick="clear_img(${orienter.id})" style="display: none;">

            <label for="clear_button_${orienter.id}" class="add_button admin icon">
                <img src="/icons/remove_img.svg" class="no_select svg" draggable="false"></img>
            </label>
        </div>
    `;

    return new_profil;
}

//No clue how this works... but it does, thank you stack overflow
function base64ToImg(base64String)
{
    let arr = base64String.split(",");
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]); //Decode the Base64 string into binary
    let n = bstr.length;
    let u8arr = new Uint8Array(n);

    //Convert Base64 string to byte array
    while (n--) 
    {
        u8arr[n] = bstr.charCodeAt(n);
    };
    
    //Create a Blob object from the byte array and MIME type
    return new Blob([u8arr], {type: mime});
}