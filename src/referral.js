import crypto from 'crypto';
import {
    getReferralCountForUser,
    getReferrals,
    saveReferralCodeForUser, saveWalletForUser,
    updateReferralCountForUser
} from "./dynamo.js";

const postfixCount = 8;

export async function processReferral(chatId, referralCode) {
    let referringChatId = "";
    referringChatId = referralCode.slice(0, -postfixCount);
    if (referringChatId === chatId) {
        console.log("user cannot refer himself");
        return;
    }

    const stored = await updateReferralCountForUser(referringChatId);
    if (stored == null) {
        console.log("error saving wallet");
        return {};
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
        let referralCode = getReferralCountForUser(chatId);
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