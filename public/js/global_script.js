
//----HTTP requests----//

//Example GET
//GET("/bourses/data")
//  .then(data => {console.log("GET resolved:", data)})
//  .catch(err => {console.error(err)})

//GET data from resource
const GET = async (resource) =>
{
    const response = await fetch(resource);

    //If response isn't succesful
    if(response.status !== 200)
    {
        let err = await response.text()

        if(!err)
        {
            err = "Cannot get data"
        }

        throw String(err);
    };

    const data = await response.json();
    return data;
}

//POST data to resource
const POST = async (resource, json_data) => //Data must be in object form
{
    const config =
    {
    method: "POST",
    headers: 
    {
        "Accept": "application/json",
        "Content-type": "application/json"
    },
    body: json_data
    };

    const response = await fetch(resource, config);

    //If response isn't succesful
    if(response.status !== 200)
    {
        let err = await response.text()

        if(!err)
        {
            err = "Cannot post data"
        }

        throw String(err);
    };

    const data = await response.json();
    return data;
}

//PUT data to resource
const PUT = async (resource, json_data) => //Data must be in object form
{
    const config =
    {
    method: "PUT",
    headers: 
    {
        "Accept": "application/json",
        "Content-type": "application/json"
    },
    body: json_data
    };

    const response = await fetch(resource, config);

    //If response isn't succesful
    if(response.status !== 200)
    {
        let err = await response.text()

        if(!err)
        {
            err = "Cannot put data"
        }

        throw String(err);
    };

    const data = await response.json();
    return data;
}

//DELETE data to resource
const DELETE = async (resource, json_data) => //Data must be in object form
{
    const config =
    {
    method: "DELETE",
    headers: 
    {
        "Accept": "application/json",
        "Content-type": "application/json"
    },
    body: json_data
    };

    const response = await fetch(resource, config);

    //If response isn't succesful
    if(response.status !== 200)
    {
        let err = await response.text()

        if(!err)
        {
            err = "Cannot delete data"
        }

        throw String(err);
    };

    const data = await response.json();
    return data;
}

//----Global Variables----//

// Initialize admin from localStorage or default to false
let logged_in = JSON.parse(localStorage.getItem("logged_in")) || false;
let is_admin = JSON.parse(localStorage.getItem("is_admin")) || false;

let user_name = localStorage.getItem("user_name") || undefined;
let user_email = localStorage.getItem("user_email") || undefined;

const style = window.getComputedStyle(document.body)

const background = document.querySelector("#background_gradient");
const background_pos_x = style.getPropertyValue("--background--pos--x");
const background_pos_y = style.getPropertyValue("--background--pos--y");
const background_angle = parseInt(style.getPropertyValue("--background--angle"), 10);

const observer = new IntersectionObserver((entries) => 
{
    entries.forEach(entry => 
    {
        if (entry.isIntersecting) 
        {
            document.addEventListener("scroll", update_gradient);
        } 
        else 
        {
            document.removeEventListener("scroll", update_gradient);
        };
    });
});

//----Global Script----//

document.removeEventListener("scroll", update_gradient); // Ensure it starts without event listener

window.onload = function () 
{
    setTimeout(function() {document.body.style.display = "";}, 200);
}

//Waits for website to be loaded
window.addEventListener("load", () => 
{
    //Verifies if background is in viewport
    observer.observe(background);

    update_gradient() //Sets the background to the right starting amount

    admin(document)
    account_icon() //Change account icon displayed
});

//----Global Functions----//

function change_cell_focus(event)
{
  if(document.activeElement !== document.body && event.key === "Enter")
  {
    event.preventDefault()

    // Example: Move focus to the next element (optional)
    let next = document.activeElement.nextElementSibling ? document.activeElement.nextElementSibling : document.activeElement.parentElement.nextElementSibling

    if(Array.from(next.classList).includes("scholarship_link")) 
    {
      next.querySelector("input").focus();
    }
    else if(!Array.from(next.classList).includes("scholarship_buttons"))
    {      
      next.focus();
    };
  };
}

//Update the background
function update_gradient()
{
    const y = window.scrollY / window.innerHeight * 120 + background_angle;
    
    background.style.background = 
    `
        conic-gradient(from ${y}deg at ${background_pos_x} ${background_pos_y},
        rgb(255, 255, 255),
        rgb(100, 100, 100)  200deg,
        rgb(255, 255, 255)
        )
    `;
};

//Scrolls to specified element
function scroll_to(query_selector, event)
{
  let elements = document.querySelectorAll(query_selector);

  //Confirm element is visible
  elements = Array.from(elements).filter(element =>
  {
    return element.style.display !== "none";
  });

  if(elements.length > 0)
  {
    event.preventDefault();
    event.target.blur();
  
    element_position = elements[0].getBoundingClientRect().top + window.scrollY - 100;
  
    window.scrollTo(
    {
      top: element_position,
      behavior: "smooth"
    });
  };
};

