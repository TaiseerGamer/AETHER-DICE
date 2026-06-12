// ====================== AETHER DICE v0.0.3 ======================
// New: Daily Rewards + Collection + Polish + Confetti

let coins = 482;
let totalRolls = 37;
let bestPull = 12500;
let lifetimeCoins = 12500;
let prestigeLevel = 0;
let prestigeMultiplier = 1.0;
let multiplier = 1.0;

let upgrades = {
  luck: { level: 0, cost: 280, effect: 1.06 },
  multi: { level: 0, cost: 750, effect: 1.25 },
  auto: { level: 0, cost: 1600, effect: 0 },
  charm: { level: 0, cost: 1200, effect: 0.08 }
};

let history = [];
let unlockedAchievements = [];
let collection = new Set(); // unique item names

// Daily reward
let lastClaimDate = null;
let dailyStreak = 0;

// Sound
let soundEnabled = true;
let audioContext = null;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'sine';
    gain.gain.value = 0.4;

    if (type === 'roll') {
      osc.frequency.value = 520;
      gain.gain.value = 0.25;
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
    } else if (type === 'critical') {
      osc.frequency.value = 880;
      gain.gain.value = 0.6;
      osc.type = 'sawtooth';
    } else if (type === 'buy') {
      osc.frequency.value = 660;
      gain.gain.value = 0.35;
    } else if (type === 'prestige') {
      osc.frequency.value = 300;
      gain.gain.value = 0.5;
      osc.type = 'triangle';
    } else if (type === 'daily') {
      osc.frequency.value = 750;
      gain.gain.value = 0.4;
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    osc.start();

    setTimeout(() => {
      gain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      setTimeout(() => osc.stop(), 650);
    }, 80);
  } catch (e) {}
}

function createConfetti(count = 80) {
  const colors = ['#a855f7', '#ec4899', '#eab308', '#22c55e', '#3b82f6'];
  for (let i = 0; i < count; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random() * window.innerWidth + 'px';
    conf.style.top = '-10px';
    conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    conf.style.width = (Math.random() * 8 + 6) + 'px';
    conf.style.height = conf.style.width;
    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(conf);

    setTimeout(() => {
      if (conf.parentNode) conf.parentNode.removeChild(conf);
    }, 3500);
  }
}

// Achievements
const achievementsList = [
  { id: 'first_roll', name: 'First Steps', desc: 'Roll the Aether Dice for the first time', icon: '🎲' },
  { id: 'rare_find', name: 'Rare Find', desc: 'Obtain a Rare or higher rarity artifact', icon: '🔵' },
  { id: 'epic_collector', name: 'Epic Collector', desc: 'Obtain an Epic or higher rarity artifact', icon: '🟣' },
  { id: 'mythic_master', name: 'Mythic Master', desc: 'Obtain a Mythic artifact', icon: '🌸' },
  { id: 'big_spender', name: 'Big Spender', desc: 'Purchase a total of 5 upgrades', icon: '💰' },
  { id: 'prestigious', name: 'Prestigious', desc: 'Perform your first Prestige reset', icon: '✨' }
];

const rarities = [
  { name: "COMMON", color: "#a1a1aa", prob: 0.52, baseCoin: 18 },
  { name: "UNCOMMON", color: "#22c55e", prob: 0.26, baseCoin: 75 },
  { name: "RARE", color: "#3b82f6", prob: 0.13, baseCoin: 320 },
  { name: "EPIC", color: "#a855f7", prob: 0.06, baseCoin: 1100 },
  { name: "LEGENDARY", color: "#eab308", prob: 0.022, baseCoin: 4800 },
  { name: "MYTHIC", color: "#ec4899", prob: 0.008, baseCoin: 21000 }
];

const prefixes = ["Void", "Celestial", "Eternal", "Shadow", "Radiant", "Chaos", "Astral", "Primal", "Divine", "Forgotten"];
const elements = ["Flame", "Frost", "Storm", "Arcane", "Abyssal", "Solar", "Lunar", "Verdant", "Thunder", "Blood"];
const items = ["Blade", "Orb", "Amulet", "Crown", "Rune", "Crystal", "Essence", "Relic", "Sigil", "Echo"];

