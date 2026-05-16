// Game State
let coins = 482;
let totalRolls = 37;
let bestPull = 12500;
let multiplier = 1.0;

let upgrades = {
  luck: { level: 0, cost: 250, effect: 1.05 },
  multi: { level: 0, cost: 800, effect: 1.2 },
  auto: { level: 0, cost: 1500, effect: 0 }
};

let history = [];

const rarities = [
  { name: "COMMON", color: "#a1a1aa", prob: 0.55, baseCoin: 15 },
  { name: "UNCOMMON", color: "#22c55e", prob: 0.25, baseCoin: 65 },
  { name: "RARE", color: "#3b82f6", prob: 0.12, baseCoin: 280 },
  { name: "EPIC", color: "#a855f7", prob: 0.05, baseCoin: 950 },
  { name: "LEGENDARY", color: "#eab308", prob: 0.02, baseCoin: 4200 },
  { name: "MYTHIC", color: "#ec4899", prob: 0.005, baseCoin: 18500 }
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

    const itemName = getRandomItem();
    const reward = Math.floor(selected.baseCoin * multiplier * (1 + upgrades.multi.level * 0.25));

    coins += reward;

    const rollData = { rarity: selected.name, item: itemName, reward: reward };
    history.unshift(rollData);
    if (history.length > 30) history.pop();

    totalRolls++;
    if (reward > bestPull) bestPull = reward;

    showResult(selected, itemName, reward);
    updateUI();
  }, 650);
}

function showResult(rarity, itemName, reward) {
  const resultEl = document.getElementById('result');
  resultEl.classList.remove('hidden');

  document.getElementById('rarity').innerHTML = `<span style="color: ${rarity.color}">${rarity.name}</span>`;
  document.getElementById('item-name').textContent = itemName;
  document.getElementById('item-desc').textContent = "A powerful artifact from the Aether";
  document.getElementById('reward').innerHTML = `+${reward} <i class="fa-solid fa-coins"></i>`;
}

function updateUI() {
  document.getElementById('coin-display').textContent = Math.floor(coins).toLocaleString();
  document.getElementById('total-rolls').textContent = totalRolls;
  document.getElementById('best-pull').textContent = bestPull.toLocaleString();
  document.getElementById('multiplier-display').textContent = multiplier.toFixed(1) + "x";

  renderHistory();
  renderShop();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  history.forEach(h => {
    const r = rarities.find(r => r.name === h.rarity);
    const div = document.createElement('div');
    div.className = 'bg-zinc-900 border-l-4 flex justify-between items-center p-4 rounded-2xl';
    div.style.borderColor = r.color;
    div.innerHTML = `
      <div>
        <span class="font-bold" style="color: ${r.color}">${h.rarity}</span><br>
        <span class="text-lg">${h.item}</span>
      </div>
      <div class="text-right">
        <div class="text-yellow-400 font-mono">+${h.reward}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderShop() {
  const container = document.getElementById('shop-items');
  container.innerHTML = `
    <div class="bg-zinc-900 border border-purple-500/30 rounded-3xl p-6 hover:border-purple-400 transition-all">
      <div class="flex justify-between"><div><div class="text-purple-400 text-sm">LUCK BOOST</div><div class="text-2xl font-bold">Aether Alignment</div></div><div class="text-4xl">🌟</div></div>
      <div class="my-6 text-zinc-400 text-sm">Increases chance of rare pulls</div>
      <div onclick="buyUpgrade('luck')" class="cursor-pointer bg-zinc-800 hover:bg-purple-900 text-center py-4 rounded-2xl font-bold">Level ${upgrades.luck.level} • ${Math.floor(upgrades.luck.cost * Math.pow(1.6, upgrades.luck.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="bg-zinc-900 border border-yellow-500/30 rounded-3xl p-6 hover:border-yellow-400 transition-all">
      <div class="flex justify-between"><div><div class="text-yellow-400 text-sm">COIN MULTIPLIER</div><div class="text-2xl font-bold">Golden Touch</div></div><div class="text-4xl">💰</div></div>
      <div class="my-6 text-zinc-400 text-sm">Increases coins from every roll</div>
      <div onclick="buyUpgrade('multi')" class="cursor-pointer bg-zinc-800 hover:bg-yellow-900 text-center py-4 rounded-2xl font-bold">Level ${upgrades.multi.level} • ${Math.floor(upgrades.multi.cost * Math.pow(1.7, upgrades.multi.level))} <i class="fa-solid fa-coins"></i></div>
    </div>

    <div class="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-6 hover:border-emerald-400 transition-all">
      <div class="flex justify-between"><div><div class="text-emerald-400 text-sm">AUTO ROLLER</div><div class="text-2xl font-bold">Eternal Spin</div></div><div class="text-4xl">⚡</div></div>
      <div class="my-6 text-zinc-400 text-sm">Rolls automatically every 8s</div>
      <div onclick="buyUpgrade('auto')" class="cursor-pointer bg-zinc-800 hover:bg-emerald-900 text-center py-4 rounded-2xl font-bold">Level ${upgrades.auto.level} • ${Math.floor(upgrades.auto.cost * Math.pow(2, upgrades.auto.level))} <i class="fa-solid fa-coins"></i></div>
    </div>
  `;
}

function buyUpgrade(type) {
  const upg = upgrades[type];
  const currentCost = Math.floor(upg.cost * Math.pow(type === 'auto' ? 2 : type === 'multi' ? 1.7 : 1.6, upg.level));

  if (coins < currentCost) {
    alert("Not enough coins!");
    return;
  }

  coins -= currentCost;
  upg.level++;

  if (type === 'multi') {
    multiplier = 1 + (upg.level * 0.25);
  }

  updateUI();
}

function switchTab(n) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${n}`).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === n);
  });
}

// Initialize
window.onload = () => {
  updateUI();
  switchTab(0);

  // Auto roller
  setInterval(() => {
    if (upgrades.auto.level > 0) rollDice();
  }, 8000);

  // First roll
  setTimeout(() => rollDice(), 800);
};