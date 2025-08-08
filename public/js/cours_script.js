
//Start
inputs = Array.from(document.querySelectorAll(".input_scroll"));

inputs.forEach(element => 
{
    element.setAttribute("title", element.value);
});

//Admin feature to edit link data
function edit_link(checkbox, parent, event)
{
    inputs = Array.from(parent.querySelectorAll(".input_scroll"));
    links = Array.from(parent.querySelectorAll(".input_link"));

  //Edit mode
  if(checkbox.checked)
  {
    //Reset value
    values = {url: ""};

    inputs.forEach(input =>
    {
        input.style.display = "block"
    });
    links.forEach(link =>
    {
        link.style.display = "none"
    });
  }
  else
  {
    //Reset value
    edited_values = {url: ""};

    inputs.forEach(input =>
    {
        input.style.display = "none"   
        input.setAttribute("title", input.value);     
    });
    links.forEach(link =>
    {
        link.style.display = "block"
    });
  }
}