function getRandomItem() {
  return `${prefixes[Math.floor(Math.random()*prefixes.length)]} ${elements[Math.floor(Math.random()*elements.length)]} ${items[Math.floor(Math.random()*items.length)]}`;
}

function calculateProbabilities() {
  let total = 0;
  const adjusted = rarities.map(r => {
    let p = r.prob * Math.pow(upgrades.luck.effect, upgrades.luck.level);
    total += p;
    return { ...r, adjustedProb: p };
  });
  return adjusted.map(r => ({ ...r, finalProb: r.adjustedProb / total }));
}

function saveGame() {
  const gameData = {
    coins, totalRolls, bestPull, lifetimeCoins,
    prestigeLevel, prestigeMultiplier, multiplier,
    upgrades, history, unlockedAchievements,
    collection: Array.from(collection),
    lastClaimDate, dailyStreak, soundEnabled
  };
  localStorage.setItem('aetherDiceSave_v0.0.3', JSON.stringify(gameData));
}

function loadGame() {
  const saved = localStorage.getItem('aetherDiceSave_v0.0.3');
  if (saved) {
    const data = JSON.parse(saved);
    coins = data.coins || 482;
    totalRolls = data.totalRolls || 0;
    bestPull = data.bestPull || 0;
    lifetimeCoins = data.lifetimeCoins || 0;
    prestigeLevel = data.prestigeLevel || 0;
    prestigeMultiplier = data.prestigeMultiplier || 1.0;
    multiplier = data.multiplier || 1.0;
    upgrades = data.upgrades || upgrades;
    history = data.history || [];
    unlockedAchievements = data.unlockedAchievements || [];
    collection = new Set(data.collection || []);
    lastClaimDate = data.lastClaimDate || null;
    dailyStreak = data.dailyStreak || 0;
    soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
  }
}

function checkAchievements() {
  let newUnlocks = false;

  if (totalRolls >= 1 && !unlockedAchievements.includes('first_roll')) {
    unlockAchievement('first_roll'); newUnlocks = true;
  }
  const hasRareOrHigher = history.some(h => ['RARE','EPIC','LEGENDARY','MYTHIC'].includes(h.rarity));
  if (hasRareOrHigher && !unlockedAchievements.includes('rare_find')) {
    unlockAchievement('rare_find'); newUnlocks = true;
  }
  const hasEpicOrHigher = history.some(h => ['EPIC','LEGENDARY','MYTHIC'].includes(h.rarity));
  if (hasEpicOrHigher && !unlockedAchievements.includes('epic_collector')) {
    unlockAchievement('epic_collector'); newUnlocks = true;
  }
  const hasMythic = history.some(h => h.rarity === 'MYTHIC');
  if (hasMythic && !unlockedAchievements.includes('mythic_master')) {
    unlockAchievement('mythic_master'); newUnlocks = true;
  }
  const totalUpgrades = Object.values(upgrades).reduce((sum, u) => sum + u.level, 0);
  if (totalUpgrades >= 5 && !unlockedAchievements.includes('big_spender')) {
    unlockAchievement('big_spender'); newUnlocks = true;
  }
  if (prestigeLevel >= 1 && !unlockedAchievements.includes('prestigious')) {
    unlockAchievement('prestigious'); newUnlocks = true;
  }

  if (newUnlocks) {
    renderAchievements();
    saveGame();
  }
}

function unlockAchievement(id) {
  if (!unlockedAchievements.includes(id)) {
    unlockedAchievements.push(id);
    const ach = achievementsList.find(a => a.id === id);
    if (ach) {
      const notif = document.createElement('div');
      notif.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#166534;color:white;padding:12px 20px;border-radius:12px;z-index:9999;box-shadow:0 10px 15px rgb(0 0 0 / 0.3)';
      notif.innerHTML = `<div class="flex items-center gap-3"><span class="text-2xl">${ach.icon}</span> <div><div class="font-bold">Achievement Unlocked!</div><div class="text-sm">${ach.name}</div></div></div>`;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 4200);
    }
  }
}

