// Save state to localStorage
function saveState() {
  localStorage.setItem('habitShopRPG', JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem('habitShopRPG');
  if (savedState) {
    const parsedState = JSON.parse(savedState);
    // Check if it's the same day
    if (parsedState.date === new Date().toDateString()) {
      state = parsedState;
      return true;
    } else {
      // If it's a new day, keep the XP and level
      const oldXp = parsedState.xp || 0;
      const oldLevel = parsedState.level || 0;
      initNewDay(oldXp, oldLevel);
      return true;
    }
  }
  return false;
}

// Config
const habitsConfig = [
  { name: 'Exercise', value: 10, good: true },
  { name: 'Meditation', value: 5, good: true },
  { name: 'Study', value: 20, good: true },
  { name: 'Proper Diet', value: 10, good: true },
  { name: 'Social Media', value: -15, good: false },
  { name: 'Unproductive Screen', value: -10, good: false },
  { name: 'Procrastination', value: -15, good: false },
  { name: 'Porn/Fap', value: -20, good: false },
];
const shopConfig = [
  { name: 'Anime Episode', cost: 5, maxDaily: Infinity },
  { name: '30min Gaming', cost: 15, maxDaily: Infinity },
  { name: '30min YouTube', cost: 10, maxDaily: Infinity },
  { name: '30min Leisure', cost: 15, maxDaily: Infinity },
  { name: 'Junk Food', cost: 100, maxDaily: Infinity },
  { name: 'Movie Time', cost: 60, maxDaily: Infinity },
  { name: 'Free Time Rest', cost: 45, maxDaily: 1 },
];

// State
let state = {};

function initNewDay(savedXp = 0, savedLevel = 0) {
  state = {
    date: new Date().toDateString(),
    counts: habitsConfig.map(() => 0),
    buys: shopConfig.map(() => 0),
    credits: 0,
    xp: savedXp,
    level: savedLevel,
    rank: 'F',
  };
}

function initDay() {
  if (!loadState()) {
    initNewDay();
  }
  render();
  saveState();
}

function calc() {
  // credits
  state.credits = state.counts.reduce((sum, c, i) => sum + c * habitsConfig[i].value, 0);
  // perfect day?
  const goodDone = habitsConfig.filter((h,i) => h.good && state.counts[i] > 0).length;
  const badDone = habitsConfig.filter((h,i) => !h.good && state.counts[i] > 0).length;
  state.perfect = goodDone >= 4 && badDone === 0;
  // apply free time unlock
  if (state.perfect) {
    shopConfig[6].maxDaily = 1;
  } else {
    shopConfig[6].maxDaily = 0;
    state.buys[6] = 0;
  }
  // enforce shop maxDaily
  state.buys = state.buys.map((b,i) => Math.min(b, shopConfig[i].maxDaily));
  // deduct spends
  const spend = state.buys.reduce((s,b,i) => s + b * shopConfig[i].cost, 0);
  state.credits -= spend;
  // xp and level
  state.xp += Math.abs(state.counts.reduce((sum, c, i) => sum + c * habitsConfig[i].value, 0));
  state.level = Math.floor(state.xp / 100);
  // rank by perfect streak (not persistent here)
  // simplified: based on today's perfect only
  state.rank = state.perfect ? 'E' : 'F';
}

function render() {
  calc();
  document.getElementById('credits').textContent = state.credits;
  document.getElementById('xp').textContent = state.xp;
  document.getElementById('level').textContent = state.level;
  document.getElementById('nextXp').textContent = 100 - (state.xp % 100);
  document.getElementById('rank').textContent = state.rank;

  // habits
  const hdiv = document.getElementById('habits');
  hdiv.innerHTML = '';
  habitsConfig.forEach((h,i) => {
    const d = document.createElement('div'); d.className='habit';
    d.innerHTML = `
      <span>${h.name} (${h.value > 0 ? '+' : ''}${h.value})</span>
      <button ${state.counts[i]===0?'disabled':''} onclick="updateHabit(${i},-1)">-</button>
      <span>${state.counts[i]}</span>
      <button onclick="updateHabit(${i},1)">+</button>
    `;
    hdiv.appendChild(d);
  });

  // shop
  const sdiv = document.getElementById('shop');
  sdiv.innerHTML = '';
  shopConfig.forEach((s,i) => {
    const d = document.createElement('div'); d.className='shop-item';
    const affordable = state.credits >= s.cost;
    const maxed = state.buys[i] >= s.maxDaily;
    d.innerHTML = `
      <span>${s.name} ($${s.cost}) x${state.buys[i]}</span>
      <button ${affordable&& !maxed ?'' :'disabled'} onclick="buyItem(${i})">Buy</button>
    `;
    sdiv.appendChild(d);
  });
}

function updateHabit(i, delta) {
  state.counts[i] = Math.max(0, state.counts[i] + delta);
  render();
  saveState(); // Save after update
}

function buyItem(i) {
  state.buys[i]++;
  render();
  saveState(); // Save after purchase
}

document.getElementById('newDay').onclick = initDay;
window.onload = initDay;