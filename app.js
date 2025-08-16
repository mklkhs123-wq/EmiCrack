const API_BASE = ''; // same origin
let TOKEN = localStorage.getItem('sfh_token') || '';

document.addEventListener('DOMContentLoaded', ()=>{
  setupNav();
  setupCalcTabs();
  loadCompanies();
  loadNews();
  setupAuthModal();
  setupPayButtons();
  if(TOKEN) showLoggedIn();
});

function setupNav(){
  document.querySelectorAll('header nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('header nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.querySelectorAll('main .tab').forEach(t=>t.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
    });
  });
}

// Calculators
function setupCalcTabs(){
  document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderCalcForm(b.dataset.type);
  }));
  renderCalcForm('emi');
}

function renderCalcForm(type){
  const form = document.getElementById('calcForm');
  const result = document.getElementById('calcResult');
  result.innerHTML = '';
  if(type === 'emi'){
    form.innerHTML = `
      <label>Loan Amount (₹)<input id="loanAmount" type="number" value="500000"></label>
      <label>Annual Rate (%)<input id="annualRate" type="number" step="0.01" value="9"></label>
      <label>Tenure (months)<input id="tenureMonths" type="number" value="60"></label>
      <div class="row"><button id="calcEmiBtn">Calculate EMI</button></div>
    `;
    document.getElementById('calcEmiBtn').addEventListener('click', ()=>{
      const P = Number(document.getElementById('loanAmount').value)||0;
      const annual = Number(document.getElementById('annualRate').value)||9;
      const n = Number(document.getElementById('tenureMonths').value)||60;
      const r = annual/1200;
      const emi = (P * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
      const total = emi*n; const interest = total - P;
      result.innerHTML = `<h4>Results</h4><p><strong>EMI:</strong> ₹${emi.toFixed(2)}</p><p><strong>Total Interest:</strong> ₹${interest.toFixed(2)}</p><p><strong>Total Payment:</strong> ₹${total.toFixed(2)}</p><canvas id="emiChart" width="300" height="200"></canvas>`;
      // draw chart
      const ctx = document.getElementById('emiChart').getContext('2d');
      new Chart(ctx, { type:'doughnut', data:{ labels:['Principal','Interest'], datasets:[{ data:[P, interest] }] } });
    });
  } else if(type === 'fd'){
    form.innerHTML = `
      <label>Principal (₹)<input id="fdP" type="number" value="100000"></label>
      <label>Annual Rate (%)<input id="fdR" type="number" step="0.01" value="6.5"></label>
      <label>Years<input id="fdT" type="number" value="5"></label>
      <div class="row"><button id="calcFdBtn">Calculate FD</button></div>
    `;
    document.getElementById('calcFdBtn').addEventListener('click', ()=>{
      const P = Number(document.getElementById('fdP').value)||0; const r = Number(document.getElementById('fdR').value)/100; const t = Number(document.getElementById('fdT').value)||1;
      const maturity = P * Math.pow(1+r, t);
      const interest = maturity - P;
      result.innerHTML = `<h4>Results</h4><p><strong>Maturity:</strong> ₹${maturity.toFixed(2)}</p><p><strong>Interest:</strong> ₹${interest.toFixed(2)}</p>`;
    });
  } else if(type === 'sip'){
    form.innerHTML = `
      <label>Monthly SIP (₹)<input id="sipM" type="number" value="5000"></label>
      <label>Annual Return (%)<input id="sipR" type="number" step="0.01" value="12"></label>
      <label>Years<input id="sipT" type="number" value="10"></label>
      <div class="row"><button id="calcSipBtn">Calculate SIP</button></div>
    `;
    document.getElementById('calcSipBtn').addEventListener('click', ()=>{
      const PMT = Number(document.getElementById('sipM').value)||0; const r = Number(document.getElementById('sipR').value)/100/12; const n = Number(document.getElementById('sipT').value)*12||0;
      let amount = 0; if(r===0) amount = PMT*n; else amount = PMT * ((Math.pow(1+r,n)-1)/r) * (1+r);
      const invested = PMT * n; result.innerHTML = `<h4>Results</h4><p><strong>Maturity:</strong> ₹${amount.toFixed(2)}</p><p><strong>Invested:</strong> ₹${invested.toFixed(2)}</p><p><strong>Gain:</strong> ₹${(amount-invested).toFixed(2)}</p><canvas id="sipChart" width="300" height="200"></canvas>`;
      const ctx = document.getElementById('sipChart').getContext('2d'); new Chart(ctx, { type:'bar', data:{ labels:['Invested','Maturity'], datasets:[{ data:[invested, amount] }] } });
    });
  } else if(type === 'ppf'){
    form.innerHTML = `
      <label>Annual Deposit (₹)<input id="ppfA" type="number" value="150000"></label>
      <label>Annual Rate (%)<input id="ppfR" type="number" step="0.01" value="7.1"></label>
      <label>Years<input id="ppfT" type="number" value="15"></label>
      <div class="row"><button id="calcPpfBtn">Calculate PPF</button></div>
    `;
    document.getElementById('calcPpfBtn').addEventListener('click', ()=>{
      const A = Number(document.getElementById('ppfA').value)||0; const r = Number(document.getElementById('ppfR').value)/100; const n = Number(document.getElementById('ppfT').value)||15;
      // simplified annual compounding for lump-sum estimate
      const amount = A * Math.pow(1+r, n);
      result.innerHTML = `<h4>Results</h4><p><strong>Estimated Maturity:</strong> ₹${amount.toFixed(2)}</p>`;
    });
  } else if(type === 'rd'){
    form.innerHTML = `
      <label>Monthly Deposit (₹)<input id="rdM" type="number" value="2000"></label>
      <label>Annual Rate (%)<input id="rdR" type="number" step="0.01" value="6.75"></label>
      <label>Months<input id="rdT" type="number" value="60"></label>
      <div class="row"><button id="calcRdBtn">Calculate RD</button></div>
    `;
    document.getElementById('calcRdBtn').addEventListener('click', ()=>{
      const PMT = Number(document.getElementById('rdM').value)||0; const r = Number(document.getElementById('rdR').value)/100/12; const n = Number(document.getElementById('rdT').value)||0;
      const amount = PMT * n + PMT * r * (n*(n+1)/2);
      result.innerHTML = `<h4>Results</h4><p><strong>Maturity:</strong> ₹${amount.toFixed(2)}</p>`;
    });
  }
}

// Companies and News
async function loadCompanies(){
  const resp = await fetch('/api/companies');
  const list = await resp.json();
  const select = document.getElementById('companySelect');
  const container = document.getElementById('companiesList');
  select.innerHTML = '<option value="">Select</option>';
  container.innerHTML = '';
  list.forEach(c=>{
    const opt = document.createElement('option'); opt.value = c.id; opt.text = c.name; select.appendChild(opt);
    const card = document.createElement('div'); card.className='company-card'; card.innerHTML = `<div><strong>${c.name}</strong><div class="muted">${c.note||''}</div></div><div><button onclick="openCompany('${c.id}')">Visit</button></div>`;
    container.appendChild(card);
  });
}

async function loadNews(){
  const resp = await fetch('/api/news');
  const list = await resp.json();
  const container = document.getElementById('newsList');
  container.innerHTML = '';
  list.forEach(a=>{
    const el = document.createElement('div'); el.className='company-card'; el.innerHTML = `<div><strong>${a.title}</strong><div class="muted">${a.source} - ${new Date(a.publishedAt).toLocaleString()}</div></div><div><button onclick="window.open('${a.url}','_blank')">Open</button></div>`;
    container.appendChild(el);
  });
}

// Payments: UPI, Gateway, Redirect
function setupPayButtons(){
  document.getElementById('payWithUpi').addEventListener('click', ()=>{
    const companyId = document.getElementById('companySelect').value;
    const loan = document.getElementById('loanNumber').value.trim();
    const amount = document.getElementById('payAmount').value;
    if(!companyId || !loan || !amount){ alert('सब fields भरेँ'); return; }
    // Build UPI URI
    const upiId = prompt('Enter merchant UPI ID (e.g., pay@bank) for the company (or leave blank to copy link):','merchant@upi');
    const pa = encodeURIComponent(upiId || 'merchant@upi');
    const pn = encodeURIComponent('Smart Finance Payment');
    const am = encodeURIComponent(amount);
    const tn = encodeURIComponent('EMI Payment - ' + loan);
    const upi = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${tn}&cu=INR`;
    // Try to open - will work on mobile with UPI apps
    window.location.href = upi;
    document.getElementById('payStatus').innerText = 'UPI link launched / copied: ' + upi;
  });

  document.getElementById('payWithGateway').addEventListener('click', async ()=>{
    if(!TOKEN){ alert('कृपया login करें'); return; }
    const companyId = document.getElementById('companySelect').value;
    const loan = document.getElementById('loanNumber').value.trim();
    const amount = Number(document.getElementById('payAmount').value);
    if(!companyId || !loan || !amount){ alert('सब fields भरेँ'); return; }
    const paise = Math.round(amount*100);
    const resp = await fetch('/api/create-order', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, body: JSON.stringify({ companyId, loanNumber: loan, amountPaise: paise }) });
    const j = await resp.json();
    if(j.error) return alert('Order creation failed: '+j.error);
    const order = j.order;
    const options = { key: j.razorpayKey || '', amount: order.amount, currency: order.currency, name: j.paymentId || 'EMI', description:'EMI Payment', order_id: order.id, handler: async function(respHandler){ const verify = await fetch('/api/verify-payment', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN}, body: JSON.stringify(respHandler) }); const v = await verify.json(); if(v.error) return alert('Verification failed: '+v.error); alert('Payment verified!'); loadUserPayments(); }, prefill:{}, notes:{companyId: companyId, loanNumber: loan}, modal:{escape:true} };
    if(typeof Razorpay === 'undefined'){ alert('Razorpay script not loaded'); return; }
    const rzp = new Razorpay(options); rzp.open();
  });

  document.getElementById('redirectToCompany').addEventListener('click', async ()=>{
    const companyId = document.getElementById('companySelect').value;
    const loan = document.getElementById('loanNumber').value.trim();
    if(!companyId || !loan){ alert('Select company and enter loan'); return; }
    const resp = await fetch('/api/pay', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ companyId, loanNumber: loan }) });
    const j = await resp.json();
    if(j.error) return alert('Error: '+j.error);
    window.open(j.redirectUrl, '_blank');
  });
}

// Auth modal
function setupAuthModal(){
  document.getElementById('btnShowLogin').addEventListener('click', ()=> document.getElementById('loginModal').style.display='flex');
  document.getElementById('modalClose').addEventListener('click', ()=> document.getElementById('loginModal').style.display='none');
  document.getElementById('modalRegister').addEventListener('click', async ()=>{
    const name = document.getElementById('modalName').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    const password = document.getElementById('modalPassword').value;
    const res = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name,email,password }) });
    const j = await res.json(); if(j.error) return document.getElementById('modalMsg').innerText = j.error;
    TOKEN = j.token; localStorage.setItem('sfh_token', TOKEN); document.getElementById('loginModal').style.display='none'; showLoggedIn(); loadUserPayments();
  });
  document.getElementById('modalLogin').addEventListener('click', async ()=>{
    const email = document.getElementById('modalEmail').value.trim();
    const password = document.getElementById('modalPassword').value;
    const res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email,password }) });
    const j = await res.json(); if(j.error) return document.getElementById('modalMsg').innerText = j.error;
    TOKEN = j.token; localStorage.setItem('sfh_token', TOKEN); document.getElementById('loginModal').style.display='none'; showLoggedIn(); loadUserPayments();
  });
}

function showLoggedIn(){
  const authArea = document.getElementById('authArea');
  authArea.innerHTML = `<span id="userInfo">Logged in</span> <button id="btnLogout">Logout</button>`;
  document.getElementById('btnLogout').addEventListener('click', ()=>{ TOKEN=''; localStorage.removeItem('sfh_token'); location.reload(); });
  loadUserPayments();
}

async function loadUserPayments(){
  if(!TOKEN) return;
  const resp = await fetch('/api/payments', { headers:{ 'Authorization':'Bearer '+TOKEN } });
  const list = await resp.json();
  const container = document.getElementById('paymentsList');
  if(!container) return;
  container.innerHTML = '';
  list.forEach(p=>{
    const el = document.createElement('div'); el.className='company-card'; el.innerHTML = `<div><strong>${p.companyName}</strong><div class="muted">Loan: ${p.loanNumber} | ₹${(p.amountPaise/100).toFixed(2)} | ${p.status}</div></div>`;
    container.appendChild(el);
  });
}

function openCompany(id){ window.open('/api/pay?companyId='+encodeURIComponent(id),'_blank'); }