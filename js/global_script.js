

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

    console.log(elements)

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
