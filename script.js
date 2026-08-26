document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authSection = document.getElementById('auth-section');
  const dashboardSection = document.getElementById('dashboard-section');

  const loginBox = document.getElementById('login-box');
  const signupBox = document.getElementById('signup-box');

  const btnShowSignUp = document.getElementById('btn-show-signup');
  const btnShowLogin = document.getElementById('btn-show-login');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const logoutBtn = document.getElementById('logout-btn');

  const userDisplayName = document.getElementById('user-display-name');
  const totalBalance = document.getElementById('total-balance');
  const totalIncome = document.getElementById('total-income');
  const totalExpense = document.getElementById('total-expense');

  const transactionForm = document.getElementById('transaction-form');
  const transactionList = document.getElementById('transaction-list');

  const profileUpload = document.getElementById('profile-upload');
  const avatarPreview = document.getElementById('avatar-preview');

  // Modal Elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');

  // Vision Goal Elements
  const btnEditGoal = document.getElementById('btn-edit-goal');
  const btnAddSavings = document.getElementById('btn-add-savings');
  const goalForm = document.getElementById('goal-form');
  const savingsForm = document.getElementById('savings-form');
  
  const goalTitleDisplay = document.getElementById('goal-title-display');
  const goalAmountDisplay = document.getElementById('goal-amount-display');
  const goalProgressBar = document.getElementById('goal-progress-bar');
  const goalStatusText = document.getElementById('goal-status-text');

  // Data State
  let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  let usersDatabase = JSON.parse(localStorage.getItem('usersDatabase')) || [];
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let pendingTransaction = null;

  // Motivational Mindset Quotes
  const mindsetQuotes = [
    "Today's expenses dictate tomorrow's financial freedom. Spend with discipline!",
    "Is this purchase a genuine necessity or just a temporary desire?",
    "The wealthy invest first and spend what is left. The poor spend first and try to invest what is left.",
    "Do not buy unnecessary things to impress people who do not contribute to your goals!"
  ];

  function formatTZS(amount) {
    return "TZS " + Number(amount).toLocaleString('en-US');
  }

  function saveUserData() {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    usersDatabase = usersDatabase.map(u => u.username.toLowerCase() === currentUser.username.toLowerCase() ? currentUser : u);
    localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));
  }

  // --- FORM TOGGLING ---
  btnShowSignUp.addEventListener('click', () => {
    loginBox.classList.add('is-hidden');
    signupBox.classList.remove('is-hidden');
  });

  btnShowLogin.addEventListener('click', () => {
    signupBox.classList.add('is-hidden');
    loginBox.classList.remove('is-hidden');
  });

  // --- MODAL POPUP SYSTEM ---
  function showMindsetModal(title, message, isWarning = false, onConfirm = null, onCancel = null) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOverlay.classList.remove('is-hidden');

    if (isWarning) {
      modalBtnCancel.classList.remove('is-hidden');
    } else {
      modalBtnCancel.classList.add('is-hidden');
    }

    modalBtnConfirm.onclick = () => {
      modalOverlay.classList.add('is-hidden');
      if (onConfirm) onConfirm();
    };

    modalBtnCancel.onclick = () => {
      modalOverlay.classList.add('is-hidden');
      if (onCancel) onCancel();
    };
  }

  // --- PROFILE PICTURE UPLOAD ---
  avatarPreview.parentElement.addEventListener('click', () => {
    profileUpload.click();
  });

  profileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target.result;
        avatarPreview.innerHTML = `<img src="${base64Image}" alt="Profile">`;

        if (currentUser) {
          currentUser.profilePic = base64Image;
          saveUserData();
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // --- VISION GOAL LOGIC ---
  btnEditGoal.addEventListener('click', () => {
    savingsForm.classList.add('is-hidden');
    goalForm.classList.toggle('is-hidden');
  });

  btnAddSavings.addEventListener('click', () => {
    if (!currentUser || !currentUser.goal) {
      alert("Please set a Vision Goal first!");
      return;
    }
    goalForm.classList.add('is-hidden');
    savingsForm.classList.toggle('is-hidden');
  });

  // Set Target Goal
  goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title-input').value.trim();
    const target = parseFloat(document.getElementById('goal-target-input').value);

    const currentSaved = (currentUser.goal && currentUser.goal.saved) ? currentUser.goal.saved : 0;

    if (currentUser) {
      currentUser.goal = { title, target, saved: currentSaved };
      saveUserData();
    }

    goalForm.classList.add('is-hidden');
    goalForm.reset();
    updateDashboard();
  });

  // Deposit Savings manually to Goal
  savingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const depositAmount = parseFloat(document.getElementById('savings-amount-input').value);

    if (depositAmount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (currentUser && currentUser.goal) {
      // 1. Ongeza akiba kwenye Goal
      currentUser.goal.saved = (currentUser.goal.saved || 0) + depositAmount;
      saveUserData();

      // 2. Katakata kwenye main balance kama expense transaction
      const savingsTransaction = {
        id: Date.now(),
        username: currentUser.username,
        type: 'expense',
        category: 'Others',
        desc: `Savings Deposit: ${currentUser.goal.title}`,
        amount: depositAmount
      };

      transactions.push(savingsTransaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));

      alert(`Successfully added ${formatTZS(depositAmount)} to your goal!`);
    }

    savingsForm.classList.add('is-hidden');
    savingsForm.reset();
    updateDashboard();
  });

  // --- AUTHENTICATION CHECK ---
  function checkAuthState() {
    if (currentUser) {
      authSection.classList.add('is-hidden');
      dashboardSection.classList.remove('is-hidden');
      userDisplayName.textContent = currentUser.username;

      if (currentUser.profilePic) {
        avatarPreview.innerHTML = `<img src="${currentUser.profilePic}" alt="Profile">`;
      } else {
        avatarPreview.innerHTML = `<i class="fa-solid fa-user"></i>`;
      }

      updateDashboard();

      // Trigger Mindset Pop-up on Login
      const randomQuote = mindsetQuotes[Math.floor(Math.random() * mindsetQuotes.length)];
      showMindsetModal(`Mindset Check, ${currentUser.username}!`, randomQuote);

    } else {
      dashboardSection.classList.add('is-hidden');
      authSection.classList.remove('is-hidden');
    }
  }

  // Signup
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
      alert("Error: Passwords do not match!");
      return;
    }

    if (usersDatabase.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      alert("Error: Username is already taken!");
      return;
    }

    if (usersDatabase.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert("Error: Email is already registered!");
      return;
    }

    const newUser = { email, username, password, profilePic: "", goal: null };
    usersDatabase.push(newUser);
    localStorage.setItem('usersDatabase', JSON.stringify(usersDatabase));

    alert("Account created successfully! Please sign in.");
    signupForm.reset();
    signupBox.classList.add('is-hidden');
    loginBox.classList.remove('is-hidden');
  });

  // Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const identifier = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const foundUser = usersDatabase.find(u => 
      (u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier) && u.password === password
    );

    if (foundUser) {
      currentUser = foundUser;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginForm.reset();
      checkAuthState();
    } else {
      alert("Invalid credentials!");
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    checkAuthState();
  });

  // --- TRANSACTIONS LOGIC & BIG EXPENSE CHECK ---
  transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('trans-type').value;
    const category = document.getElementById('trans-category').value;
    const desc = document.getElementById('trans-desc').value.trim();
    const amount = parseFloat(document.getElementById('trans-amount').value);

    const newTransaction = { id: Date.now(), username: currentUser.username, type, category, desc, amount };

    // BIG EXPENSE CHECK: If Expense >= 50,000 TZS trigger Warning Popup
    if (type === 'expense' && amount >= 50000) {
      pendingTransaction = newTransaction;
      showMindsetModal(
        "⚠️ Big Expense Warning!",
        `Warning: You are attempting to log a major expense of ${formatTZS(amount)} for "${desc}". Is this expense essential or will it set back your personal financial goals?`,
        true,
        () => {
          saveTransaction(pendingTransaction);
          pendingTransaction = null;
        },
        () => {
          pendingTransaction = null;
          transactionForm.reset();
        }
      );
    } else {
      saveTransaction(newTransaction);
    }
  });

  function saveTransaction(trans) {
    transactions.push(trans);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateDashboard();
    transactionForm.reset();
  }

  function updateDashboard() {
    let incomeSum = 0;
    let expenseSum = 0;

    transactionList.innerHTML = '';
    const userTransactions = transactions.filter(t => t.username.toLowerCase() === currentUser.username.toLowerCase());

    userTransactions.forEach((item) => {
      if (item.type === 'income') {
        incomeSum += item.amount;
      } else {
        expenseSum += item.amount;
      }

      const li = document.createElement('li');
      li.className = `transaction-item ${item.type}`;
      li.innerHTML = `
        <div class="trans-info">
          <h4>${item.desc}</h4>
          <span>${item.category}</span>
        </div>
        <div class="trans-amount">${item.type === 'income' ? '+' : '-'} ${formatTZS(item.amount)}</div>
      `;
      transactionList.prepend(li);
    });

    const balance = incomeSum - expenseSum;

    totalBalance.textContent = formatTZS(balance);
    totalIncome.textContent = formatTZS(incomeSum);
    totalExpense.textContent = formatTZS(expenseSum);

    // UPDATE VISION GOAL DISPLAY BASED ON MANUAL SAVINGS
    if (currentUser && currentUser.goal) {
      const { title, target, saved = 0 } = currentUser.goal;
      const progressPercent = Math.min(100, Math.max(0, (saved / target) * 100)).toFixed(1);

      goalTitleDisplay.textContent = title;
      goalAmountDisplay.textContent = `${formatTZS(saved)} / ${formatTZS(target)}`;
      goalProgressBar.style.width = `${progressPercent}%`;

      if (saved >= target) {
        goalStatusText.textContent = "🎉 Congratulations! You have fully achieved your vision goal!";
        goalStatusText.style.color = "var(--success)";
      } else {
        const remaining = target - saved;
        goalStatusText.textContent = `Remaining: ${formatTZS(remaining)} (${progressPercent}% Complete)`;
        goalStatusText.style.color = "var(--text-muted)";
      }
    } else {
      goalTitleDisplay.textContent = "No goal set yet";
      goalAmountDisplay.textContent = "TZS 0 / TZS 0";
      goalProgressBar.style.width = "0%";
      goalStatusText.textContent = "Set your target goal to stay focused!";
    }
  }

  // INITIAL START
  checkAuthState();
});