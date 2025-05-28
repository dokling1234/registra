const crypto = require('crypto');
// env key
const AES_KEY = Buffer.from(process.env.AES_SECRET_KEY, 'hex'); 

function encryptData(payload) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    data: encrypted,
    iv: iv.toString('hex')
  };
}

function decryptData(encryptedData, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}


module.exports = {
  encryptData,
  decryptData
};