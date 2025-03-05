//Handle API errors
function handle_api_error(err, res) 
{
    //Log the error for internal tracking
    console.error(err);

    //Check for specific error codes and return appropriate responses
    switch (err.code) 
    {
        case "ENOENT":
        return res.status(404).send("File not found");
        case "EACCES":
        return res.status(403).send("Permission denied");
        case "EISDIR":
        return res.status(400).send("Expected file, but found a directory");
        case "EMFILE":
        return res.status(503).send("Too many open files, try again later");
        case "ENOTDIR":
        return res.status(400).send("Expected a directory, but found a file");
        case "ENOSPC":
        return res.status(507).send("No space left on the device");
        case "EIO":
        return res.status(500).send("Internal input/output error");
        case "EBUSY":
        return res.status(423).send("File or resource is busy");
        case "EFAULT":
        return res.status(400).send("Bad address error");
        case "EINVAL":
        return res.status(400).send("Invalid argument passed to operation");
        case "ACCNF":
        return res.status(404).send("Compte introuvable");
        case "ACCF":
        return res.status(409).send("E-mail déjà utilisé");
        default:
        // For any other unhandled errors
        return res.status(500).send("Internal Server Error");
    }
}
  
module.exports = handle_api_error;
  