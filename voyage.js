document.addEventListener('DOMContentLoaded', function () {
    const SK = 'voyage_trips_data';
    let currentTripId = localStorage.getItem('last_trip_id') || null;

    // Funções de utilidade
    const el = id => document.getElementById(id);
    const getDays = ds => {
        if (!ds) return '--';
        const t = new Date().setHours(0,0,0,0);
        const g = new Date(ds + 'T00:00:00').setHours(0,0,0,0);
        return Math.round((g - t) / 86400000);
    };

    function render() {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        const ids = Object.keys(trips);
        
        if (!currentTripId && ids.length > 0) currentTripId = ids[0];
        renderTabs(trips);

        const t = trips[currentTripId];
        if (!t) return;

        // Preenche campos do Ticket
        el('l1-origin').textContent = (t.originCode || '---').toUpperCase();
        el('l1-dest').textContent = (t.destCode || '---').toUpperCase();
        el('l1-flight').textContent = t.flight || '--';
        el('l1-gate').textContent = t.gate || '--';
        el('l1-class-det').textContent = (t.classType || 'ECONOMY').toUpperCase();
        el('l1-badge-class').textContent = (t.classType || 'ECONOMY').toUpperCase();
        el('l1-seat-main').textContent = t.seat || '--';
        el('l1-days-go').textContent = getDays(t.dateGo);
        el('l1-dest-full').textContent = t.tripName || '--';
        el('l1-date-go-txt').textContent = t.dateGo || '--';

        // Processa Passageiros
        const list = el('l1-pnames-list');
        list.innerHTML = '';
        const pLines = (t.passengers || '').split('\n').filter(l => l.trim() !== '');
        
        pLines.forEach(line => {
            const parts = line.split('-');
            const nome = parts[0] ? parts[0].trim() : 'Passageiro';
            const assento = parts[1] ? parts[1].trim() : '--';
            
            const div = document.createElement('div');
            div.className = 'l1-prow';
            div.innerHTML = `<span>${nome}</span><span class="p-seat">${assento}</span>`;
            list.appendChild(div);
        });
    }

    function renderTabs(trips) {
        const container = el('tripTabs');
        container.innerHTML = '';
        Object.keys(trips).forEach(id => {
            const btn = document.createElement('button');
            btn.className = 'trip-tab' + (id === currentTripId ? ' active' : '');
            btn.textContent = trips[id].tripName;
            btn.onclick = () => { currentTripId = id; localStorage.setItem('last_trip_id', id); render(); };
            container.appendChild(btn);
        });
        const add = document.createElement('button');
        add.className = 'trip-tab-add';
        add.textContent = '+';
        add.onclick = () => openModal();
        container.appendChild(add);
    }

    function openModal(isEdit = false) {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        const t = isEdit ? trips[currentTripId] : {};

        el('inp-tripname').value = t.tripName || '';
        el('inp-ocode').value = t.originCode || '';
        el('inp-dcode').value = t.destCode || '';
        el('inp-flight').value = t.flight || '';
        el('inp-class').value = t.classType || '';
        el('inp-gate').value = t.gate || '';
        el('inp-seat').value = t.seat || '';
        el('inp-date-go').value = t.dateGo || '';
        el('inp-passengers').value = t.passengers || '';

        el('modalOverlay').classList.add('open');
        el('deleteBtn').style.display = isEdit ? 'block' : 'none';
    }

    el('saveBtn').onclick = () => {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        const id = currentTripId && el('deleteBtn').style.display === 'block' ? currentTripId : Date.now().toString();
        
        trips[id] = {
            tripName: el('inp-tripname').value,
            originCode: el('inp-ocode').value,
            destCode: el('inp-dcode').value,
            flight: el('inp-flight').value,
            classType: el('inp-class').value,
            gate: el('inp-gate').value,
            seat: el('inp-seat').value,
            dateGo: el('inp-date-go').value,
            passengers: el('inp-passengers').value
        };

        localStorage.setItem(SK, JSON.stringify(trips));
        currentTripId = id;
        el('modalOverlay').classList.remove('open');
        render();
    };

    el('editBtn').onclick = () => openModal(true);
    el('closeModal').onclick = () => el('modalOverlay').classList.remove('open');
    
    el('deleteBtn').onclick = () => {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        delete trips[currentTripId];
        localStorage.setItem(SK, JSON.stringify(trips));
        currentTripId = null;
        el('modalOverlay').classList.remove('open');
        render();
    };

    render();
});
