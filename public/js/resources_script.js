
services()

document.querySelector("#websites_expand").checked = true;
document.querySelector("#recherche_expand").checked = true;

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