function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if (!container) return;

  container.innerHTML = achievementsList.map(ach => {
    const isUnlocked = unlockedAchievements.includes(ach.id);
    return `
      <div class="achievement-card bg-zinc-900 border ${isUnlocked ? 'border-green-500 unlocked' : 'border-zinc-700'} p-5 rounded-3xl flex gap-4 items-start">
        <div class="text-4xl mt-1">${ach.icon}</div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div class="font-bold text-lg">${ach.name}</div>
            ${isUnlocked ? '<i class="fa-solid fa-check-circle text-green-500 text-xl"></i>' : '<i class="fa-solid fa-lock text-zinc-600 text-xl"></i>'}
          </div>
          <div class="text-sm text-zinc-400 mt-1">${ach.desc}</div>
        </div>
      </div>
    `;
  }).join('');
}

function rollDice() {
  const dice = document.getElementById('dice');
  dice.classList.add('rolling');
  playSound('roll');

  setTimeout(() => {
    dice.classList.remove('rolling');

    const probs = calculateProbabilities();
    let roll = Math.random();
    let selected = rarities[0];

    for (let r of probs) {
      if (roll <= r.finalProb) { selected = r; break; }
      roll -= r.finalProb;
    }

    const isCritical = Math.random() < (upgrades.charm.level * upgrades.charm.effect);
    const rewardBase = isCritical ? selected.baseCoin * 2.5 : selected.baseCoin;
    const finalMultiplier = prestigeMultiplier * (1 + upgrades.multi.level * 0.3);
    const reward = Math.floor(rewardBase * finalMultiplier);

    coins += reward;
    lifetimeCoins += reward;
    totalRolls++;

    if (reward > bestPull) bestPull = reward;

    const itemName = getRandomItem();
    const wasNew = !collection.has(itemName);
    if (wasNew) collection.add(itemName);

    const rollData = { rarity: selected.name, item: itemName, reward: reward, critical: isCritical };
    
    history.unshift(rollData);
    if (history.length > 25) history.pop();

    if (isCritical) playSound('critical');

    // Confetti for big moments
    if (selected.name === 'MYTHIC' || isCritical || reward >= 10000) {
      createConfetti(120);
    }

    showResult(selected, itemName, reward, isCritical, wasNew);
    updateUI();
    checkAchievements();
    saveGame();
  }, 650);
}

function showResult(rarity, itemName, reward, critical, wasNew) {
  const resultEl = document.getElementById('result');
  resultEl.classList.remove('hidden');
  let extra = '';
  if (wasNew) extra = `<div class="text-emerald-400 text-sm mt-1">✨ New in Collection!</div>`;

  resultEl.innerHTML = `
    <div class="${critical || rarity.name === 'MYTHIC' ? 'rarity-mythic' : ''}">
      <div style="color: ${rarity.color}" class="text-3xl font-bold mb-2">
        ${rarity.name} ${critical ? '★ CRITICAL!' : ''}
      </div>
      <div class="text-4xl font-bold mb-2">${itemName}</div>
      <div class="text-zinc-400 mb-4">A powerful artifact from the Aether</div>
      <div class="bg-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-mono font-bold text-2xl inline-block">
        +${reward} <i class="fa-solid fa-coins"></i>
      </div>
      ${extra}
    </div>
  `;
}

