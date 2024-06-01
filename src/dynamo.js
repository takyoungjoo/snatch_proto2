let aws = require('aws-sdk');
//TODO: AWS Config Info
aws.config.update({
 "region": "",
 "accessKeyId": "",
 "secretAccessKey": ""
});

let dynamoDB = new aws.DynamoDB();
const tableName = "wallets";
function fromWalletToParams(chatId, publicKey, secretKey) {
    return {
        TableName: tableName,
        Item: {
            ChatID: {S: chatId},
            PublicKey: {S: publicKey},
            SecretKey: {S: secretKey},
        },
    };
}

function fromUserToParams(chatId) {
    return {
        AttributesToGet: [
            "PublicKey",
            "SecretKey" // remove this if not secretKey is not needed
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
        const sk = data.Item["SecretKey"]
        return {pk, sk};
    } catch (err) {
        console.log("Error", err);
    }
}

export async function saveWalletForUser(chatId, publicKey, secretKey) {
    // possibly pass in wallet object instead of 3 variables
    let params = fromWalletToParams(chatId, publicKey, secretKey);
    // Call DynamoDB to add the item to the table
    try {
        const data = await dynamoDB.putItem(params).promise()
        console.log("Success", data.Item);
        return {publicKey, secretKey};
    } catch (err) {
        console.log("Error", err);
        return null;
    }
}