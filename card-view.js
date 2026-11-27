const token = location.hash.slice(1);
if (/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(token)) {
    const status = document.querySelector('#details');
    status.textContent = 'Loading card…';
    try {
        const [{db}, {doc,getDocFromServer}] = await Promise.all([
            import('./firebase-config.js'),
            import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
        ]);
        const snapshot = await getDocFromServer(doc(db, 'cardPasses', token));
        if (!snapshot.exists()) throw new Error();
        const card = snapshot.data();
        document.querySelector('#festival').textContent = card.festival;
        document.querySelector('#person').textContent = card.name;
        status.textContent = [card.chest && 'Chest ' + card.chest, card.team, card.category].filter(Boolean).join(' · ');
        const list = document.querySelector('ul');
        for (const event of card.events) {
            const item = document.createElement('li');
            const meta = document.createElement('small');
            meta.textContent = [event.stage,event.time].filter(Boolean).join(' · ');
            item.append(event.name,meta);
            list.append(item);
        }
        if (!card.events.length) list.textContent = 'No registered events.';
        document.querySelector('section').hidden = false;
    } catch {
        status.textContent = 'Card unavailable. Check your connection and scan again.';
    }
}
