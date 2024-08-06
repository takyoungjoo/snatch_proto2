import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {decrypt, encrypt, refresh_iv} from "./encryption.js";

let aws= require('aws-sdk');
//TODO: AWS Config Info
aws.config.update({
 "region": "",
 "accessKeyId": "",
 "secretAccessKey": ""
});

let dynamoDB = new aws.DynamoDB();

const tableWallet = "wallets";
const tableReferrals = "referrals";

const paramTypeEncrypt = "encrypt";
const paramTypeReferral = "referral";
let paramEncrypt = {
        AttributesToGet: [
            "PublicKey",
            "SecretKey", // remove this if not secretKey is not needed
            "IV",
        ],
        TableName: tableWallet,
        Key: {
            ChatID: {
                S: ""
            },
        },
    };

let paramReferral = {
        AttributesToGet: [
            "ReferralCode", // user's referral Code
            "ReferralCount", // number of times user's referral code has been used
            "LatestReferralTime",
            "ReferralUsed" // if user used referral code provided by other
        ],
        TableName: tableReferrals,
        Key: {
            ChatID: {
                S: ""
            },
        },
    };

function fromWalletToParams(chatId, publicKey, secretKey, IV) {
    chatId = chatId.toString();
    return {
        TableName: tableWallet,
        Item: {
            ChatID: {S: chatId}, // primary key
            PublicKey: {S: publicKey},
            SecretKey: {S: secretKey},
            IV: {S: IV},
        },
    };
}

function fromReferralCodeToParams(chatId, referralCode) {
    chatId = chatId.toString();
    return {
        TableName: tableReferrals,
        Item: {
            ChatID: {S: chatId},  // primary key
            ReferralCode: {S: referralCode},
        },
    };
}

function fromUserToParams(chatId, paramType) {
    chatId = chatId.toString();
    if(paramType === paramTypeEncrypt){
        return injectChatIdToParams(chatId, paramEncrypt);
    }
    else if(paramType === paramTypeReferral){
        return injectChatIdToParams(chatId, paramReferral);
    }

    console.log("unsupported param type");
    return {};
}

function injectChatIdToParams(chatId, params){
    chatId = chatId.toString();
    var copy = {};
    Object.assign(copy, params);
    copy["Key"] = {
        ChatID: {
            S: chatId
        },
    };
    return copy;
}
export async function getWalletForUser(chatId) {
    // Call DynamoDB to read the item from the table
    let params = fromUserToParams(chatId, paramEncrypt);
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

export async function saveReferralCodeForUser(chatId, referralCode) {
    try {
        const params = buildReferralCodeParams(chatId, referralCode);
        const data = await dynamoDB.updateItem(params).promise();
        console.log("Success", data.Item);
        return data.Item["ReferralCode"];
    } catch (err) {
        console.log("Error", err);
    }
}

function buildReferralCountParams(chatId) {
    chatId = chatId.toString();
    return {
        TableName: tableReferrals,
        Key: {ChatID: chatId},
        UpdateExpression: 'SET #referralCount = #referralCount + :increase #latestTime = :time',
        ExpressionAttributeNames: {
            '#referralCount': 'ReferralCount',
            '#latestReferralTime': 'LatestReferralTime',
        },
        ExpressionAttributeValues: {
            ":increase": {"N": 1},
            ":time": {"N": Date.now()}
        },
    };
}

function buildReferralUsedParams(chatId) {
    return {
        TableName: tableReferrals,
        Key: {ChatID: chatId},
        UpdateExpression: 'SET #referralUsed = :val',
        ExpressionAttributeNames: {
            '#referralUsed': 'ReferralUsed',
        },
        ExpressionAttributeValues: {
            ":val": {"BOOL": true}
        },
    };
}

function buildReferralCodeParams(chatId, code) {
    return {
        TableName: tableReferrals,
        Key: {ChatID: chatId},
        UpdateExpression: 'SET #referralCode = if_not_exists($referralCode, :code)',
        ExpressionAttributeNames: {
            '#referralCode': 'ReferralCode',
        },
        ExpressionAttributeValues: {
            ":code": {"S": code},
        },
    };
}

export async function updateReferralCountForUser(referringChatId, referredChatId) {
    try {
        const referralCountParams = buildReferralCountParams(referringChatId);
        const referralUsedParams = buildReferralUsedParams(referredChatId);
        const countData = await dynamoDB.updateItem(referralCountParams).promise();
        const usedData = await dynamoDB.updateItem(referralUsedParams).promise();
        console.log("save success for referrer", countData.Item);
        console.log("save success for referred", usedData.Item);
        return countData.Item["ReferralCount"];
    } catch (err) {
        console.log("Error", err);
        throw err;
    }
}

export async function getReferralCodeForUserFromDB(chatId) {
    try {
        const dbItem = await getReferralInfoForUser(chatId);
        if (dbItem == null) {
            return "";
        }

        return dbItem["ReferralCode"];
    } catch (err) {
        console.log("Error", err);
    }
}

export async function getReferralCountForUser(chatId) {
    try {
        const dbItem = await getReferralInfoForUser(chatId);
        if (dbItem == null) {
            return null;
        }

        return dbItem["ReferralCount"];
    } catch (err) {
        console.log("Error", err);
    }
}

export async function getReferralInfoForUser(chatId) {
    let params = fromUserToParams(chatId, paramTypeReferral);
    try {
        // Call DynamoDB to read the item from the table
        const data = await dynamoDB.getItem(params).promise()
        if(data.Item){
            console.log("Item found", data.Item);
            return data.Item;
        }

        return null;
    } catch (err) {
        console.log("Error", err);
        throw err;
    }
}

// get top referral counts
export async function getReferrals(limit) {
   // Call DynamoDB to read the item from the table
    var params = {
    FilterExpression: "attribute_exists(ChatID) and attribute_exists(ReferralCount)",
    Limit: limit,
    TableName: tableReferrals
    };
    try {
        let result = []
        const data = await dynamoDB.scan(params).promise();

        if (data.Items.length === 0) {
             console.log("no result");
             return result;
        }

        console.log(data.Items.length);
        return data.Items;
    } catch (err) {
        console.log("Error", err);
    }
}

export async function userHasBeenReferred(chatId) {
    try {
        const dbItem = await getReferralInfoForUser(chatId);
        if (dbItem == null) {
            return false;
        }

        return dbItem["ReferralUsed"];
    } catch (err) {
        console.log("Error", err);
    }
}