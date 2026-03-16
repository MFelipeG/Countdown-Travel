document.addEventListener('DOMContentLoaded', function () {
    const SK = 'voyage_trips_data_v3';
    let currentTripId = localStorage.getItem('last_trip_id') || null;

    const el = id => document.getElementById(id);

    // Função para calcular dias restantes
    function getDays(dateString) {
        if (!dateString) return '--';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateString + 'T00:00:00');
        target.setHours(0, 0, 0, 0);
        const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
        return diff < 0 ? "0" : diff;
    }

    // Formata data de YYYY-MM-DD para DD/MM/YY
    function formatDate(ds) {
        if (!ds) return '--/--/--';
        const [y, m, d] = ds.split('-');
        return `${d}/${m}/${y.slice(-2)}`;
    }

    function render() {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        const ids = Object.keys(trips);
        
        if (!currentTripId && ids.length > 0) currentTripId = ids[0];
        if (ids.length === 0) {
            openModal(false);
            return;
        }

        const t = trips[currentTripId];
        const daysGo = getDays(t.dateGo);

        // --- ATUALIZA LAYOUT 1 (Boarding Pass) ---
        el('l1-origin').textContent = (t.originCode || '---').toUpperCase();
        el('l1-dest').textContent = (t.destCode || '---').toUpperCase();
        el('l1-flight').textContent = (t.flight || '--').toUpperCase();
        el('l1-gate-det').textContent = (t.gate || '--').toUpperCase();
        el('l1-seat-main').textContent = (t.seat || '--').toUpperCase();
        el('l1-badge-class').textContent = (t.classType || 'ECONOMY').toUpperCase();
        el('l1-days-go').textContent = daysGo;
        el('l1-date-go').textContent = formatDate(t.dateGo);
        el('l1-date-ret').textContent = formatDate(t.dateRet);

        // Lista de Passageiros L1
        const list = el('l1-pnames-list');
        list.innerHTML = '';
        const lines = (t.passengers || '').split('\n').filter(l => l.trim() !== '');
        lines.forEach(line => {
            const [nome, assento] = line.split('-').map(s => s.trim());
            list.innerHTML += `
                <div class="l1-prow">
                    <span>${nome || 'Passageiro'}</span>
                    <span class="p-seat">${assento || '--'}</span>
                </div>`;
        });

        // --- ATUALIZA LAYOUT 2 (Neon) ---
        el('l2-dest-city').textContent = (t.tripName || 'DESTINATION').toUpperCase();
        el('l2-days-go').textContent = daysGo;

        // --- ATUALIZA LAYOUT 3 (Golden) ---
        el('l3-trip-name').textContent = t.tripName || 'My Voyage';
        el('l3-days-go').textContent = daysGo;

        renderTabs(trips);
    }

    function renderTabs(trips) {
        const container = el('tripTabs');
        container.innerHTML = '';
        Object.keys(trips).forEach(id => {
            const btn = document.createElement('button');
            btn.className = 'trip-tab' + (id === currentTripId ? ' active' : '');
            btn.textContent = trips[id].tripName || 'Trip';
            btn.onclick = () => { 
                currentTripId = id; 
                localStorage.setItem('last_trip_id', id); 
                render(); 
            };
            container.appendChild(btn);
        });

        const add = document.createElement('button');
        add.className = 'trip-tab-add';
        add.textContent = '+';
        add.onclick = () => openModal(false);
        container.appendChild(add);
    }

    window.openModal = function(isEdit) {
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
        el('inp-date-ret').value = t.dateRet || '';
        el('inp-passengers').value = t.passengers || '';

        el('deleteBtn').style.display = isEdit ? 'block' : 'none';
        el('modalOverlay').classList.add('open');
    };

    el('saveBtn').onclick = () => {
        const trips = JSON.parse(localStorage.getItem(SK) || '{}');
        const id = el('deleteBtn').style.display === 'block' ? currentTripId : Date.now().toString();

        trips[id] = {
            tripName: el('inp-tripname').value,
            originCode: el('inp-ocode').value,
            destCode: el('inp-dcode').value,
            flight: el('inp-flight').value,
            classType: el('inp-class').value,
            gate: el('inp-gate').value,
            seat: el('inp-seat').value,
            dateGo: el('inp-date-go').value,
            dateRet: el('inp-date-ret').value,
            passengers: el('inp-passengers').value
        };

        localStorage.setItem(SK, JSON.stringify(trips));
        currentTripId = id;
        localStorage.setItem('last_trip_id', id);
        el('modalOverlay').classList.remove('open');
        render();
    };

    el('deleteBtn').onclick = () => {
        if(confirm('Apagar esta viagem?')) {
            const trips = JSON.parse(localStorage.getItem(SK) || '{}');
            delete trips[currentTripId];
            localStorage.setItem(SK, JSON.stringify(trips));
            currentTripId = Object.keys(trips)[0] || null;
            el('modalOverlay').classList.remove('open');
            render();
        }
    };

    // Alternador de Layouts
    [1, 2, 3].forEach(n => {
        el(`sw${n}`).onclick = () => {
            document.querySelectorAll('.widget-wrap').forEach(w => w.classList.remove('active'));
            document.querySelectorAll('.sw-btn').forEach(b => b.classList.remove('active'));
            el(`layout${n}`).classList.add('active');
            el(`sw${n}`).classList.add('active');
        };
    });

    render();
});
