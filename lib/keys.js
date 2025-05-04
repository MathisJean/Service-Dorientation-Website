//----HTTP Encryption---//
const crypto = require("crypto")

global.client_public_key = null;

//Generate private and public key
const keyPair = crypto.generateKeyPairSync('rsa', 
{
  modulusLength: 2048,
  publicKeyEncoding: 
  {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: 
  {
    type: 'pkcs8',
    format: 'pem'
  }
});

serverside_private_key = keyPair.privateKey; //Set private key to the generated key

module.exports =
{
    server_public_key: keyPair.publicKey,
    server_private_key: keyPair.privateKey,
    get_client_public_key: () => {return global.client_public_key},
    set_client_public_key: (key) => {global.client_public_key = key;}
};