// ====================== AETHER DICE v0.0.1 ======================
let coins = 482;
let totalRolls = 37;
let bestPull = 12500;
let multiplier = 1.0;
let rollStreak = 0;

let upgrades = {
  luck: { level: 0, cost: 280, effect: 1.06 },
  multi: { level: 0, cost: 750, effect: 1.25 },
  auto: { level: 0, cost: 1600, effect: 0 },
  charm: { level: 0, cost: 1200, effect: 0.08 } // Critical chance
};

let history = [];

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

// Save Game
function saveGame() {
  const gameData = { coins, totalRolls, bestPull, multiplier, upgrades, history, rollStreak };
  localStorage.setItem('aetherDiceSave', JSON.stringify(gameData));
}

// Load Game
function loadGame() {
  const saved = localStorage.getItem('aetherDiceSave');
  if (saved) {
    const data = JSON.parse(saved);
    coins = data.coins || 482;
    totalRolls = data.totalRolls || 0;
    bestPull = data.bestPull || 0;
    multiplier = data.multiplier || 1.0;
    upgrades = data.upgrades || upgrades;
    history = data.history || [];
    rollStreak = data.rollStreak || 0;
  }
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

function rollDice() {
  const dice = document.getElementById('dice');
  dice.classList.add('rolling');

  setTimeout(() => {
    dice.classList.remove('rolling');

    const probs = calculateProbabilities();
    let roll = Math.random();
    let selected = rarities[0];

    for (let r of probs) {
      if (roll <= r.finalProb) {
        selected = r;
        break;
      }
      roll -= r.finalProb;
    }

    // Critical Roll (Lucky Charm)
    const isCritical = Math.random() < (upgrades.charm.level * upgrades.charm.effect);
    const rewardBase = isCritical ? selected.baseCoin * 2.5 : selected.baseCoin;
    const reward = Math.floor(rewardBase * multiplier * (1 + upgrades.multi.level * 0.3));

    coins += reward;
    totalRolls++;
    rollStreak++;

    if (reward > bestPull) bestPull = reward;

    const itemName = getRandomItem();
    const rollData = { rarity: selected.name, item: itemName, reward: reward, critical: isCritical };
    
    history.unshift(rollData);
    if (history.length > 25) history.pop();

    showResult(selected, itemName, reward, isCritical);
    updateUI();
    saveGame();
  }, 650);
}

function showResult(rarity, itemName, reward, critical) {
  const resultEl = document.getElementById('result');
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div class="${critical ? 'rarity-mythic' : rarity.name === 'MYTHIC' ? 'rarity-mythic' : ''}">
      <div style="color: ${rarity.color}" class="text-3xl font-bold mb-2">${rarity.name} ${critical ? '★ CRITICAL!' : ''}</div>
      <div class="text-4xl font-bold mb-2">${itemName}</div>
      <div class="text-zinc-400 mb-4">A powerful artifact from the Aether</div>
      <div class="bg-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-mono font-bold text-2xl inline-block">
        +${reward} <i class="fa-solid fa-coins"></i>
      </div>
    </div>
  `;
}

function updateUI() {
  document.getElementById('coin-display').textContent = Math.floor(coins).toLocaleString();
  document.getElementById('total-rolls').textContent = totalRolls.toLocaleString();
  document.getElementById('best-pull').textContent = bestPull.toLocaleString();
  document.getElementById('multiplier-display').textContent = multiplier.toFixed(1) + "x";

  renderShop();
  renderHistory();
}

function renderShop() {
  const container = document.getElementById('shop-items');
  container.innerHTML = `
    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-purple-400 text-sm">LUCK BOOST</div><div class="text-2xl font-bold">Aether Alignment</div></div><div class="text-4xl">🌟</div></div>
      <div onclick="buyUpgrade('luck')" class="shop-btn">Lv.${upgrades.luck.level} • ${Math.floor(upgrades.luck.cost * Math.pow(1.65, upgrades.luck.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-yellow-400 text-sm">MULTIPLIER</div><div class="text-2xl font-bold">Golden Touch</div></div><div class="text-4xl">💰</div></div>
      <div onclick="buyUpgrade('multi')" class="shop-btn">Lv.${upgrades.multi.level} • ${Math.floor(upgrades.multi.cost * Math.pow(1.7, upgrades.multi.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-emerald-400 text-sm">AUTO ROLL</div><div class="text-2xl font-bold">Eternal Spin</div></div><div class="text-4xl">⚡</div></div>
      <div onclick="buyUpgrade('auto')" class="shop-btn">Lv.${upgrades.auto.level} • ${Math.floor(upgrades.auto.cost * Math.pow(2, upgrades.auto.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="shop-card">
      <div class="flex justify-between"><div><div class="text-pink-400 text-sm">CRITICAL</div><div class="text-2xl font-bold">Lucky Charm</div></div><div class="text-4xl">🍀</div></div>
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

  if (type === 'multi') multiplier = 1 + (upg.level * 0.3);

  updateUI();
  saveGame();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = history.map(h => `
    <div class="bg-zinc-900 border-l-4 p-4 rounded-2xl flex justify-between" style="border-color: ${rarities.find(r => r.name === h.rarity).color}">
      <div>
        <span class="font-bold" style="color: ${rarities.find(r => r.name === h.rarity).color}">${h.rarity}</span><br>
        <span>${h.item}</span>
      </div>
      <div class="text-right">
        <div class="text-yellow-400">+${h.reward}</div>
        ${h.critical ? '<div class="text-pink-400 text-xs">CRITICAL!</div>' : ''}
      </div>
    </div>
  `).join('');
}

function switchTab(n) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${n}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === n);
  });
}

// Auto Roll
setInterval(() => {
  if (upgrades.auto.level > 0) rollDice();
}, 7000);

// Initialize
window.onload = () => {
  loadGame();
  updateUI();
  switchTab(0);
  
  // Welcome roll
  setTimeout(() => rollDice(), 600);
};