function updateUI() {
  document.getElementById('coin-display').textContent = Math.floor(coins).toLocaleString();
  document.getElementById('total-rolls').textContent = totalRolls.toLocaleString();
  document.getElementById('best-pull').textContent = bestPull.toLocaleString();
  document.getElementById('lifetime-coins').textContent = lifetimeCoins.toLocaleString();
  document.getElementById('prestige-level').textContent = prestigeLevel;
  const currentMulti = (prestigeMultiplier * (1 + upgrades.multi.level * 0.3)).toFixed(1);
  document.getElementById('multiplier-display').textContent = currentMulti + "x";

  // Daily streak
  const streakEl = document.getElementById('daily-streak');
  if (streakEl) streakEl.textContent = `Streak: ${dailyStreak}`;

  const statusEl = document.getElementById('daily-status');
  if (statusEl) {
    const today = new Date().toDateString();
    if (lastClaimDate === today) {
      statusEl.textContent = "Already claimed today!";
      statusEl.style.color = '#4ade80';
    } else {
      statusEl.textContent = "Claim your daily coins!";
      statusEl.style.color = '#a1a1aa';
    }
  }

  renderShop();
  renderHistory();
  renderAchievements();
  renderCollection();
}

function renderShop() {
  const container = document.getElementById('shop-items');
  container.innerHTML = `
    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-purple-400 text-sm">LUCK BOOST</div><div class="text-2xl font-bold">Aether Alignment</div></div><div class="text-4xl">🌟</div></div>
      <div class="my-4 text-sm text-zinc-400">Increases chance of rare pulls</div>
      <div onclick="buyUpgrade('luck')" class="shop-btn">Lv.${upgrades.luck.level} • ${Math.floor(upgrades.luck.cost * Math.pow(1.65, upgrades.luck.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-yellow-400 text-sm">MULTIPLIER</div><div class="text-2xl font-bold">Golden Touch</div></div><div class="text-4xl">💰</div></div>
      <div class="my-4 text-sm text-zinc-400">Increases coins from every roll</div>
      <div onclick="buyUpgrade('multi')" class="shop-btn">Lv.${upgrades.multi.level} • ${Math.floor(upgrades.multi.cost * Math.pow(1.7, upgrades.multi.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-emerald-400 text-sm">AUTO ROLL</div><div class="text-2xl font-bold">Eternal Spin</div></div><div class="text-4xl">⚡</div></div>
      <div class="my-4 text-sm text-zinc-400">Rolls automatically every 7s</div>
      <div onclick="buyUpgrade('auto')" class="shop-btn">Lv.${upgrades.auto.level} • ${Math.floor(upgrades.auto.cost * Math.pow(2, upgrades.auto.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-pink-400 text-sm">CRITICAL</div><div class="text-2xl font-bold">Lucky Charm</div></div><div class="text-4xl">🍀</div></div>
      <div class="my-4 text-sm text-zinc-400">Chance for 2.5x reward rolls</div>
      <div onclick="buyUpgrade('charm')" class="shop-btn">Lv.${upgrades.charm.level} • ${Math.floor(upgrades.charm.cost * Math.pow(1.8, upgrades.charm.level))} <i class="fa-solid fa-coins"></i></div>
    </div>
  `;
}

