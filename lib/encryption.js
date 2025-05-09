require('dotenv').config();

const crypto = require('crypto');

const password = process.env.ENCRYPTION_PASSWORD;
const salt = process.env.ENCRYPTION_SALT;
const key = crypto.scryptSync(password, salt, 32)

const debug_mode = process.env.DEBUG_MODE === 'true';

//Return JSON data
function encrypt(data)
{
    data = JSON.stringify(data, null, 2)

    if(debug_mode)
    {
        return data
    }
    else
    {
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    
        return JSON.stringify({iv: iv.toString('hex'), content: encrypted.toString('hex')}, null, 2);
    }
}

//Returns data as object
function decrypt(data)
{
    data = JSON.parse(data)

    if(!data.iv && !data.content)
    {
        return data
    }
    else
    {
        const iv = Buffer.from(data.iv, 'hex');
        const content = Buffer.from(data.content, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    
        return JSON.parse(decrypted.toString('utf8'));
    }
}

//Encrypt data before sending to client
function http_encryption(data, public_key)
{
    if(!debug_mode)
    {
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

        const encrypted_aes_key = crypto.publicEncrypt(
            {
                key: public_key,
                oaepHash: "sha256",
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            key
        );
        
        return JSON.stringify({data: {iv: iv.toString('hex'), content: encrypted.toString('hex')}, aes_key: encrypted_aes_key.toString('base64'), debug_mode: false}, null, 2);
    }
    else
    {
        return JSON.stringify({data: data, aes_key: "", debug_mode: true}, null, 2);
    }
}

module.exports = {encrypt, decrypt, http_encryption};