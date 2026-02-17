const App = {
    // State
    data: { user: null, txs: [], budget: 0 },
    view: 'dashboard',
    chart: null,
    
    // Categories
    cats: {
        income: ['Salary', 'Business', 'Freelance', 'Investments', 'Rental', 'Refunds', 'Other'],
        expense: ['Food & Dining', 'Groceries', 'Transport', 'Bills & Utilities', 'Shopping', 'Health', 'Education', 'Travel', 'Entertainment']
    },

    // --- INITIALIZATION ---
    init() {
        const session = localStorage.getItem('sm_session');
        if (session) {
            this.data.user = JSON.parse(session);
            this.loadData();
            this.showApp();
        } else {
            document.getElementById('auth-screen').classList.remove('hidden');
        }
        lucide.createIcons();
    },

    loadData() {
        const all = JSON.parse(localStorage.getItem('sm_data')) || [];
        this.data.txs = all.filter(t => t.uid === this.data.user.email);
        
        // Update Sidebar
        const nameEl = document.getElementById('sidebar-name');
        const avatarEl = document.getElementById('sidebar-avatar');
        if(nameEl) nameEl.innerText = this.data.user.name;
        if(avatarEl) avatarEl.innerText = this.data.user.name.charAt(0).toUpperCase();
    },

    saveData() {
        let all = JSON.parse(localStorage.getItem('sm_data')) || [];
        all = all.filter(t => t.uid !== this.data.user.email);
        all = [...all, ...this.data.txs];
        localStorage.setItem('sm_data', JSON.stringify(all));
        this.render();
    },

    // --- AUTHENTICATION ---
    toggleAuth(view) {
        document.getElementById('login-view').classList.toggle('hidden', view !== 'login');
        document.getElementById('signup-view').classList.toggle('hidden', view !== 'signup');
    },

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const users = JSON.parse(localStorage.getItem('sm_users')) || [];

        const user = users.find(u => u.email === email && u.pass === pass);
        if (user) {
            this.data.user = user;
            localStorage.setItem('sm_session', JSON.stringify(user));
            this.loadData();
            this.showApp();
            this.toast(`Welcome back, ${user.name.split(' ')[0]}`, 'success');
        } else {
            this.toast('Invalid credentials', 'error');
        }
    },

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-pass').value;
        const users = JSON.parse(localStorage.getItem('sm_users')) || [];

        if (users.find(u => u.email === email)) return this.toast('Email already exists', 'error');

        const newUser = { name, email, pass };
        users.push(newUser);
        localStorage.setItem('sm_users', JSON.stringify(users));
        this.toast('Account created! Please log in.', 'success');
        this.toggleAuth('login');
    },

    logout() {
        if(confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('sm_session');
            location.reload();
        }
    },

    // --- NAVIGATION ---
    showApp() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        this.navigate('dashboard');
    },

    navigate(page) {
        this.view = page;
        
        document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
        const nav = document.getElementById(`nav-${page}`);
        if(nav) nav.classList.add('active');
        
        this.render();
    },

    // --- MODALS ---
    openSmartModal() {
        const type = this.view === 'income' ? 'income' : 'expense';
        this.openModal(type);
    },

    openModal(type, id = null) {
        const modal = document.getElementById('tx-modal');
        const card = document.getElementById('modal-card');
        
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); card.classList.remove('translate-y-full'); }, 10);

        const cats = type === 'income' ? this.cats.income : this.cats.expense;
        
        document.getElementById('inp-category').innerHTML = cats.map(c => `<option>${c}</option>`).join('');
        document.getElementById('modal-title').innerText = id ? 'Edit Transaction' : `Add ${type === 'income' ? 'Income' : 'Expense'}`;
        
        const btn = document.getElementById('btn-save');
        btn.innerText = id ? 'Update Record' : 'Save Record';
        btn.className = `w-full ${type==='income'?'bg-emerald-600 hover:bg-emerald-700':'bg-rose-600 hover:bg-rose-700'} text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2`;
        
        // Reset or Fill
        if(id) {
            const tx = this.data.txs.find(t => t.id === id);
            document.getElementById('inp-id').value = tx.id;
            document.getElementById('inp-type').value = tx.type;
            document.getElementById('inp-amount').value = tx.amount;
            document.getElementById('inp-category').value = tx.category;
            document.getElementById('inp-date').value = tx.date;
            document.getElementById('inp-desc').value = tx.desc;
        } else {
            document.getElementById('inp-id').value = '';
            document.getElementById('inp-type').value = type;
            document.getElementById('inp-amount').value = '';
            document.getElementById('inp-date').valueAsDate = new Date();
            document.getElementById('inp-desc').value = '';
        }
    },

    closeModal() {
        const modal = document.getElementById('tx-modal');
        const card = document.getElementById('modal-card');
        modal.classList.add('opacity-0');
        card.classList.add('translate-y-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    },

    saveTransaction(e) {
        e.preventDefault();
        const id = document.getElementById('inp-id').value;
        const type = document.getElementById('inp-type').value;
        const amount = parseFloat(document.getElementById('inp-amount').value);
        const category = document.getElementById('inp-category').value;
        const date = document.getElementById('inp-date').value;
        const desc = document.getElementById('inp-desc').value;

        if (!amount) return this.toast('Please enter a valid amount', 'error');

        const tx = {
            id: id ? parseInt(id) : Date.now(),
            uid: this.data.user.email,
            type, amount, category, date, desc
        };

        if (id) {
            this.data.txs = this.data.txs.map(t => t.id == id ? tx : t);
            this.toast('Updated successfully', 'success');
        } else {
            this.data.txs.push(tx);
            this.toast('Saved successfully', 'success');
        }

        this.saveData();
        this.closeModal();
    },

    editTx(id) {
        const tx = this.data.txs.find(t => t.id === id);
        if(tx) this.openModal(tx.type, tx.id);
    },

    deleteTx(id) {
        if(confirm('Delete this record?')) {
            this.data.txs = this.data.txs.filter(t => t.id !== id);
            this.saveData();
            this.toast('Record deleted', 'default');
        }
    },

    // --- SETTINGS ---
    updateProfile(e) {
        e.preventDefault();
        const newName = document.getElementById('set-name').value;
        const newPass = document.getElementById('set-pass').value;

        this.data.user.name = newName;
        if(newPass) this.data.user.pass = newPass;

        let users = JSON.parse(localStorage.getItem('sm_users')) || [];
        users = users.map(u => u.email === this.data.user.email ? { ...u, name: newName, pass: newPass || u.pass } : u);
        localStorage.setItem('sm_users', JSON.stringify(users));
        localStorage.setItem('sm_session', JSON.stringify(this.data.user));
        
        this.loadData();
        this.toast('Profile updated', 'success');
        document.getElementById('set-pass').value = '';
    },

    clearData() {
        if(confirm('Delete ALL data? This cannot be undone.')) {
            this.data.txs = [];
            this.saveData();
            this.toast('All data cleared', 'default');
        }
    },

    // --- RENDER ---
    render() {
        const c = document.getElementById('main-view');
        c.innerHTML = '';
        
        if (this.view === 'dashboard') this.renderDash(c);
        else if (this.view === 'settings') this.renderSettings(c);
        else this.renderList(c, this.view);
        
        lucide.createIcons();
    },

    renderDash(c) {
        const inc = this.data.txs.filter(t => t.type === 'income').reduce((a,b)=>a+b.amount,0);
        const exp = this.data.txs.filter(t => t.type === 'expense').reduce((a,b)=>a+b.amount,0);
        const bal = inc - exp;

        c.innerHTML = `
        <div class="max-w-6xl mx-auto fade-in">
            <h1 class="text-3xl font-bold text-slate-900 mb-6">Dashboard</h1>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
                    <div class="relative z-10">
                        <p class="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Total Balance</p>
                        <h2 class="text-4xl font-bold tracking-tight">${this.fmt(bal)}</h2>
                    </div>
                    <i data-lucide="wallet" class="absolute -right-6 -bottom-6 w-40 h-40 text-slate-800 opacity-50 group-hover:scale-105 transition-transform duration-500"></i>
                </div>
                <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Income</p>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-900">${this.fmt(inc)}</h2>
                </div>
                <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                        <p class="text-slate-500 font-bold text-xs uppercase tracking-wider">Expenses</p>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-900">${this.fmt(exp)}</h2>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-lg mb-6">Spending Analysis</h3>
                    <div class="h-64 relative"><canvas id="chart"></canvas></div>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 class="font-bold text-lg mb-4">Recent Transactions</h3>
                    <div class="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1 custom-scroll">
                        ${this.data.txs.slice().reverse().slice(0,5).map(t => this.row(t)).join('') || '<p class="text-center text-slate-400 py-10 font-medium">No recent activity</p>'}
                    </div>
                </div>
            </div>
        </div>`;
        setTimeout(() => this.drawChart(), 50);
    },

    renderList(c, type) {
        const list = this.data.txs.filter(t => t.type === type).reverse();
        const total = list.reduce((a,b)=>a+b.amount,0);
        const color = type === 'income' ? 'emerald' : 'rose';

        c.innerHTML = `
        <div class="max-w-5xl mx-auto fade-in">
            <div class="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
                <div>
                    <h1 class="text-3xl font-bold capitalize text-slate-900">${type}s</h1>
                    <p class="text-slate-500 font-bold mt-1">Total: <span class="text-${color}-600">${this.fmt(total)}</span></p>
                </div>
                <button onclick="App.openModal('${type}')" class="bg-${color}-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 flex items-center gap-2 transition-all"><i data-lucide="plus" class="w-5 h-5"></i> Add New</button>
            </div>
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px]">
                <div class="divide-y divide-slate-50">
                    ${list.map(t => this.row(t, true)).join('') || '<div class="p-12 text-center text-slate-400 font-bold">No records found.</div>'}
                </div>
            </div>
        </div>`;
    },

    renderSettings(c) {
        c.innerHTML = `
        <div class="max-w-3xl mx-auto fade-in pb-10">
            <h1 class="text-3xl font-bold text-slate-900 mb-6">Settings</h1>
            
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
                <h2 class="text-lg font-bold mb-6 flex items-center gap-2">Profile & Security</h2>
                <form onsubmit="App.updateProfile(event)" class="space-y-5">
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-500 mb-2">Display Name</label>
                        <input type="text" id="set-name" value="${this.data.user.name}" required class="input-field">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-500 mb-2">New Password <span class="text-slate-300 font-medium normal-case">(Optional)</span></label>
                        <input type="password" id="set-pass" class="input-field" placeholder="••••••••">
                    </div>
                    <div class="pt-2">
                        <button type="submit" class="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">Save Changes</button>
                    </div>
                </form>
            </div>
            
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
                <h2 class="text-lg font-bold mb-6 text-rose-600">Danger Zone</h2>
                <div class="flex items-center justify-between p-5 bg-rose-50 rounded-2xl border border-rose-100">
                    <div>
                        <p class="font-bold text-rose-900">Reset All Data</p>
                        <p class="text-sm text-rose-600/80">Permanently delete all transactions.</p>
                    </div>
                    <button onclick="App.clearData()" class="bg-white text-rose-600 border border-rose-200 px-4 py-2 rounded-lg font-bold hover:bg-rose-100 transition">Clear Data</button>
                </div>
            </div>
            
            <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mb-6">
                <h2 class="text-lg font-bold mb-4">Session</h2>
                <button onclick="App.logout()" class="w-full border border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 hover:text-rose-600 transition flex items-center justify-center gap-2">Sign Out <i data-lucide="log-out" class="w-4 h-4"></i></button>
            </div>
        </div>`;
    },

    row(t, actions = false) {
        const isInc = t.type === 'income';
        const col = isInc ? 'emerald' : 'rose';
        const icon = isInc ? 'trending-up' : 'shopping-bag';
        return `
        <div class="flex items-center justify-between p-4 hover:bg-slate-50 transition group">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-${col}-50 text-${col}-600 flex items-center justify-center"><i data-lucide="${icon}"></i></div>
                <div class="min-w-0">
                    <p class="font-bold text-slate-900 truncate">${t.desc || t.category}</p>
                    <p class="text-xs text-slate-500 font-bold">${t.category} • ${t.date}</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="font-bold text-${col}-600 text-lg whitespace-nowrap">${isInc?'+':'-'}${this.fmt(t.amount)}</span>
                ${actions ? `
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="App.editTx(${t.id})" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="App.deleteTx(${t.id})" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>` : ''}
            </div>
        </div>`;
    },

    // --- UTILS ---
    fmt(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); },
    
    drawChart() {
        const ctx = document.getElementById('chart');
        if(!ctx) return;
        if(this.chart) this.chart.destroy();
        const cats = {};
        this.data.txs.filter(t => t.type === 'expense').forEach(t => cats[t.category] = (cats[t.category]||0)+t.amount);
        
        if(Object.keys(cats).length === 0) {
            ctx.parentNode.innerHTML = '<div class="flex h-full items-center justify-center text-slate-400 font-medium">No expenses to display</div>';
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(cats),
                datasets: [{ data: Object.values(cats), backgroundColor: ['#6366f1','#ec4899','#10b981','#f59e0b','#ef4444','#06b6d4'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { usePointStyle: true, font: {family: 'Plus Jakarta Sans', weight: '600'} } } }, cutout: '75%' }
        });
    },

    toast(msg, type) {
        const b = document.getElementById('toast-box');
        const t = document.createElement('div');
        const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        t.className = 'toast';
        t.style.borderLeftColor = color;
        t.innerHTML = `<i data-lucide="${type==='success'?'check-circle':type==='error'?'alert-circle':'info'}" style="color:${color}"></i> <span class="text-slate-800">${msg}</span>`;
        b.appendChild(t);
        lucide.createIcons();
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; setTimeout(() => t.remove(), 300); }, 3000);
    }
};

window.onload = () => App.init();
