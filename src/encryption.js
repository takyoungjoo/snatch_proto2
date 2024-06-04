import crypto from 'crypto'
import {ENCRYPTION_METHOD, ENCRYPTION_SECRET_KEY} from './config.js';

if (!ENCRYPTION_SECRET_KEY || !ENCRYPTION_METHOD) {
    throw new Error('encryption info not set');
}

const hash_key = crypto
    .createHash('sha512')
    .update(ENCRYPTION_SECRET_KEY)
    .digest('hex')
    .substring(0,32)

export function refresh_iv(){
    let iv = crypto.randomBytes(16).toString('hex');
    let hash_IV = crypto
    .createHash('sha512')
    .update(iv)
    .digest('hex')
    .substring(0,16);
    return hash_IV;
}
export function encrypt(plaintext, hash_IV) {
    const cipher = crypto.
    createCipheriv(ENCRYPTION_METHOD, hash_key, hash_IV)
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

export function decrypt(encrypted, hash_IV) {
    const decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, hash_key, hash_IV);
    let plaintext = decipher.update(encrypted, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    return plaintext;
}