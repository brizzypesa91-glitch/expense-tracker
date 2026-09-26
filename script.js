const $=id=>document.getElementById(id);
let usersDatabase=JSON.parse(localStorage.getItem('usersDatabase')||'[]');let currentUser=JSON.parse(localStorage.getItem('currentUser')||'null');let transactions=JSON.parse(localStorage.getItem('transactions')||'[]');
const categories={income:['Salary','Freelance','Business','Gift','Other Income'],expense:['Food & Drinks','Transport','Utilities','Shopping','Entertainment','Health','Education','Bills','Other'],savings:['Emergency Fund','New Home','Travel','Education','Investment','Other Goal']};
const fmt=n=>'TZS '+Number(n||0).toLocaleString('en-US');
const saveSession=()=>{localStorage.setItem('currentUser',JSON.stringify(currentUser));usersDatabase=usersDatabase.map(u=>u.username.toLowerCase()===currentUser.username.toLowerCase()?currentUser:u);localStorage.setItem('usersDatabase',JSON.stringify(usersDatabase))};
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('toast-container').appendChild(t);setTimeout(()=>t.remove(),2800)}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function greeting(){const h=new Date().getHours();return h>=5&&h<12?'Good morning':h>=12&&h<17?'Good afternoon':h>=17&&h<22?'Good evening':'Good night'}
function updateGreeting(){const d=new Date();if($('user-display-name'))$('user-display-name').textContent=currentUser?.username||'User';if($('current-date'))$('current-date').textContent=d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function renderAvatar(){const html=currentUser?.profilePic?`<img src="${currentUser.profilePic}" alt="Profile">`:'<i class="fa-solid fa-user"></i>';['avatar-button','side-avatar','profile-avatar'].forEach(id=>{const el=$(id);if(el)el.innerHTML=html})}
function mine(){return transactions.filter(t=>t.username?.toLowerCase()===currentUser.username.toLowerCase())}
function updateBudgetUI(){const budget=Number(currentUser?.monthlyBudget||0);const spent=mine().filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount),0);const pct=budget?Math.min(100,(spent/budget)*100):0;const d=$('monthly-budget-display');const bar=$('monthly-budget-progress');const status=$('monthly-budget-status');if(d)d.textContent=fmt(budget);if(bar)bar.style.width=pct+'%';if(status)status.textContent=budget?`${pct.toFixed(0)}% used · ${fmt(Math.max(0,budget-spent))} remaining`:'Set your monthly budget.'}function updateDashboard(){if(!currentUser)return;const list=mine();let income=0,expense=0,savings=0;list.forEach(t=>{if(t.type==='income')income+=+t.amount;else if(t.type==='expense')expense+=+t.amount;else savings+=+t.amount});const balance=income-expense-savings;$('total-income').textContent=fmt(income);$('total-expense').textContent=fmt(expense);$('total-savings').textContent=fmt(savings);$('total-balance').textContent=fmt(balance);$('user-display-name').textContent=currentUser.username;$('side-user-name').textContent=currentUser.username;$('side-user-email').textContent=currentUser.email||'';$('profile-name').textContent=currentUser.username;$('profile-email').textContent=currentUser.email||'';renderAvatar();updateBudgetUI();renderTransactions('transaction-list',list.slice(-5).reverse(),true);const goal=currentUser.goal;if(goal){const p=Math.min(100,Math.max(0,(goal.saved/(goal.target||1))*100));$('goal-title-display').textContent=goal.title;$('goal-amount-display').textContent=`${fmt(goal.saved)} / ${fmt(goal.target)}`;$('goal-percentage').textContent=p.toFixed(0)+'%';$('goal-progress-bar').style.width=p+'%';$('goal-status-text').textContent=p>=100?'Goal reached. Great work.':`${fmt(Math.max(0,goal.target-goal.saved))} remaining to reach your goal.`}else{$('goal-title-display').textContent='Set a goal and stay focused.';$('goal-amount-display').textContent='TZS 0 / TZS 0';$('goal-percentage').textContent='0%';$('goal-progress-bar').style.width='0%';$('goal-status-text').textContent='Create your first savings goal.'}}
function renderTransactions(id,items,emptyToggle=false){const list=$(id);list.innerHTML='';items.forEach(item=>{const li=document.createElement('li');li.className='transaction-item';const icon=item.type==='income'?'fa-arrow-down':item.type==='expense'?'fa-arrow-up':'fa-piggy-bank';li.innerHTML=`<div class="trans-icon ${item.type}"><i class="fa-solid ${icon}"></i></div><div class="trans-info"><h4>${escapeHtml(item.desc)}</h4><span>${escapeHtml(item.category)} · ${new Date(item.createdAt||Date.now()).toLocaleDateString()}</span></div><div class="trans-amount ${item.type}">${item.type==='income'?'+':item.type==='expense'?'-':'+'} ${fmt(item.amount)}</div>`;list.appendChild(li)});if(emptyToggle)$('empty-transactions').classList.toggle('is-hidden',items.length>0);if(id==='all-transaction-list')$('all-empty').classList.toggle('is-hidden',items.length>0)}
function enterApp(){updateGreeting();$('auth-section').classList.add('is-hidden');$('dashboard-section').classList.remove('is-hidden');showView('home');updateDashboard();applyAppearance(localStorage.getItem('appearance')||'light')}
function leaveApp(){
  const auth=window.expenseTrackerAuth;
  const finish=()=>{
    currentUser=null;
    localStorage.removeItem('currentUser');
    $('dashboard-section').classList.add('is-hidden');
    $('auth-section').classList.add('is-hidden');
    $('welcome-screen').classList.remove('is-hidden');
    window.scrollTo({top:0,behavior:'auto'});
    toast('You have been logged out.');
  };
  if(auth) auth.signOut().finally(finish); else finish();
}
function openModal(id){$(id).classList.remove('is-hidden')}function closeModal(id){$(id).classList.add('is-hidden')}
function openAdd(){openModal('action-modal')}
function openTransaction(type='expense'){closeModal('action-modal');$('trans-type').value=type;populateCategories(type);$('transaction-modal-title').textContent=type==='income'?'Add Income':type==='expense'?'Add Expense':'Add Savings';$('transaction-modal-subtitle').textContent=type==='income'?'Record money you received.':type==='expense'?'Record money you spent.':'Add money toward your savings goal.';openModal('transaction-modal')}
function populateCategories(type){const select=$('trans-category');select.innerHTML=categories[type].map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
function openGoal(){closeModal('action-modal');const g=currentUser?.goal;if(g){$('goal-title-input').value=g.title;$('goal-target-input').value=g.target}else{$('goal-title-input').value='';$('goal-target-input').value=''}openModal('goal-modal')}
function showView(name){['home-view','transactions-view','budgets-view','profile-view'].forEach(id=>$(id).classList.toggle('is-hidden',id!==name+'-view'));document.querySelectorAll('.nav-item,.side-item[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='transactions')renderTransactions('all-transaction-list',mine().slice().reverse());if(name==='home')updateGreeting();closeSidebar();window.scrollTo({top:0,behavior:'smooth'})}
function openSidebar(){$('sidebar').classList.add('open');$('sidebar-backdrop').classList.add('show')}function closeSidebar(){$('sidebar').classList.remove('open');$('sidebar-backdrop').classList.remove('show')}
function applyAppearance(mode){const dark=mode==='dark';document.body.classList.toggle('dark',dark);localStorage.setItem('appearance',dark?'dark':'light');$('theme-toggle').innerHTML=`<i class="fa-solid fa-${dark?'sun':'moon'}"></i>`;$('sidebar-theme').innerHTML=`<i class="fa-solid fa-${dark?'sun':'moon'}"></i><span>${dark?'Light Mode':'Dark Mode'}</span>`;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=getComputedStyle(document.body).getPropertyValue('--theme-bg').trim()|| (dark?'#071522':'#f5fbff')}
function toggleTheme(e){document.body.classList.add('theme-transition','run');if(e){document.body.style.setProperty('--tx',e.clientX+'px');document.body.style.setProperty('--ty',e.clientY+'px')}const next=document.body.classList.contains('dark')?'light':'dark';setTimeout(()=>applyAppearance(next),90);setTimeout(()=>document.body.classList.remove('run'),760)}
$('welcome-continue').onclick=()=>{$('welcome-screen').classList.add('is-hidden');$('auth-section').classList.remove('is-hidden')};
$('btn-show-signup').onclick=()=>{$('login-box').classList.add('is-hidden');$('signup-box').classList.remove('is-hidden')};$('btn-show-login').onclick=()=>{$('signup-box').classList.add('is-hidden');$('login-box').classList.remove('is-hidden')};
$('login-form').onsubmit=e=>{e.preventDefault();const id=$('login-username').value.trim().toLowerCase(),pw=$('login-password').value;const u=usersDatabase.find(x=>(x.username.toLowerCase()===id||x.email?.toLowerCase()===id)&&x.password===pw);if(!u)return toast('Incorrect login details.');currentUser=u;localStorage.setItem('currentUser',JSON.stringify(u));e.target.reset();enterApp();toast(`Welcome back, ${u.username}.`)};
$('signup-form').onsubmit=e=>{e.preventDefault();const username=$('signup-username').value.trim(),email=$('signup-email').value.trim(),password=$('signup-password').value;if(password!==$('signup-confirm-password').value)return toast('Passwords do not match.');if(usersDatabase.some(u=>u.username.toLowerCase()===username.toLowerCase()))return toast('That username is already in use.');if(usersDatabase.some(u=>u.email?.toLowerCase()===email.toLowerCase()))return toast('That email is already registered.');const u={username,email,password,profilePic:'',goal:null};usersDatabase.push(u);localStorage.setItem('usersDatabase',JSON.stringify(usersDatabase));currentUser=u;localStorage.setItem('currentUser',JSON.stringify(u));e.target.reset();enterApp();toast(`Account created for ${username}.`)};
async function signInWithGoogle(){
  const auth=window.expenseTrackerAuth;
  if(!auth){toast('Firebase could not be initialized. Check your Firebase configuration.');return}

  const buttons=[$('google-login'),$('google-signup')].filter(Boolean);
  buttons.forEach(btn=>{btn.disabled=true;btn.dataset.originalText=btn.textContent.trim();btn.innerHTML='<span class="google-g"><i class="fa-brands fa-google"></i></span> Connecting to Google...'});

  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    const result=await auth.signInWithPopup(provider);
    const googleUser=result.user;
    const email=(googleUser.email||'').trim().toLowerCase();
    const displayName=(googleUser.displayName||email.split('@')[0]||'Google User').trim();

    // Reuse an existing local account with the same email, otherwise create a local profile
    // that points to the Firebase Google account. App data continues to work with the
    // existing local transaction/goal storage.
    let u=usersDatabase.find(x=>x.googleUid===googleUser.uid || (email && x.email?.toLowerCase()===email));
    if(!u){
      let username=displayName.replace(/\s+/g,' ').trim()||'Google User';
      const base=username;
      let suffix=2;
      while(usersDatabase.some(x=>x.username?.toLowerCase()===username.toLowerCase())) username=`${base} ${suffix++}`;
      u={username,email,googleUid:googleUser.uid,password:'',profilePic:googleUser.photoURL||'',goal:null};
      usersDatabase.push(u);
    }else{
      u.email=email||u.email||'';
      u.googleUid=googleUser.uid;
      if(googleUser.photoURL) u.profilePic=googleUser.photoURL;
      if(!u.username) u.username=displayName;
    }

    localStorage.setItem('usersDatabase',JSON.stringify(usersDatabase));
    currentUser=u;
    localStorage.setItem('currentUser',JSON.stringify(currentUser));
    enterApp();
    toast(`Welcome, ${currentUser.username}.`);
  }catch(error){
    console.error('Google Sign-In error:',error);
    const messages={
      'auth/popup-closed-by-user':'Google sign-in was cancelled.',
      'auth/popup-blocked':'Your browser blocked the Google sign-in window. Please allow pop-ups and try again.',
      'auth/unauthorized-domain':'This website domain is not authorized in Firebase Authentication.',
      'auth/operation-not-allowed':'Google Sign-In is not enabled in Firebase Authentication yet.',
      'auth/network-request-failed':'Network error. Check your internet connection and try again.'
    };
    toast(messages[error.code]||'Google Sign-In failed. Please try again.');
  }finally{
    buttons.forEach(btn=>{btn.disabled=false;btn.innerHTML='<span class="google-g"><i class="fa-brands fa-google"></i></span> Continue with Google'});
  }
}
['google-login','google-signup'].forEach(id=>$(id).onclick=signInWithGoogle);
document.querySelectorAll('.field-action').forEach(b=>b.onclick=()=>{const i=$(b.dataset.password);i.type=i.type==='password'?'text':'password';b.innerHTML=i.type==='password'?'<i class="fa-regular fa-eye"></i>':'<i class="fa-regular fa-eye-slash"></i>'});
function logout(){leaveApp()}
$('sidebar-logout').onclick=logout;$('profile-logout').onclick=logout;$('avatar-button').onclick=()=>$('profile-upload').click();$('profile-photo-btn').onclick=()=>$('profile-upload').click();$('profile-upload').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{currentUser.profilePic=r.result;saveSession();renderAvatar();toast('Profile photo updated.')};r.readAsDataURL(f)};
$('transaction-form').onsubmit=e=>{e.preventDefault();const type=$('trans-type').value,amount=+$('trans-amount').value;if(amount<=0)return toast('Enter a valid amount.');if(type==='savings'&&!currentUser.goal)return toast('Create a savings goal first.');const t={id:Date.now(),username:currentUser.username,type,category:$('trans-category').value,desc:$('trans-desc').value.trim(),amount,createdAt:Date.now()};transactions.push(t);localStorage.setItem('transactions',JSON.stringify(transactions));$('transaction-form').reset();closeModal('transaction-modal');updateDashboard();toast(`${type==='income'?'Income':type==='expense'?'Expense':'Savings'} saved.`)};
$('goal-form').onsubmit=e=>{e.preventDefault();const title=$('goal-title-input').value.trim(),target=+$('goal-target-input').value;if(target<=0)return toast('Enter a valid target amount.');currentUser.goal={title,target,saved:currentUser.goal?.saved||0};saveSession();closeModal('goal-modal');updateDashboard();toast('Savings goal saved.')};
$('savings-form').onsubmit=e=>{e.preventDefault();const amount=+$('savings-amount-input').value;if(amount<=0||!currentUser.goal)return;transactions.push({id:Date.now(),username:currentUser.username,type:'savings',category:'Savings Goal',desc:`Savings for ${currentUser.goal.title}`,amount,createdAt:Date.now()});currentUser.goal.saved=(currentUser.goal.saved||0)+amount;saveSession();localStorage.setItem('transactions',JSON.stringify(transactions));e.target.reset();closeModal('goal-modal');updateDashboard();toast('Savings added to your goal.')};
$('btn-add-savings').onclick=openGoal;$('btn-edit-goal').onclick=openGoal;$('view-all-btn').onclick=()=>showView('transactions');$('nav-add').onclick=openAdd;$('menu-btn').onclick=openSidebar;$('sidebar-close').onclick=closeSidebar;$('sidebar-backdrop').onclick=closeSidebar;$('theme-toggle').onclick=(e)=>toggleTheme(e);$('sidebar-theme').onclick=(e)=>toggleTheme(e);$('profile-theme').onclick=(e)=>toggleTheme(e);
$('notification-btn').onclick=()=>{$('notification-list').innerHTML=`<div><strong>${escapeHtml(currentUser?.username||'User')}</strong>, your dashboard is ready.</div><div>Keep your savings goal updated and review your recent transactions.</div>`;openModal('notification-modal')};
document.querySelectorAll('[data-close-modal]').forEach(b=>b.onclick=()=>closeModal(b.dataset.closeModal));document.querySelectorAll('[data-open-transaction]').forEach(b=>b.onclick=()=>openTransaction(b.dataset.openTransaction));document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));document.querySelectorAll('.side-item[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));document.querySelectorAll('[data-action="add"]').forEach(b=>b.onclick=openAdd);document.querySelectorAll('[data-action="goal"]').forEach(b=>b.onclick=openGoal);document.querySelectorAll('.profile-links [data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('edit-budget-btn').onclick=()=>{$('budget-form').classList.toggle('is-hidden');if(currentUser)$('monthly-budget-input').value=currentUser.monthlyBudget||''};$('budget-form').onsubmit=e=>{e.preventDefault();const value=Number($('monthly-budget-input').value);if(value<=0)return toast('Enter a valid monthly budget.');currentUser.monthlyBudget=value;saveSession();$('budget-form').classList.add('is-hidden');updateBudgetUI();toast('Monthly budget saved.')};
applyAppearance(localStorage.getItem('appearance')||'light');

/* Theme chooser — Design 2 is the permanent default until the user chooses another. */
(function initThemeChooser(){
  const themeKeys=['theme-4','theme-2','glass','theme-1','theme-3','theme-5','theme-6','theme-7'];
  const saved=localStorage.getItem('niliemTheme') || 'theme-4';
  document.body.dataset.theme=themeKeys.includes(saved)?saved:'theme-4';

  function markSelected(){
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.themeChoice===document.body.dataset.theme));
  }
  function setTheme(key){
    if(!themeKeys.includes(key)) key='theme-4';
    document.body.dataset.theme=key;
    applyAppearance(localStorage.getItem('appearance')||'light');
    localStorage.setItem('niliemTheme',key);
    markSelected();
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content=getComputedStyle(document.body).getPropertyValue('--theme-bg').trim() || '#06110f';
    toast(`${document.querySelector(`[data-theme-choice="${key}"] strong`)?.textContent || 'Theme'} selected.`);
  }
  document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeChoice)));
  document.getElementById('themes-toggle')?.addEventListener('click',()=>openModal('themes-modal'));
  document.getElementById('sidebar-themes')?.addEventListener('click',()=>{closeSidebar();openModal('themes-modal')});
  markSelected();
  /* Keep the visual system applied even when the session was already stored. */
  setTimeout(()=>{setTheme(document.body.dataset.theme);applyAppearance(localStorage.getItem('appearance')||'light')},0);
})();
