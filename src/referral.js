import crypto from 'crypto';
import {
    getReferralCountForUser,
    getReferrals,
    saveReferralCodeForUser,
    updateReferralCountForUser
} from "./dynamo.js";

const postfixCount = 8;

export function processReferral(chatId, referralCode) {
    let referringChatId = "";
    referringChatId = referralCode.slice(0, -postfixCount);
    if (referringChatId === chatId) {
        console.log("user cannot refer himself");
        return;
    }

    updateReferralCountForUser(referringChatId);
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

export function getReferralCodeForUser(chatId) {
    let referralCode = getReferralCountForUser(chatId);
    if (referralCode === "") {
        referralCode = generateReferralCode(chatId);
        saveReferralCodeForUser(chatId, referralCode);
    }
}