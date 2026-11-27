const token = location.hash.slice(1);
const validToken = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const status = document.querySelector('#details');

if (validToken.test(token)) loadCard();

async function loadCard() {
    status.textContent = 'Loading card…';
    try {
        const [{ db }, firestore] = await Promise.all([
            import('./firebase-config.js'),
            import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
        ]);
        const { doc, getDocFromServer, collection, getDocsFromServer, query, where } = firestore;
        const snapshot = await getDocFromServer(doc(db, 'cardPasses', token));
        if (!snapshot.exists()) throw new Error('Card not found');
        const card = snapshot.data();
        document.querySelector('#festival').textContent = card.festival || 'Festival ID';
        document.querySelector('#person').textContent = card.name || 'Member';
        status.textContent = [card.chest && 'Chest ' + card.chest, card.team, card.category].filter(Boolean).join(' · ');
        showArtwork(card.artwork);

        const memberField = card.memberCollection === 'participants' ? 'participantIds' : 'studentIds';
        let registrations = [];
        try {
            const registrationSnapshot = await getDocsFromServer(query(collection(db, 'registrations'), where(memberField, 'array-contains', card.memberId)));
            registrations = registrationSnapshot.docs.map(item => ({ id: item.id, ...item.data() }));
        } catch {
            registrations = (card.events || []).map(event => ({ eventId: event.id, eventSnapshot: event }));
        }
        const eventIds = [...new Set(registrations.map(item => item.eventId).filter(Boolean))];
        const [eventDocuments, publishedResults] = await Promise.all([
            Promise.all(eventIds.map(id => getDocFromServer(doc(db, 'events', id)))),
            getDocsFromServer(query(collection(db, 'results'), where('status', '==', 'published'))).catch(() => ({ docs: [] }))
        ]);
        const events = new Map(eventDocuments.filter(item => item.exists()).map(item => [item.id, item.data()]));
        const results = publishedResults.docs.map(item => ({ id: item.id, ...item.data() }));
        renderEvents(registrations, events, results, card);
    } catch (error) {
        console.error(error);
        status.textContent = 'Card unavailable. Check your connection and scan again.';
    }
}

function showArtwork(source) {
    if (!source) return;
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const svg = parsed.documentElement;
    if (svg.nodeName.toLowerCase() !== 'svg' || svg.querySelector('parsererror,script,foreignObject')) return;
    svg.querySelectorAll('*').forEach(element => [...element.attributes].forEach(attribute => {
        if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name);
    }));
    const host = document.querySelector('#card-artwork');
    host.replaceChildren(document.importNode(svg, true));
    host.hidden = false;
}

function renderEvents(registrations, eventMap, results, card) {
    const list = document.querySelector('.event-list');
    const fallback = new Map((card.events || []).map(event => [event.id, event]));
    const rows = registrations.map(registration => {
        const event = eventMap.get(registration.eventId) || registration.eventSnapshot || fallback.get(registration.eventId) || {};
        return { registration, event, result: memberResult(results, registration, card.memberId) };
    });
    for (const { registration, event, result } of rows) {
        const item = document.createElement('li');
        const name = document.createElement('div');
        name.className = 'event-name';
        name.textContent = event.name || registration.eventName || 'Event';
        const meta = document.createElement('small');
        meta.className = 'event-meta';
        meta.textContent = [event.category, event.scheduleStage || event.stage, event.scheduleDate, event.time].filter(Boolean).join(' · ');
        item.append(name, meta);
        if (result) {
            const badge = document.createElement('span');
            badge.className = 'result';
            badge.textContent = result;
            item.append(badge);
        }
        list.append(item);
    }
    if (!rows.length) {
        const empty = document.createElement('li');
        empty.className = 'empty';
        empty.textContent = 'No registered events.';
        list.append(empty);
    }
    document.querySelector('section').hidden = false;
}

function memberResult(results, registration, memberId) {
    const result = results.find(item => item.eventId === registration.eventId);
    if (!result) return '';
    const memberKeys = new Set([memberId, registration.id, String(registration.slotIndex || '')].filter(Boolean));
    const awards = (result.places || []).map((place, index) => ({
        label: place.label || place.name || ['First place', 'Second place', 'Third place'][index] || `Place ${index + 1}`,
        winners: place.winners || []
    }));
    for (const key of ['first', 'second', 'third']) {
        const winners = result.winners?.[key];
        if (winners) awards.push({ label: key[0].toUpperCase() + key.slice(1) + ' place', winners: Array.isArray(winners) ? winners : [winners] });
    }
    const award = awards.find(item => item.winners.some(winner => memberKeys.has(String(winner?.id || winner?.studentId || winner?.participantId || winner))));
    return award?.label || '';
}
