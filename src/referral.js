import crypto from 'crypto';
import {
    getReferralCodeForUserFromDB,
    getReferrals,
    saveReferralCodeForUser,
    updateReferralCountForUser,
    userHasBeenReferred
} from "./dynamo.js";

const postfixCount = 8;

export async function processReferral(chatId, referralCode) {
    let referringChatId = "";
    referringChatId = referralCode.slice(0, -postfixCount);
    if (referringChatId === chatId) {
        console.log("user cannot refer himself");
        return -1;
    }

    try {
        // check if this person already redeemed referral code. no double-dipping
        if(await userHasBeenReferred(chatId)){
            console.log("user already used a referral code");
            return -1;
        }

        return await updateReferralCountForUser(referringChatId, chatId);
    }
    catch (err) {
        console.log("error processing referral code");
        return -1;
    }
}

export function getTopReferrals(topNum) {
    return getReferrals(topNum);
}

export function generateReferralCode(chatId) {
     let uuid = crypto.randomUUID();
     uuid = uuid.replace('-', '');
     uuid = uuid.substring(0,postfixCount);
    return chatId + uuid;
}

export async function getReferralCodeForUser(chatId) {
    try {
        let referralCode = await getReferralCodeForUserFromDB(chatId);
        if (referralCode === "") {
            referralCode = generateReferralCode(chatId);
            const data = await saveReferralCodeForUser(chatId, referralCode);
        }
        return referralCode;
    }
    catch (err) {
        console.log("Error", err);
    }
}