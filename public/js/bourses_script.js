
//----Constants----//

//Main div that contains every scholarship, month_container and month_header
const table = document.getElementById("table");

//"Autres" gets removed from array after initialisation
const months =  ["Autres", "Septembre", "Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août"]; 

//----Variables----//

//Values of input fields when editing
let scholarship_values = {id: 0, name: "", date: {day: null, month: "", time: ""}, criteria: "", value: "", link: "", subscribedUsers: []};
let edited_scholarship_values = {id: 0, name: "", date: {day: null, month: "", time: ""}, criteria: "", value: "", link: "", subscribedUsers: []};

//TODO: Add event listener that sends you back to your scrolling position
//----Script----//

window.key_exchange_complete.then(() => //Wait for public keys to be exchanged
{
    update_table();
})

//----Functions----//

//Adds month headers an containers dynamicly based on "months" array and scholarship data
function update_table() 
{
  //Get data from json database to populate scholarships
  GET("/bourses/scholarship")
  .then(encrypted_data => 
  {
    decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
    .then(scholarships => 
    {
      //Creates month headers and containers
      months.forEach(month =>
      {
        let month_header = document.createElement("div");
        let month_container = document.createElement("div");

        month_header.classList.add("month_header");
        month_header.id = "month_header_" + String(month.replaceSpecialChar());
        month_container.classList.add("month_container");
        month_container.id = "month_container_" + String(month.replaceSpecialChar()) ;
        month_container.style.backgroundColor = "transparent";

        month_header.innerHTML =
        `
          <div>
            <h2>${month}</h2>
          </div>
        `;

        //Adds header and container to table
        table.appendChild(month_header);
        table.appendChild(month_container);
      })

      //Remove autres from array
      months.shift();

      //Sort scholarships by first numbers in date element
      scholarships.sort((a, b) =>
      {
        dayA = Number(a.date.day)
        dayB = Number(b.date.day)

        return dayA - dayB;
      });

      //Sort scholarships by month
      scholarships.forEach(scholarship => 
      {
        let month = scholarship.date.month.replaceSpecialChar(); //Replaces characters from a list with others, method declared in global script

        let container_id;

        for(m = 0; m < 12; m++)
        {
          if(month.replaceSpecialChar() == months[m].replaceSpecialChar())
          {
            container_id = "month_container_" + month;
            break;
          }

          //If there is no month in date element
          else if(m == 11)
          {
            container_id = "month_container_autres";
          };
        };

        let new_scholarship = initiate_scholarship(scholarship)

        //Add scholarships to containers
        document.getElementById(container_id).appendChild(new_scholarship);
        
        let logged_in = JSON.parse(localStorage.getItem("logged_in")) || false;
        let user_email = localStorage.getItem("user_email");

        try 
        {
          user_email = user_email ? JSON.parse(user_email) : undefined;
        } 
        catch(err) 
        {
          user_email = undefined; //If parsing fails, set to undefined
        };

        //Check subscription
        if(logged_in && user_email && scholarship.subscribedUsers.includes(user_email)) 
        {
          document.getElementById("subscribe_checkbox_" + scholarship.id).checked = true;
        };
      });

      //Hide and shows elements based on "is_admin" var
      admin(document);

      //Hides month header and containers without any children
      hide_month_headers();

      load();
    })
    .catch(err =>
    {
        throw new Error("Decryption failed: " + err.message);
    });
  })
  .catch(err => {show_popup(".error_popup", "Impossible de récupérer les enregistrements de bourses") ; console.error(err)});
};