function buyUpgrade(type) {
  const upg = upgrades[type];
  const cost = Math.floor(upg.cost * Math.pow(type === 'auto' ? 2 : type === 'charm' ? 1.8 : 1.65, upg.level));

  if (coins < cost) {
    alert("Not enough Aether Coins!");
    return;
  }

  coins -= cost;
  upg.level++;

  playSound('buy');
  checkAchievements();
  updateUI();
  saveGame();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = history.map(h => {
    const r = rarities.find(r => r.name === h.rarity);
    return `
      <div class="bg-zinc-900 border-l-4 p-4 rounded-2xl flex justify-between items-center" style="border-color: ${r.color}">
        <div>
          <span class="font-bold" style="color: ${r.color}">${h.rarity}</span><br>
          <span class="text-lg">${h.item}</span>
        </div>
        <div class="text-right">
          <div class="text-yellow-400 font-mono">+${h.reward}</div>
          ${h.critical ? '<div class="text-pink-400 text-xs font-bold">★ CRITICAL</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderCollection() {
  const container = document.getElementById('collection-list');
  const countEl = document.getElementById('collection-count');
  if (!container || !countEl) return;

  const totalPossible = 60;
  countEl.textContent = `${collection.size} / ${totalPossible}`;

  if (collection.size === 0) {
    container.innerHTML = `<div class="col-span-full text-center text-zinc-400 py-8">No artifacts collected yet. Keep rolling!</div>`;
    return;
  }

  let html = '';
  collection.forEach(itemName => {
    let rarityColor = '#a1a1aa';
    let rarityName = 'COMMON';
    for (let h of history) {
      if (h.item === itemName) {
        const r = rarities.find(r => r.name === h.rarity);
        if (r) { rarityColor = r.color; rarityName = r.name; break; }
      }
    }
    html += `
      <div class="collection-card flex items-center gap-3">
        <div style="color: ${rarityColor}" class="font-bold text-lg flex-1">${itemName}</div>
        <div style="color: ${rarityColor}" class="text-xs px-2 py-1 rounded bg-zinc-800">${rarityName}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function claimDailyReward() {
  const today = new Date().toDateString();
  const statusEl = document.getElementById('daily-status');

  if (lastClaimDate === today) {
    alert("You've already claimed today's reward!");
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yestStr = yesterday.toDateString();

  if (lastClaimDate === yestStr) {
    dailyStreak++;
  } else {
    dailyStreak = 1;
  }

  const reward = 500 + (dailyStreak * 150);
  coins += reward;
  lifetimeCoins += reward;
  lastClaimDate = today;

  playSound('daily');
  createConfetti(60);

  if (statusEl) {
    statusEl.textContent = `Claimed! +${reward} coins`;
    statusEl.style.color = '#4ade80';
  }

  updateUI();
  checkAchievements();
  saveGame();
}

function doPrestige() {
  if (prestigeLevel >= 10) {
    alert("Maximum prestige level reached!");
    return;
  }

  const confirmMsg = `Are you sure you want to Prestige?\n\nThis will reset:\n• Coins\n• Upgrades\n• Rolls & History\n\nBut you will gain a permanent +50% multiplier bonus (current: ${prestigeLevel} → ${prestigeLevel + 1})`;

  if (confirm(confirmMsg)) {
    prestigeLevel++;
    prestigeMultiplier = 1 + (prestigeLevel * 0.5);

    coins = 0;
    totalRolls = 0;
    bestPull = 0;
    history = [];
    
    upgrades = {
      luck: { level: 0, cost: 280, effect: 1.06 },
      multi: { level: 0, cost: 750, effect: 1.25 },
      auto: { level: 0, cost: 1600, effect: 0 },
      charm: { level: 0, cost: 1200, effect: 0.08 }
    };

    playSound('prestige');
    createConfetti(150);
    checkAchievements();
    updateUI();
    saveGame();

    const resultEl = document.getElementById('result');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <div class="rarity-mythic">
        <div class="text-4xl font-bold mb-2 text-purple-400">PRESTIGE COMPLETE!</div>
        <div class="text-2xl">New Prestige Level: <span class="text-pink-400">${prestigeLevel}</span></div>
        <div class="mt-3 text-emerald-400">Permanent Multiplier Bonus Applied!</div>
      </div>
    `;
    setTimeout(() => {
      if (!document.getElementById('tab-0').classList.contains('hidden')) {
        resultEl.classList.add('hidden');
      }
    }, 5500);
  }
}

function switchTab(n) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${n}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === n);
  });

  if (n === 2) renderAchievements();
  if (n === 3) renderCollection();
}

// Auto Roll
setInterval(() => {
  if (upgrades.auto.level > 0) {
    rollDice();
  }
}, 7000);

// Initialize
window.onload = () => {
  loadGame();
  
  if (prestigeLevel > 0 && prestigeMultiplier === 1.0) {
    prestigeMultiplier = 1 + (prestigeLevel * 0.5);
  }

  updateUI();
  switchTab(0);
  
  if (totalRolls === 0) {
    setTimeout(() => rollDice(), 900);
  }
};