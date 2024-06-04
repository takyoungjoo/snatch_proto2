import {decrypt, encrypt, refresh_iv} from "./encryption.js";
import crypto from 'crypto';

// uncomment for local cipher and decipher testing
// const plaintext = "hello"
// let iv = refresh_iv();
// let e = encrypt(plaintext, iv);
// console.log("encrypted: " + e.toString());
//
//
//
// let d = decrypt(e, iv);
// console.log("plaintext: " + d);
// iv = refresh_iv();
// e = encrypt(d, iv);
// console.log("encrypted: " + e.toString());
// d = decrypt(e, iv);
// console.log("plaintext: " + d);