//Admin feature to add scholarship
function add_scholarship(id)
{  
  //Define values upon scholarship initialisation
  obj = JSON.stringify({scholarships:
    [{
      id: -1,
      name: "Nom",
      date: {
        day: 1,
        month: "0",
        time: "00:00"
      },
      criteria: "Critères",
      value: "Valeur",
      link: "#",
      subscribedUsers: []
    }]
  });

  //Adds scholarship to json database
  POST("/bourses/scholarship", obj)
  .then(encrypted_data => 
  {      
    decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
    .then(scholarships => 
    {
      //Adds new scholarship to container
      let scholarship = document.getElementById("scholarship_" + String(id));
      let pos = scholarships.length - 1
      let new_scholarship = initiate_scholarship(scholarships[pos]);

      scholarship.after(new_scholarship);

      new_scholarship.classList.add("scroll_show");

      //Sets the scholarship in edit mode
      checkbox = new_scholarship.querySelector(".edit_checkbox");
      checkbox.checked = true;

      edit_scholarship(checkbox, new_scholarship);

      //Set date appropriatly for the month and previous day
      new_scholarship.querySelector(".scholarship_date div > select").value = scholarship.querySelector(".scholarship_date div > select").value
      new_scholarship.querySelector(".scholarship_date div > input[type='text']").value = scholarship.querySelector(".scholarship_date div > input[type='text']").value

      //Hides user elements
      admin(new_scholarship);
    })
    .catch(err =>
    {
        throw new Error("Decryption failed: " + err.message);
    })
  })
  .catch(err => {show_popup(".error_popup", "Impossible d'ajouter l'enregistrement de la bourse")});
}

//TODO: Capitalise Titles and start of Paragraphs
//Admin feature to edit scholarship data
function edit_scholarship(checkbox, parent, event)
{
  //Edit mode
  if(checkbox.checked)
  {
    //Reset value
    scholarship_values = {id: 0, name: "", date: {day: null, month: "", time: ""}, criteria: "", value: "", link: "", subscribedUsers: []};

    parent.style.backgroundColor = "rgb(245, 245, 245)";

    document.addEventListener("keydown", change_cell_focus);
  }
  //Save mode
  else
  {
    //Reset value
    edited_scholarship_values = {id: 0, name: "", date: {day: null, month: "", time: ""}, criteria: "", value: "", link: "", subscribedUsers: []};

    parent.style.backgroundColor = "white";

    document.removeEventListener("keydown", change_cell_focus)
  }

  //Get every element with information in scholarship
  Array.from(parent.querySelectorAll("input, a, h6, .date, .admin_edit, .id")).forEach(element =>
  {
    //Edit mode
    if(checkbox.checked)
    {           
      //Hide link or date
      if(element.tagName === "A")
      {
        element.style.display = "none";
      }

      //Show input type="text"
      else if(element.tagName === "INPUT" && element.type === "text")
      {
        element.style.display = "flex";
        scholarship_values.link = element.value;
      }

      //Hide date header
      else if(element.tagName === "H6")
      {
        element.style.display = "none";
      }

      //Make date editable
      else if(Array.from(element.classList).includes("date"))
      {
        element.style.display = "flex";

        let date = {day: "", month: "", time: ""}

        date.day = element.querySelector("input[type='text']") ? element.querySelector("input[type='text']").value : ""
        date.month = element.querySelector("select") ? element.querySelector("select").value : ""
        date.time = element.querySelector("input[type='time']") ? element.querySelector("input[type='time']").value : ""

        scholarship_values.date = date;
      }

      //Make elements other then link and criteria editable
      else if(Array.from(element.classList).includes("admin_edit"))
      {
        element.contentEditable = true;
        element.style.zIndex = "1";

        const key_map = 
        {
          "H4": "name",
          "H5": "value",
          "P": "criteria"
        };
        
        const key = key_map[element.tagName] || null; // Default to null if not found    

        key ? scholarship_values[key] = element.textContent : null; 
      }

      //Add id to values list
      else if(Array.from(element.classList).includes("id"))
      {
        scholarship_values["id"] = Number(element.textContent);
      };
    }

    //Save mode
    else
    {
      //Show link
      if(element.tagName === "A")
      {
        element.style.display = "flex";
        element.href = parent.querySelector('input[type="text"]').value;
      }

      //Hide inputetype="text"
      else if(element.tagName === "INPUT" && element.type === "text")
      {
        element.style.display = "none";
        edited_scholarship_values.link = element.value;
      }

      //Hide date
      else if(element.tagName === "H6")
      {
        element.style.display = "flex";
      }        

      //Make date editable
      else if(Array.from(element.classList).includes("date"))
      {
        element.style.display = "none";

        let date = {day: "", month: "", time: ""}

        date.day = element.querySelector("input[type='text']") ? element.querySelector("input[type='text']").value : ""
        date.month = element.querySelector("select") ? element.querySelector("select").value : ""
        date.time = element.querySelector("input[type='time']") ? element.querySelector("input[type='time']").value : ""

        edited_scholarship_values.date = date;

        parent.querySelector("h6").textContent = `${date.day} ${date.month} ${date.time}`
      }

      //Makes elements none editable
      else if(Array.from(element.classList).includes("admin_edit"))
      {
        element.contentEditable = false;

        const key_map = 
        {
          "H4": "name",
          "H5": "value",
          "P": "criteria"
        };
        
        const key = key_map[element.tagName] || null; // Default to null if not found    

        key ? edited_scholarship_values[key] = element.textContent : null;
      }

      //Add id to edited values list
      else if(Array.from(element.classList).includes("id"))
      {
        edited_scholarship_values["id"] = Number(element.textContent);
      };
    };
  });

  //Compare values before and after edit
  if(JSON.stringify(scholarship_values) !== JSON.stringify(edited_scholarship_values) && !checkbox.checked)
  {
    //If edited, create object with the new values
    obj = JSON.stringify({scholarships:[edited_scholarship_values]});

    //Send a request to edit the data
    PUT("/bourses/scholarship", obj)
    .then(data => 
    {
      let date = edited_scholarship_values["date"];

      let day = Number(date.day);
      let month = String(date.month.replaceSpecialChar());

      //Changes location of scholarship to appropriate month container   
      let container_id;
      let container;

      //Check through months
      for(m = 0; m < 12; m++)
      {
        if(months[m].replaceSpecialChar() === month)
        {
          container_id = "month_container_" + month;
          break;
        }
        //If no month is in date
        else if(m == 11)
        {
          container_id = "month_container_autres";
        };
      };

      //Get the container for the scholarship
      container = document.getElementById(container_id);

      //Get scholarships from the container
      let scholarships = Array.from(container.children);
      scholarships = scholarships.filter(scholarship => 
      {
        return Number(scholarship.id.replace(/scholarship_/g, "")) !== Number(edited_scholarship_values["id"])
      });

      if(scholarships.length == 0)
      {
        container.appendChild(parent)
      }
      else if(scholarships.length > 0) 
      {
        //Loops through every scholarship
        for (let i = 0; i < scholarships.length; i++)
        {
          let comparison_day = scholarships[i].querySelector(".scholarship_date div > input[type='text']").value; //Get day from scholarship date field

          //If the scholarship being inserted has a smaller date then the one after
          if (day < comparison_day)
          {
            scholarships[i].before(parent);
            break;
          }
          //If scholarship has largest date, add at end
          else if (i == scholarships.length - 1)
          {
            scholarships[i].after(parent);
            break;
          };
        };
      }

      //If scholarship is moved to month with no scholarships, show container and header
      hide_month_headers();

      scroll_to("#" + String(parent.id), event);
    })
    .catch(err => {show_popup(".error_popup", "Impossible de changer l'enregistrement de la bourse") ; console.error(err)});
  };
};

