
function follow_up(radio, follow_up_id)
{
    console.log("test")

    let question = document.querySelector(`#${follow_up_id}`);

    if(radio.checked)
    {
        question.display = "block";
    }
    else
    {
        question.display = "none";
    };
};