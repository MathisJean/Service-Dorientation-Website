

//----Global Variables----//

//Media Queries
const reduced_motion_query = window.matchMedia("(prefers-reduced-motion: reduce)");
const medium_screen_width_query = window.matchMedia("(max-width: 1024px)");

//Initialize admin from sessionStorage or default to false
let logged_in = sessionStorage.getItem("logged_in") === "true";
let is_admin = sessionStorage.getItem("is_admin")  === "true";

let user_name = sessionStorage.getItem("user_name");
let user_email = sessionStorage.getItem("user_email");

let authentication_code;

//Scroll animations
const scroll_observer = new IntersectionObserver(elements =>
{
    elements.forEach(element =>
    {
        if(element.isIntersecting)
        {
            element.target.classList.add("scroll_show");
        };
    });
});

const hidden_elements = Array.from(document.querySelectorAll(".scroll_hide"));
hidden_elements.forEach(element => {scroll_observer.observe(element)});

fetch("navbar.html")
.then(res => res.text())
.then(html =>
{
    document.getElementById("navbar_placeholder").innerHTML = html;
})
.catch(err =>
{
    console.log(err)
});


//----Global Script----//

document.querySelectorAll("input[type='checkbox'").forEach(checkbox =>
{
    checkbox.checked = false;
});


//Change focus on authentication inputs
Array.from(document.querySelectorAll(".popup .user_input")).forEach((input, index, inputs) =>
{
    input.addEventListener("keydown", (event) => 
    {
        if(event.key === "Enter")
        {
            //Move to the next input if available
            if(index < inputs.length - 1) 
            {
                event.preventDefault(); //Prevent form submission

                inputs[index + 1].focus();
                inputs[index + 1].select();
            };
        }
    });
});

//Change focus on authentication inputs
document.querySelectorAll(".popup .authentication_input").forEach((input, index, inputs) => 
{
    input.addEventListener("input", (event) => 
    {
        if(event.inputType === "insertText" && event.data.match(/^[0-9]$/)) 
        {
            //Move to the next input if available
            if(index < inputs.length - 1) 
            {
                inputs[index + 1].focus();
                inputs[index + 1].select();
            };
        }
    });

    input.addEventListener("keydown", (event) => 
    {
        if(event.key === "Backspace" && input.value === "") 
        {
            //Move to the prev input if available
            if(index > 0) 
            {
                inputs[index - 1].focus();
                inputs[index - 1].value = "";
            };
        };
    });
});

//----Global Functions----//

function change_cell_focus(event)
{
  if(document.activeElement !== document.body && event.key === "Enter")
  {
    event.preventDefault()

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

        element_position = elements[0]?.getBoundingClientRect().top + window.scrollY - 100;

        elements[0]?.scrollIntoView({ behavior: "smooth" });      
    };
};

//Displays a popup
function show_popup(popup_class, txt_msg)
{
    close_popup();

    let popup = document.querySelector(popup_class);
    let popup_text = document.querySelector(popup_class + " > p");

    popup.querySelector("input")?.focus();

    //Freeze scroll
    document.body.style.overflow = "hidden";

    document.body.classList.add("no_input")

    if(popup_text)
    {
        popup_text.textContent = String(txt_msg);        
    };

    popup.style.top = "50%";
    popup.style.opacity = "1";
};

//Closes every popup
function close_popup()
{
    let popups = Array.from(document.querySelectorAll(".popup"));

    popups.forEach(popup =>
    {
        popup.style.top = "-50%"
        popup.style.opacity = "0";

        popup.querySelectorAll("input[type='text'], input[type='email'], input[type='password'], input[type='number']").forEach(input =>
        {
            input.value = null
        });
    });

    //Unfreeze scroll
    document.body.style.overflow = "auto";

    document.body.classList.remove("no_input")
};

//Function for delete confirmation popups
function confirm_popup() 
{
    return new Promise((resolve) => 
    {
        close_popup(); //Hide other popups

        const popup = document.querySelector(".delete_popup");

        popup.style.top = "50%";
        popup.style.opacity = "1";
        document.body.style.overflow = "hidden";
        document.body.classList.add("no_input");

        const confirm_btn = popup.querySelector(".confirm_btn");
        const close_btn = popup.querySelector(".close_btn");

        const cleanup = () => 
        {
            close_popup();
            confirm_btn.removeEventListener("click", onConfirm);
            close_btn.removeEventListener("click", onCancel);
        };

        const onConfirm = () => 
        {
            cleanup();
            resolve(true);
        };

        const onCancel = () => 
        {
            cleanup();
            resolve(false);
        };

        confirm_btn.addEventListener("click", onConfirm);
        close_btn.addEventListener("click", onCancel);
    });
}