//Admin function to delete scholarship
async function delete_scholarship(scholarship_id)
{
  const confirmed = await confirm_popup();

  if(!confirmed) return

  //Request to delete scholarship from json database based on sepcified id
  DELETE(`/bourses/scholarship/${scholarship_id}`, null)
  .then(data => 
  {
    //When HTTP request is succesful, delete scholaship
    document.getElementById("scholarship_" + String(scholarship_id)).remove();

    //Hide header and container if no more content inside it
    hide_month_headers();
  })
  .catch(err => {show_popup(".error_popup", "Impossible de supprimer l'enregistrement de la bourse")});
};

function subscribe_scholarship(scholarship_id, checkbox)
{
  checkbox.disabled = true

  if(checkbox.checked)
  {
    //Request to add scholarship subscription to specified id
    POST(`/bourses/subscribe/${scholarship_id}`, JSON.stringify({email: localStorage.getItem("user_email") || undefined}))
    .then(data => 
    {
      checkbox.disabled = false
    })
    .catch(err => {show_popup(".error_popup", "Impossible de s'abonner à l'enregistrement de la bourse")});
  }
  else
  {
    //Request to remove scholarship subscription to specified id
    DELETE(`/bourses/subscribe/${scholarship_id}`, JSON.stringify({email: localStorage.getItem("user_email") || undefined}))
    .then(data => 
    {
      checkbox.disabled = false
    })
    .catch(err => {show_popup(".error_popup", "Impossible de se désabonner de l'enregistrement de la bourse")});
  }
}

