import {decrypt, encrypt, refresh_iv} from "./encryption.js";

let aws = require('aws-sdk');
//TODO: AWS Config Info
aws.config.update({
 "region": "",
 "accessKeyId": "",
 "secretAccessKey": ""
});

let dynamoDB = new aws.DynamoDB();
const tableName = "wallets";
function fromWalletToParams(chatId, publicKey, secretKey, IV) {
    return {
        TableName: tableName,
        Item: {
            ChatID: {S: chatId},
            PublicKey: {S: publicKey},
            SecretKey: {S: secretKey},
            IV: {S: IV},
        },
    };
}

function fromUserToParams(chatId) {
    return {
        AttributesToGet: [
            "PublicKey",
            "SecretKey", // remove this if not secretKey is not needed
            "IV",
        ],
        TableName: tableName,
        Key: {
            ChatID: {
                S: chatId
            },
        },
    };
}
export async function getWalletForUser(chatId) {
    // Call DynamoDB to read the item from the table
    let params = fromUserToParams(chatId);
    try {
        // Call DynamoDB to read the item from the table
        const data = await dynamoDB.getItem(params).promise()
        console.log("Success", data.Item);
        const pk = data.Item["PublicKey"];
        const sk = data.Item["SecretKey"];
        const iv = data.Item["IV"];
        const plainTextSecretKey = decrypt(sk, iv);
        return {pk, plainTextSecretKey};
    } catch (err) {
        console.log("Error", err);
    }
}

export async function saveWalletForUser(chatId, publicKey, secretKey) {
    // possibly pass in wallet object instead of 3 variables
    const iv = refresh_iv();
    let encryptedSecretKey = encrypt(secretKey, iv)
    let params = fromWalletToParams(chatId, publicKey, encryptedSecretKey, iv);
    // Call DynamoDB to add the item to the table
    try {
        const data = await dynamoDB.putItem(params).promise()
        console.log("Success", data.Item);
        return {publicKey, encryptedSecretKey};
    } catch (err) {
        console.log("Error", err);
        return null;
    }
}