//On login
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
    .then(encrypted_data => 
    {
        decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
        .then(user_profil => 
        {
            close_popup() //Close login popup

            //Store in sessionStorage
            sessionStorage.setItem("logged_in", JSON.stringify(true));
            sessionStorage.setItem("is_admin", JSON.stringify(user_profil.admin));
            sessionStorage.setItem("user_name", JSON.stringify(user_profil.name));
            sessionStorage.setItem("user_email", JSON.stringify(user_email));

            user_name = user_profil.name;

            location.reload()
        })
        .catch(err =>
        {
            throw new Error("Decryption failed: " + err.message);
        })
    })
    .catch(err => 
    {
        let popup_alert = popup.querySelector(".alert_msg");

        popup_alert.textContent = err;
        popup_alert.style.visibility = "visible";
    });
}

let obj;

//On signup
function signup(event, popup)
{
    event.preventDefault() //Prevent reload

    let first_name = popup.querySelector("#first_name_input").value.replace(/\s+/g, '');
    let last_name = popup.querySelector("#last_name_input").value.replace(/\s+/g, '');

    user_name = String(first_name + " " + last_name);
    user_email = popup.querySelector("input[type='email']").value;
    let password = popup.querySelector("input[type='password']").value;

    //Create object with the new values
    obj = JSON.stringify(
    {
        id: -1,
        admin: false,
        name: user_name,
        password: password,
        email: user_email        
    });

    send_email(popup);
};

//Resends an Email
function send_email(popup)
{
    POST("/account/signup/authentication", obj)
    .then(encrypted_data => 
    {
        decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
        .then(data => 
        {
            authentication_code = data;

            //Resets the authentication code after 3 minutes
            setTimeout(() => {authentication_code = ""}, 180000)

            close_popup()

            show_popup(".authentication_popup", "");
        })
        .catch(err =>
        {
            throw new Error("Decryption failed: " + err.message);
        })
    })
    .catch(err => 
    {
        let popup_alert = popup.querySelector(".alert_msg");

        popup_alert.textContent = err;
        popup_alert.style.visibility = "visible";
    });
};

//Logout
function logout()
{
    //Store in sessionStorage
    sessionStorage.setItem("logged_in", JSON.stringify(false));
    sessionStorage.setItem("is_admin", JSON.stringify(false));
    sessionStorage.setItem("user_name", JSON.stringify(undefined));
    sessionStorage.setItem("user_email", JSON.stringify(undefined));

    location.reload();
};

//Email verification via authentication code
function authenticate(event, popup)
{
    event.preventDefault() //Prevent reload

    let input_code = "";

    Array.from(popup.querySelectorAll("input[type='text']")).forEach(input =>
    {
        input_code += String(input.value);
    });

    if(Number(input_code) === Number(authentication_code))
    {
        POST("/account/signup/complete", null)
        .then(encrypted_data => 
        {
            decrypt_data(encrypted_data.data, encrypted_data.aes_key, encrypted_data.debug_mode)
            .then(user_profil => 
            {
                close_popup()
                
                //Store in sessionStorage        
                sessionStorage.setItem("logged_in", JSON.stringify(true));
                sessionStorage.setItem("is_admin", JSON.stringify(user_profil.admin));
                sessionStorage.setItem("user_name", JSON.stringify(user_profil.name));
                sessionStorage.setItem("user_email", JSON.stringify(user_email));

                location.reload()
            })
            .catch(err =>
            {
                throw new Error("Decryption failed: " + err.message);
            })
        })
        .catch(err => 
        {
            let popup_alert = popup.querySelector(".alert_msg");

            popup_alert.textContent = err;
            popup_alert.style.visibility = "visible";
        }); 
    }
    else
    {
        let popup_alert = popup.querySelector(".alert_msg");

        popup_alert.textContent = "Code incorrect";
        popup_alert.style.visibility = "visible";
    };
};

let slideIndex = 1;

if(document.getElementsByClassName("slide").length > 0)
{
    showSlides(slideIndex)
}

//Next/previous controls
function plusSlides(n)
{
  showSlides(slideIndex += n);
}

//Thumbnail image controls
function currentSlide(n)
{
  showSlides(slideIndex = n);
}

function showSlides(n)
{
    let i;
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");

    if(n > slides.length) 
    {
        slideIndex = 1
    }

    if(n < 1) 
    {
        slideIndex = slides.length
    }

    for(i = 0; i < slides.length; i++) 
    {
        slides[i].style.display = "none";
    }

    for(i = 0; i < dots.length; i++) 
    {
        dots[i].className = dots[i].className.replace(" active", "");
    }

    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " active";
}

function toggle_dropdown(container_class, checkbox_id)
{
    const checkbox = document.getElementById(checkbox_id);
    const container = document.querySelector(`.${container_class} .list`);
    
    if(!checkbox.checked)
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