//Function to initialize a scholarship
function initiate_scholarship(scholarship)
{
  let new_scholarship = document.createElement("div");

  new_scholarship.classList.add("scholarship");
  new_scholarship.classList.add("scroll_hide");
  new_scholarship.id = "scholarship_" + String(scholarship.id);

  let date = `${scholarship.date.day} ${scholarship.date.month} ${scholarship.date.time}` 

  new_scholarship.innerHTML = 
  ` 
    <div class="id" style="display: none;">${scholarship.id}</div>
    <h4 class="scholarship_name admin_edit">${scholarship.name}</h4>
    <h5 class="scholarship_value admin_edit">${scholarship.value}</h5>

    <div class="scholarship_date">
      <h6>${date}</h6>

      <div class="date">
        <input type="text" maxLength="2" placeholder="DD" value="${scholarship.date.day}">

        <select id="month_select">
          <option>Septembre</option>
          <option>Octobre</option>
          <option>Novembre</option>
          <option>Décembre</option>
          <option>Janvier</option>
          <option>Février</option>
          <option>Mars</option>
          <option>Avril</option>
          <option>Mai</option>
          <option>Juin</option>
          <option>Juillet</option>
          <option>Août</option>
        </select>

        <input type="time" value="${scholarship.date.time}">
      </div>
    </div>

    <div class="scholarship_link">
      <a href="${scholarship.link}" target="_blank" onclick="this.blur()">Plus d'information</a>
      <input type="text" value="${scholarship.link}" style="display: none;">
    </div>

    <p class="scholarship_criteria admin_edit">${scholarship.criteria}</p>

    <div class="scholarship_buttons">
      <input type="button" id="add_button_${scholarship.id}" onclick="add_scholarship(${scholarship.id})" style="display: none;">

      <label for="add_button_${scholarship.id}" class="add_button admin icon">
        <img src="/icons/add.svg" class="no_select svg" draggable="false"></img>
      </label>

      <input type="checkbox" id="subscribe_checkbox_${scholarship.id}" onchange="subscribe_scholarship(${scholarship.id}, this)" style="display: none;">

      <label for="subscribe_checkbox_${scholarship.id}" class="logged_in user icon">
        <img src="/icons/subscribe.svg" class="unactive_checkbox no_select svg" draggable="false"></img>
        <img src="/icons/unsubscribe.svg" class="active_checkbox no_select svg" draggable="false"></img>
      </label>

      <input type="checkbox" id="edit_checkbox_${scholarship.id}" class="edit_checkbox" onchange="edit_scholarship(this, this.parentNode.parentNode, event)" style="display: none;">

      <label for="edit_checkbox_${scholarship.id}" class="admin icon">
        <img src="/icons/edit.svg" class="unactive_checkbox no_select svg" draggable="false"></img>
        <img src="/icons/save.svg" class="active_checkbox no_select svg" draggable="false"></img>
      </label>

      <input type="button" id="delete_button_${scholarship.id}" onclick="delete_scholarship(${scholarship.id})" style="display: none;">

      <label for="delete_button_${scholarship.id}" class="admin icon">
        <img src="/icons/delete.svg" class="no_select svg" draggable="false"></img>
      </label>
    </div>
  `;

  new_scholarship.querySelector("#month_select").value = scholarship.date.month;

  return new_scholarship;
}

//Hides headers with no children, shows headers with children
function hide_month_headers()
{
  let table_children = Array.from(table.children);

  table_children.forEach((element, index) =>
  {
    if(element.children.length <= 0)
    {    
      table_children[index - 1].style.display = "none"; //Hide Header
      element.style.display = "none"; //Hide Container
    }
    else if((index % 2) == 1)
    {
      table_children[index - 1].style.display = "block"; //Show Header
      element.style.display = "grid"; //Show Container
    };
  });
};