//Displays a popup
function popup(popup_class, txt_msg)
{
    let popup = document.querySelector(popup_class);
    let popup_text = document.querySelector(popup_class + " > p");

    //Freeze scroll
    document.body.style.overflow = "hidden";

    document.body.classList.add("no_input")

    if(popup_text)
    {
        popup_text.textContent = String(txt_msg);        
    };

    popup.style.top = "50%";
};

//Closes every popup
function close_popup()
{
    let popups = Array.from(document.querySelectorAll(".popup"));

    popups.forEach(popup =>
    {
        popup.style.top = "-50%"

        popup.querySelectorAll("input[type='text'], input[type='email'], input[type='password']").forEach(input =>
        {
            input.value = null
        });
    });

    //Unfreeze scroll
    document.body.style.overflow = "auto";

    document.body.classList.remove("no_input")
};

//Hides or shows elements based on .admin and .user class
function admin(parent)
{
    is_admin = JSON.parse(localStorage.getItem("is_admin")) || false;
    
    Array.from(parent.querySelectorAll(".admin")).forEach(element => //Shows Elements if Admin
    {
        element.style.display = is_admin ? "inline_block" : "none";
    });
    Array.from(parent.querySelectorAll(".user")).forEach(element => //Shows Elements if User
    {
        element.style.display = !is_admin ? "inline-block" : "none";
    });
    Array.from(parent.querySelectorAll(".logged_in")).forEach(element => //Shows Elements if Logged In
    {
        element.style.display = logged_in && !is_admin ? "inline-block" : "none";
    });
    Array.from(parent.querySelectorAll(".admin_input")).forEach(element => //Enables Admin Inputs if Admin
    {
        element.disabled = !is_admin
    });
};

function account_icon()
{
    logged_in = JSON.parse(localStorage.getItem("logged_in")) || false;

    if(logged_in)
    {
        document.querySelector(".nav_login").style.display = "none";
        document.querySelector(".nav_logout").style.display = "flex";
    }
    else if(!logged_in)
    {
        document.querySelector(".nav_login").style.display = "flex";
        document.querySelector(".nav_logout").style.display = "none";
    };
};

function login(event, popup)
{
    event.preventDefault() //Prevent reload

    user_email = popup.querySelector("input[type='email']").value;
    let password = popup.querySelector("input[type='password']").value;

    //Create object with the new values
    let obj = JSON.stringify(
    {
        id: "",
        admin: "",
        name: "",
        password: password,
        email: user_email    
    });

    POST("/account/login", obj)
    .then(data => 
    {
        close_popup() //Close login popup

        //Store in localStorage
        localStorage.setItem("logged_in", JSON.stringify(true));
        localStorage.setItem("is_admin", JSON.stringify(data.admin));
        localStorage.setItem("user_name", JSON.stringify(data.name));
        localStorage.setItem("user_email", JSON.stringify(user_email));

        user_name = data.name;

        location.reload();
    })
    .catch(err => 
    {
        let popup_alert = popup.querySelector(".alert_msg");

        popup_alert.textContent = err;
        popup_alert.style.visibility = "visible";
    });
}

function signup(event, popup)
{
    event.preventDefault() //Prevent reload

    let first_name = popup.querySelector("#first_name_input").value.replace(/\s+/g, '');
    let last_name = popup.querySelector("#last_name_input").value.replace(/\s+/g, '');

    user_name = String(first_name + " " + last_name);
    user_email = popup.querySelector("input[type='email']").value;
    let password = popup.querySelector("input[type='password']").value;

    //Create object with the new values
    let obj = JSON.stringify(
    {
        id: -1,
        admin: false,
        name: user_name,
        password: password,
        email: user_email        
    });

    POST("/account/signup", obj)
    .then(data => 
    {
        close_popup() //Close login popup

        //Store in localStorage
        localStorage.setItem("logged_in", JSON.stringify(true));
        localStorage.setItem("is_admin", JSON.stringify(data.admin));
        localStorage.setItem("user_name", JSON.stringify(data.name));
        localStorage.setItem("user_email", JSON.stringify(user_email));

        location.reload();
    })
    .catch(err => 
    {
        let popup_alert = popup.querySelector(".alert_msg");

        popup_alert.textContent = err;
        popup_alert.style.visibility = "visible";
    });
};

function logout()
{
    //Store in localStorage
    localStorage.setItem("logged_in", JSON.stringify(false));
    localStorage.setItem("is_admin", JSON.stringify(false));
    localStorage.setItem("user_name", JSON.stringify(undefined));
    localStorage.setItem("user_email", JSON.stringify(undefined));

    location.reload();
}

//----Global Methods----//

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