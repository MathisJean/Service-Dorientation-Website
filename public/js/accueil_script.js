
update_orienters();

function update_orienters()
{
    GET("/data")
    .then(data => 
    {
        const orientation_container = document.querySelector(".orienters_orientation");
        const vie_carriere_container = document.querySelector(".vie_carriere_orientation");

        data.orienters.forEach(orienter =>
        {
            let profil = document.createElement("div");

            profil.innerHTML =
            `
                <div class="img_input">
                    <input type="file" accept="image/">
                </div>

                <div>
                    <input type="text" class="orienter_name" value="${orienter.name}" readonly>
                    <input type="text" class="orienter_role" value="${orienter.position}" readonly>
                    <input type="email" value="${orienter.email}" readonly>

                    <div>
                        <input type="checkbox" id="edit_checkbox_${orienter.id}" onchange="edit_orienter(this, this.parentNode.parentNode.parentNode)" style="display: none;">

                        <label for="edit_checkbox_${orienter.id}" class="admin icon">
                            <img src="/icons/edit.svg" class="unactive_checkbox no_select" draggable="false"></img>
                            <img src="/icons/save.svg" class="active_checkbox no_select" draggable="false"></img>
                        </label>

                        <input type="button" id="delete_button_${orienter.id}" onclick="delete_orienter(${orienter.id})" style="display: none;">

                        <label for="delete_button_${orienter.id}" class="admin icon">
                            <img src="/icons/delete.svg" class="no_select" draggable="false"></img>
                        <label>
                    </div>
                </div>
            `;

            if(orienter.position.includes("orientation"))
            {                
                orientation_container.appendChild(profil);
            }
            else if(orienter.position.includes("vie_carriere"))
            {                
                vie_carriere_container.appendChild(profil);
            };
        });

        admin(orientation_container);
        admin(vie_carriere_container);
    })
    .catch(err => 
    {

    });
}