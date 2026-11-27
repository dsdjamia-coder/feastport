import { db } from './firebase-config.js';
import { doc, runTransaction, updateDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import qrcode from './vendor/qrcode-generator.mjs';

const codes = new Map();
export function passArtwork(member) {
    const key = memberKey(member);
    if (!codes.has(key) && member.cardPassToken) cacheArtwork(key, member.cardPassToken);
    return codes.get(key) || '';
}
function memberKey(member) {
    return JSON.stringify([member.cardCollection || 'students', member.id]);
}

export async function issueCardPass(member, details) {
    if (!member.id || member.id === 'stress_test_worst_case') return;
    const key = memberKey(member);
    const index = doc(db, 'cardPassIndex', encodeURIComponent(key));
    const token = await runTransaction(db, async transaction => {
        const existing = await transaction.get(index);
        const token = member.cardPassToken || (existing.exists() ? existing.data().token : crypto.randomUUID());
        if (!existing.exists()) transaction.set(index, { token });
        transaction.set(doc(db, 'cardPasses', token), {
            ...details,
            memberId: member.id,
            memberCollection: member.cardCollection || 'students',
            updatedAt: Date.now()
        }, { merge: true });
        return token;
    });
    member.cardPassToken = token;
    cacheArtwork(key, token);
    return token;
}

export async function saveCardPassArtwork(member, artwork) {
    if (!member?.cardPassToken || !artwork || artwork.length > 850000) return;
    await updateDoc(doc(db, 'cardPasses', member.cardPassToken), { artwork, artworkUpdatedAt: Date.now() });
}

function cacheArtwork(key, token) {
    const url = new URL('card.html', location.href);
    url.hash = token;
    const qr = qrcode(0, 'M');
    qr.addData(url.href);
    qr.make();
    const count = qr.getModuleCount();
    const dots = [];
    for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
            if (qr.isDark(row, col)) dots.push('M' + col + ' ' + row + 'h1v1h-1z');
        }
    }
    codes.set(key, '<svg width="112" height="112" viewBox="-4 -4 ' + (count+8) + ' ' + (count+8) + '"><rect x="-4" y="-4" width="100%" height="100%" fill="white"/><path fill="black" d="' + dots.join('') + '"/></svg>');
}
