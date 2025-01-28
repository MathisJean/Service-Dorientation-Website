
//----HTTP requests----//

//Example GET
//GET("/scholarship_data")
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

        throw String(response.status + " - " + err);
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

        throw String(response.status + " - " + err);
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

        throw String(response.status + " - " + err);
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

        throw String(response.status + " - " + err);
    };

    const data = await response.json();
    return data;
}

//----Global-Constants----//

//Admin is set based on account on log-in
const is_admin = true;

const background = document.querySelector("#background_gradient");

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

//Verifies if background in viewport
observer.observe(background);

//----Global-Functions----//

function update_gradient()
{
    const y = window.scrollY / window.innerHeight * 120 + 50;
    
    background.style.background = 
    `
        conic-gradient(from ${y}deg at left,
        rgb(255, 255, 255),
        rgb(100, 100, 100)  200deg,
        rgb(255, 255, 255)
        )
    `;
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
  
    element_position = elements[0].getBoundingClientRect().top + window.scrollY - 100;
  
    window.scrollTo(
    {
      top: element_position,
      behavior: "smooth"
    });
  };
};

function error_popup(error_msg, clear)
{
    let error_popup = document.querySelector(".error_popup");
    let error_popup_text = document.querySelector(".error_popup > p");

    if (clear)
    {
        //Freeze scroll
        document.body.style.overflow = "auto";

        document.body.classList.remove("no_input")

        error_popup.style.top = "-50%";
    }

    else
    {
        //Freeze scroll
        document.body.style.overflow = "hidden";

        document.body.classList.add("no_input")

        error_popup_text.innerHTML = String(error_msg);
        error_popup.style.top = "5rem";
    };
};

//----Global-Methods----//

//Custom Method to Replace Characters from a list to regular versions
String.prototype.replaceSpecialChar = function()
{
    //Charcters that will be replaced
    character_array   = ["é", "è", "û"];
    replacement_array = ["e", "e", "u"];

    string = this;

    character_array.forEach((character, index) =>
    {
        string = string.toLowerCase().replaceAll(character, replacement_array[index]);
    });

    return string;
};
