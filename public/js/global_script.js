
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

//----HTTP Encryption----//

let serverside_public_key;
let clientside_private_key;

window.key_exchange_complete = 
(
    //Initialize keys and communicate public key from server and client
    async function ()
    {
        //Generate private and public key
        const keyPair = await window.crypto.subtle.generateKey
        (
            {
                name: "RSA-OAEP",
                modulusLength: 2048, //Key size
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },

            true,
            ["encrypt", "decrypt"]
        );

        clientside_private_key = keyPair.privateKey; //Set private key to the generated key

        //Send Clientside public key to server
        POST("/public_key/clientside", JSON.stringify({key: await export_key_to_pem(keyPair.publicKey)}))
        .then(data =>
        {
            //Successful
        })
        .catch(err =>
        {
            console.error(err)
        });

        //Get Serverside public key
        GET("/public_key/serverside")
        .then(data =>
        {
            serverside_public_key = data.key;
        })
        .catch(err =>
        {
            console.error(err)
        });
    
        //Exchange is done
        return true
    }
)();

window.key_exchange_complete;

//Decrypt incoming data from server
async function decrypt_data(data, encrypted_aes_key, debug_mode)
{
    if(!debug_mode)
    {
        //Converte base64 str to encrypted bytes
        const bytes = Uint8Array.from(atob(encrypted_aes_key), c => c.charCodeAt(0));
        
        //Decrypt AES key with the RSA private key
        const raw_aes_key = await window.crypto.subtle.decrypt(
            {
            name: "RSA-OAEP"
            },
            clientside_private_key,
            bytes
        );

        //Import AES key for decryption
        const aes_key = await window.crypto.subtle.importKey(
            "raw",
            raw_aes_key,
            { name: "AES-CBC" }, //AES-GCM if you’re using that
            false,
            ["decrypt"]
        );

        //Decode IV and encrypted content from hex to Uint8Array
        const iv = hex_to_bytes(data.iv);
        const content = hex_to_bytes(data.content);

        //Decrypt content
        const decrypted_buffer = await crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: iv
            },
            aes_key,
            content
        );

        //Convert decrypted buffer to JSON object
        const decrypted_text = new TextDecoder().decode(decrypted_buffer);
        return JSON.parse(decrypted_text);
    }
    else
    {
        return Promise.resolve(JSON.parse(data));
    }
};

//Convert hex string to Uint8Array
function hex_to_bytes(hex)
{
    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++)
    {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }

    return bytes;
}

async function export_key_to_pem(key) 
{
    //Export the key to ArrayBuffer
    const exported = await window.crypto.subtle.exportKey(
        "spki",
        key
    );

    //Convert ArrayBuffer to base64
    const string_key = String.fromCharCode(...new Uint8Array(exported));
    const base64_key = btoa(string_key);

    //Format as PEM
    const pem_header = "-----BEGIN PUBLIC KEY-----";
    const pem_footer = "-----END PUBLIC KEY-----";

    const pem_body = base64_key.match(/.{1,64}/g).join('\n');

    return `${pem_header}\n${pem_body}\n${pem_footer}`;
}

//----Global Variables----//

//Media Queries
const reduced_motion_query = window.matchMedia("(prefers-reduced-motion: reduce)");
const medium_screen_width_query = window.matchMedia("(max-width: 1024px)");

//Initialize admin from localStorage or default to false
let logged_in = localStorage.getItem("logged_in") === "true";
let is_admin = localStorage.getItem("is_admin")  === "true";

console.log(localStorage.getItem("logged_in") === "true")
console.log(localStorage.getItem("is_admin")  === "true")

let user_name = localStorage.getItem("user_name") || undefined;
let user_email = localStorage.getItem("user_email") || undefined;

let authentication_code;

const style = window.getComputedStyle(document.body)

const background = document.querySelector("#background_gradient");
const background_pos_x = style.getPropertyValue("--background--pos--x");
const background_pos_y = style.getPropertyValue("--background--pos--y");
const background_angle = parseInt(style.getPropertyValue("--background--angle"), 10);

const background_observer = new IntersectionObserver((entries) => 
{
    entries.forEach(entry => 
    {
        if(entry.isIntersecting) 
        {
            window.addEventListener("scroll", update_gradient)
        }
        else 
        {
            window.removeEventListener("scroll", update_gradient)
        };
    });
});

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


//----Global Script----//


document.removeEventListener("scroll", update_gradient); // Ensure it starts without event listener

window.onload = function () 
{
    setTimeout(function() {document.body.style.display = "";}, 200);
}

let ticking = false;

window.addEventListener("scroll", function()
{
    if(!ticking)
    {
        requestAnimationFrame(() =>
        {
            let scrollPosition = window.scrollY;
            document.getElementById("background_gradient").style.transform = `translateY(${scrollPosition * 0.5}px)`;

            ticking = false;
        })

        ticking = true;
    }
});

//Waits for website to be loaded
window.addEventListener("load", load)

function load()
{
    //Verifies if background is in viewport
    background_observer.observe(background);

    update_gradient() //Sets the background to the right starting amount

    //Show onscroll animations
    const hidden_elements = Array.from(document.querySelectorAll(".scroll_hide"));
    hidden_elements.forEach(element => {scroll_observer.observe(element)});

    admin(document)
    account_icon() //Change account icon displayed
};

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
function update_gradient(event)
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

//Hides or shows elements based on .admin and .user class
function admin(parent)
{
    is_admin = localStorage.getItem("is_admin")  === "true";
    
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

//Changes account icon if logged in
function account_icon()
{
    logged_in = JSON.parse(localStorage.getItem("logged_in")) || false;

    if(logged_in)
    {
        document.querySelector(".nav_login").style.zIndex = "0";
    }
    else if(!logged_in)
    {
        document.querySelector(".nav_login").style.zIndex = "2";
    };
};

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

            //Store in localStorage
            localStorage.setItem("logged_in", JSON.stringify(true));
            localStorage.setItem("is_admin", JSON.stringify(user_profil.admin));
            localStorage.setItem("user_name", JSON.stringify(user_profil.name));
            localStorage.setItem("user_email", JSON.stringify(user_email));

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
    //Store in localStorage
    localStorage.setItem("logged_in", JSON.stringify(false));
    localStorage.setItem("is_admin", JSON.stringify(false));
    localStorage.setItem("user_name", JSON.stringify(undefined));
    localStorage.setItem("user_email", JSON.stringify(undefined));

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
                
                //Store in localStorage        
                localStorage.setItem("logged_in", JSON.stringify(true));
                localStorage.setItem("is_admin", JSON.stringify(user_profil.admin));
                localStorage.setItem("user_name", JSON.stringify(user_profil.name));
                localStorage.setItem("user_email", JSON.stringify(user_email));

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