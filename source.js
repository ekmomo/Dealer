const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');


const TIERS = [
  { emoji: '🐣', cost: 10, income: 1, color: '#FFD700', glow: '#FFA500', bg: 'rgba(255,215,0,0.15)' },
  { emoji: '🐇', cost: 20, income: 2, color: '#FF69B4', glow: '#FF1493', bg: 'rgba(255,105,180,0.15)' },
  { emoji: '🐿️', cost: 40, income: 4, color: '#D2691E', glow: '#8B4513', bg: 'rgba(210,105,30,0.15)' },
  { emoji: '🦔', cost: 80, income: 7, color: '#708090', glow: '#2F4F4F', bg: 'rgba(112,128,144,0.15)' },
  { emoji: '🦊', cost: 160, income: 11, color: '#FF4500', glow: '#FF6347', bg: 'rgba(255,69,0,0.15)' },
  { emoji: '🦌', cost: 320, income: 16, color: '#CD853F', glow: '#8B4513', bg: 'rgba(205,133,63,0.15)' },
  { emoji: '🐴', cost: 640, income: 22, color: '#8B7355', glow: '#654321', bg: 'rgba(139,115,85,0.15)' },
  { emoji: '🦙', cost: 1280, income: 29, color: '#F5F5DC', glow: '#FFF8DC', bg: 'rgba(245,245,220,0.15)' },
  { emoji: '🐬', cost: 2560, income: 37, color: '#00CED1', glow: '#00BFFF', bg: 'rgba(0,206,209,0.15)' },
  { emoji: '🦄', cost: 10000, income: 50, color: '#FF00FF', glow: '#00FFFF', bg: 'rgba(255,0,255,0.2)' }
];

const CONFIG = {
  RADIUS: 32,
  MERGE_DIST: 55,
  GRAVITY: 0.4,
  FRICTION: 0.96,
  BOUNCE: 0.6,
  MAX_PARTICLES: 300
};

const UPGRADES = [
  { id: 'goldenHooves', emoji: '👆', desc: 'Auto Click', max: 5, cur: 'unicorn', cost: l => 1 << l, unlock: () => true },
  { id: 'luckyClover', emoji: '🍀', desc: 'Income +10%', max: 10, cur: 'rainbow', cost: l => (1 << l) * 5000, unlock: () => true },
  { id: 'starWhip', emoji: '⚡', desc: 'Click Speed +10%', max: 10, cur: 'rainbow', cost: l => (1 << l) * 3000, unlock: () => true },
  { id: 'rainbowEngine', emoji: '⚙️', desc: '+50🌈/s', max: 10, cur: 'rainbow', cost: l => (1 << l) * 8000, unlock: () => state.animals.filter(a => a.tier === 9).length >= 2 },
  { id: 'cookie', emoji: '🍪', desc: '+100🌈/s', type: 'exchange', cur: 'unicorn', cost: 10, unlock: () => state.upgrades.goldenHooves > 0 },
  { id: 'nursery', emoji: '🏠', desc: 'Auto spawn', max: 50, cur: 'rainbow', cost: l => Math.ceil(500 * Math.pow(1.15, l)), unlock: () => true },
  { id: 'rainbowMill', emoji: '🌬️', desc: 'Income +3%', max: 50, cur: 'rainbow', cost: l => Math.ceil(1000 * Math.pow(1.15, l)), unlock: () => state.totalEarned >= 200 },
  { id: 'thunderDrum', emoji: '🥁', desc: 'free buy', max: 30, cur: 'rainbow', cost: l => Math.ceil(2000 * Math.pow(1.15, l)), unlock: () => state.maxTier >= 4 },
  { id: 'luckyFountain', emoji: '⛲', desc: '+2% free buy', max: 25, cur: 'rainbow', cost: l => Math.ceil(5000 * Math.pow(1.15, l)), unlock: () => state.totalEarned >= 2000 },
  { id: 'butterfly', emoji: '🦋', desc: 'Low→high tier bonus', max: 10, cur: 'unicorn', cost: l => 3 * (1 << l), unlock: () => state.animals.length >= 15 },
  { id: 'reactor', emoji: '🏭', desc: "Cookie's Income +50%", max: 10, cur: 'unicorn', cost: l => 5 * (1 << l), unlock: () => state.cookies > 0 },
  { id: 'citadel', emoji: '✨', desc: '🦄 income +50%', max: 5, cur: 'unicorn', cost: l => 20 * (1 << l), unlock: () => state.animals.filter(a => a.tier === 9).length >= 5 }
];

const STAR_SHOP = [
  { id: 'rainbowMemory', emoji: '🌈', desc: 'Start +2000🌈', cost: 2 },
  { id: 'unicornSoul', emoji: '🦄', desc: 'Start +1🦄', cost: 5, max: 3 },
  { id: 'quickStart', emoji: '⚡', desc: '30s 2x income', cost: 3 },
  { id: 'eternalNursery', emoji: '🏠', desc: 'Nursery starts Lv5', cost: 4 },
  { id: 'goldenClover', emoji: '🍀', desc: '+1% base luck', cost: 6 },
  { id: 'cookieLegacy', emoji: '🍪', desc: 'Keep 1🍪 on rebirth', cost: 5 },
  { id: 'starBorn', emoji: '✨', desc: 'Citadel starts Lv1', cost: 8 },
  { id: 'destiny', emoji: '💫', desc: 'Keep 80%🦄 on rebirth', cost: 15 }
];


const state = {
  money: 80,
  animals: [],
  particles: [],
  texts: [],
  bgParticles: [],
  dragged: null,
  dragOff: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  time: 0,
  shake: 0,
  w: 0, h: 0,
  shopY: 0,
  plusBtn: { x: 0, y: 0, s: 52 },
  combo: 0,
  comboTimer: 0,
  slowMo: 0,
  btnPulse: 0,
  shopActive: false,
  shopOpen: false,
  upgrades: { goldenHooves: 0, luckyClover: 0, starWhip: 0, rainbowEngine: 0, nursery: 0, rainbowMill: 0, thunderDrum: 0, luckyFountain: 0, butterfly: 0, reactor: 0, citadel: 0 },
  cookies: 0,
  autoTimer: 0,
  shopBtn: { x: 0, y: 0, s: 32 },
  scene: 'title',
  transT: 0,
  waveSquares: [],
  waveMid: 0,
  waveTotal: 0,
  totalEarned: 0,
  maxTier: 0,
  maxCombo: 0,
  stardust: 0,
  star: {},
  nurseryT: 0,
  quickStartT: 0
};


function rand(a, b) { return Math.random() * (b - a) + a; }
function lerp(a, b, t) { return a + (b - a) * t; }



function collide(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy, minD = a.r + b.r;
  if (d2 >= minD * minD || d2 === 0) return 0;
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, overlap = minD - d;
  if (b.static) {
    a.x += nx * overlap; a.y += ny * overlap;
    const dot = a.vx * nx + a.vy * ny;
    if (dot < 0) { a.vx -= 2 * dot * nx; a.vy -= 2 * dot * ny; a.vx *= 0.7; a.vy *= 0.7; }
  } else {
    const p = overlap * 0.08;
    a.vx += nx * p; a.vy += ny * p; b.vx -= nx * p; b.vy -= ny * p;
  }
  return d;
}


class Animal {
  constructor(tier, x, y) {
    this.tier = tier;
    this.x = x; this.y = y;
    this.vx = rand(-2, 2); this.vy = rand(-1, 1);
    this.r = CONFIG.RADIUS;
    this.scale = 0;
    this.targetScale = 1;
    this.pulse = 0;
    this.income = 0;
    this.flash = 0;
    this.birth = state.time;
    this.id = Math.random();
    this.dragScale = 1;
  }

  update() {

    this.scale = lerp(this.scale, this.targetScale, 0.12);

    this.pulse = Math.sin(state.time * 0.08 + this.id * 10) * 0.06 + 1;

    if (state.dragged === this) {
      this.dragScale = lerp(this.dragScale, 1.15, 0.2);
    } else {
      this.dragScale = lerp(this.dragScale, 1, 0.15);
    }


    if (state.dragged !== this) {
      this.vy += CONFIG.GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      const floor = state.shopY - this.r;
      if (this.y > floor) {
        this.y = floor;
        this.vy *= -CONFIG.BOUNCE;
        this.vx *= CONFIG.FRICTION;
        if (Math.abs(this.vy) > 2) this.flash = 1;
      }
      if (this.x < this.r) { this.x = this.r; this.vx *= -0.5; }
      if (this.x > state.w - this.r) { this.x = state.w - this.r; this.vx *= -0.5; }
      if (this.y < this.r) { this.y = this.r; this.vy *= -0.5; }


      const pb = state.plusBtn;
      collide(this, { x: pb.x + pb.s / 2, y: pb.y + pb.s / 2, r: pb.s / 2, static: true });


      for (let other of state.animals) {
        if (other === this || other.dead) continue;
        const d = collide(this, other);
        if (d && this.tier === other.tier && this.tier < 9 && d < CONFIG.MERGE_DIST && !this.merging && !other.merging) {
          this.merging = other.merging = true;
          merge(this, other);
        }
      }
    }


    this.income += 1 / 60;
    if (this.income >= 1) {
      this.income = 0;
      let mult = (1 + (state.upgrades.luckyClover || 0) * 0.1) * (1 + (state.upgrades.rainbowMill || 0) * 0.03) * (1 + state.stardust * 0.01) * (1 + (state.star.goldenClover || 0) * 0.01);
      if (state.quickStartT > 0) mult *= 2;
      if (this.tier === 9) {
        mult *= 1 + (state.upgrades.citadel || 0) * 0.5;
        if (state.upgrades.citadel >= 5) mult *= 10;
      }
      if (state.upgrades.butterfly) mult *= 1 + state.upgrades.butterfly * 0.01 * Math.min(1, state.animals.length / 20);
      const val = Math.ceil(TIERS[this.tier].income * mult);
      state.money += val;
      state.totalEarned += val;
      spawnText('+' + val + '🌈', this.x, this.y - this.r - 10, TIERS[this.tier].color);

      for (let i = 0; i < 3; i++) spawnParticle(this.x, this.y, TIERS[this.tier].color, 'sparkle', 1);
    }

    if (this.flash > 0) this.flash -= 0.1;
  }

  draw(ctx) {
    const t = TIERS[this.tier];
    const r = this.r * this.scale * this.pulse * this.dragScale;

    ctx.save();
    ctx.translate(this.x, this.y);


    if (this.tier === 9) {
      ctx.save();
      ctx.rotate(state.time * 0.02);
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsl(${(state.time * 2 + i * 45) % 360}, 100%, 50%)`;
        ctx.fillStyle = `hsla(${(state.time * 2 + i * 45) % 360}, 100%, 60%, 0.3)`;
        ctx.fillRect(r + 5, -2, 12, 4);
      }
      ctx.restore();
    }


    ctx.shadowBlur = this.tier === 9 ? 30 : (state.dragged === this ? 25 : 15);
    ctx.shadowColor = t.glow;


    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = t.bg;
    ctx.fill();


    ctx.strokeStyle = this.flash > 0 ? '#fff' : t.color;
    ctx.lineWidth = this.flash > 0 ? 3 : 2;
    ctx.stroke();


    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, -Math.PI / 2, -Math.PI / 2 + this.income * Math.PI * 2);
    ctx.strokeStyle = t.glow;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();


    ctx.shadowBlur = 0;
    ctx.font = `${r * 1.3}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.emoji, 0, 2);

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, type, lifeScale = 1) {
    this.x = x; this.y = y;
    this.color = color;
    this.type = type;
    this.life = 1;
    this.decay = rand(0.02, 0.04) / lifeScale;
    const ang = rand(0, Math.PI * 2);
    const spd = rand(1, 6);
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.size = rand(2, 6);
    this.rot = rand(0, Math.PI);
    this.rotSpeed = rand(-0.2, 0.2);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.vx *= 0.97;
    this.life -= this.decay;
    this.size *= 0.96;
    this.rot += this.rotSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    if (this.type === 'burst') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else if (this.type === 'sparkle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'star') {
      drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 3);
    }
    ctx.restore();
  }
}

class FloatingText {
  constructor(text, x, y, color) {
    this.text = text; this.x = x; this.y = y;
    this.color = color; this.life = 1; this.vy = -1.5;
  }
  update() { this.y += this.vy; this.life -= 0.025; }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

class BgParticle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = rand(0, state.w);
    this.y = rand(0, state.h);
    this.size = rand(1, 3);
    this.speed = rand(0.2, 0.8);
    this.alpha = rand(0.1, 0.4);
    this.color = Math.random() > 0.5 ? '#00f7ff' : '#bc00ff';
  }
  update() {
    this.y -= this.speed;
    if (this.y < 0) this.reset();
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}



function merge(a, b) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const newTier = a.tier + 1;

  a.dead = true; b.dead = true;
  state.animals = state.animals.filter(x => !x.dead);

  const neo = new Animal(newTier, mx, my);
  neo.vy = -6;
  state.animals.push(neo);
  if (newTier === 9) state.shopActive = true;

  state.maxTier = Math.max(state.maxTier, newTier);
  state.combo++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.comboTimer = 60;


  const t = TIERS[newTier];
  spawnMergeFX(mx, my, t.color, t.glow);
  state.shake = 4;
  state.slowMo = 5;

  spawnText(`${t.emoji}!`, mx, my - 50, '#fff');
}

function spawnMergeFX(x, y, color, glow) {

  for (let i = 0; i < 25; i++) spawnParticle(x, y, color, 'burst');

  for (let i = 0; i < 15; i++) spawnParticle(x, y, '#fff', 'sparkle');

  for (let i = 0; i < 8; i++) spawnParticle(x, y, glow, 'star');

  const ring = new Particle(x, y, color, 'ring');
  ring.vx = ring.vy = 0;
  ring.decay = 0.03;
  ring.size = 15;
  state.particles.push(ring);
}

function spawnParticle(x, y, color, type, scale = 1) {
  if (state.particles.length >= CONFIG.MAX_PARTICLES) state.particles.shift();
  state.particles.push(new Particle(x, y, color, type, scale));
}

function spawnText(text, x, y, color) {
  state.texts.push(new FloatingText(text, x, y, color));
}

function drawStar(ctx, cx, cy, spikes, outer, inner) {
  let rot = Math.PI / 2 * 3;
  let x = cx, y = cy;
  let step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outer;
    y = cy + Math.sin(rot) * outer;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * inner;
    y = cy + Math.sin(rot) * inner;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outer);
  ctx.closePath();
}


function drawBackground() {
  const w = state.w, h = state.h;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a0525');
  g.addColorStop(0.6, '#0a0a1a');
  g.addColorStop(1, '#050505');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawPlusBtn() {
  const b = state.plusBtn;
  const cx = b.x + b.s / 2, cy = b.y + b.s / 2, r = b.s / 2;
  const hover = Math.hypot(state.mouse.x - cx, state.mouse.y - cy) < r;
  const pulse = 0.8 + Math.sin(state.time * 0.1) * 0.2;
  const p = state.btnPulse;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(1 + p * 0.35, 1 + p * 0.35);
  ctx.shadowBlur = (hover ? 25 : 15 * pulse) + p * 40;
  ctx.shadowColor = '#00f7ff';
  ctx.fillStyle = p > 0.1 ? `rgba(0,247,255,${0.3 + p * 0.4})` : (hover ? 'rgba(0,247,255,0.3)' : 'rgba(0,247,255,0.15)');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p > 0.1 ? '#fff' : '#00f7ff';
  ctx.lineWidth = (hover ? 3 : 2) + p * 3;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `bold ${b.s * 0.6}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('+', 0, 1);
  ctx.restore();
  if (state.upgrades.goldenHooves > 0) {
    const n = state.upgrades.goldenHooves;
    for (let i = 0; i < n; i++) {
      const ang = state.time * 0.04 + i * (Math.PI * 2 / n);
      const tap = Math.abs(Math.sin(state.time * 0.15 + i * 2));
      ctx.save();
      ctx.font = '18px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('👆', cx + Math.cos(ang) * (r + 18), cy + Math.sin(ang) * (r + 18) + tap * 4);
      ctx.restore();
    }
  }
}

function drawUI() {

  ctx.save();
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  const moneyText = '🌈 ' + Math.floor(state.money).toLocaleString();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#FFD700';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(moneyText, 20, 45);

  const unicorns = state.animals.filter(a => a.tier === 9).length;
  let tx = 20 + ctx.measureText(moneyText).width + 20;
  if (unicorns > 0) {
    ctx.shadowColor = '#FF00FF';
    ctx.fillStyle = '#fff';
    ctx.fillText('🦄 ' + unicorns, tx, 45);
    tx += ctx.measureText('🦄 ' + unicorns).width + 15;
  }
  if (state.cookies > 0) {
    ctx.shadowColor = '#c8a165';
    ctx.fillStyle = '#c8a165';
    ctx.fillText('🍪 ' + state.cookies, tx, 45);
    tx += ctx.measureText('🍪 ' + state.cookies).width + 15;
  }
  if (state.stardust > 0) {
    ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⭐ ' + state.stardust, tx, 45);
  }
  ctx.restore();

  if (state.totalEarned >= 100000) {
    const gain = Math.floor(Math.pow(state.totalEarned / 100000, 1 / 3));
    const blink = Math.sin(state.time * 0.08) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.shadowBlur = 15; ctx.shadowColor = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌟 Rebirth available: +' + gain + '⭐', state.w / 2, state.h - 30);
    ctx.restore();
  }

  if (state.shopActive) {
    state.shopBtn = { x: state.w - 56, y: 20, s: 36 };
    const sb = state.shopBtn, scx = sb.x + sb.s / 2, scy = sb.y + sb.s / 2;
    const shover = Math.hypot(state.mouse.x - scx, state.mouse.y - scy) < sb.s / 2;
    ctx.save();
    ctx.shadowBlur = shover ? 20 : 12;
    ctx.shadowColor = '#00f7ff';
    ctx.fillStyle = state.shopOpen ? 'rgba(0,247,255,0.4)' : (shover ? 'rgba(0,247,255,0.3)' : 'rgba(0,247,255,0.15)');
    ctx.beginPath(); ctx.arc(scx, scy, sb.s / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00f7ff'; ctx.lineWidth = shover ? 2.5 : 2;
    ctx.beginPath(); ctx.arc(scx, scy, sb.s / 2, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = '18px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🛒', scx, scy);
    ctx.restore();
  }


  if (state.combo > 1) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = `hsl(${state.time * 5 % 360}, 100%, 70%)`;
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.combo} combo!`, state.w / 2, 50);
    ctx.restore();
  }

  if (state.slowMo > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 0, state.w, state.h);
    ctx.restore();
  }
}

let shopEl;

function initShopDOM() {
  shopEl = document.createElement('div');
  shopEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;max-height:80vh;overflow-x:hidden;overflow-y:auto;background:rgba(10,5,20,0.95);border:2px solid #00f7ff;border-radius:14px;padding:12px;display:none;z-index:100;font-family:sans-serif;color:#fff;box-shadow:0 0 40px rgba(0,247,255,0.2);-webkit-overflow-scrolling:touch;';
  shopEl.addEventListener('click', e => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id === '__close') { state.shopOpen = false; shopEl.style.display = 'none'; }
    else if (id === '__rebirth') rebirth();
    else if (id.startsWith('star:')) { buyStarShop(id.slice(5)); updateShopDOM(); }
    else { buyUpgrade(id); updateShopDOM(); }
  });
  document.body.appendChild(shopEl);
}

function updateShopDOM() {
  if (!shopEl || !state.shopOpen) return;
  const uni = state.animals.filter(a => a.tier === 9).length;
  const chicks = state.animals.filter(a => a.tier === 0).length;
  const visible = UPGRADES.filter(u => !u.unlock || u.unlock());
  let h = '<div style="display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:bold;color:#00f7ff;margin-bottom:8px;padding-bottom:8px;position:sticky;top:0;z-index:10;background:rgba(10,5,20,0.98);border-bottom:1px solid rgba(0,247,255,0.15);">SHOP<button data-id="__close" style="position:absolute;right:0;cursor:pointer;color:#f55;font-size:14px;padding:2px 8px;border-radius:6px;background:rgba(255,80,80,0.15);border:none;">✕</button></div>';
  for (const u of visible) {
    const ex = u.type === 'exchange';
    const lv = ex ? state.cookies : state.upgrades[u.id];
    const maxed = !ex && lv >= u.max;
    const cost = ex ? u.cost : u.cost(lv);
    const afford = !maxed && (u.cur === 'unicorn' ? uni >= cost : ex ? chicks >= cost : state.money >= cost);
    const ci = u.cur === 'unicorn' ? '🦄' : ex ? '🐣' : '🌈';
    h += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;margin-bottom:6px;border-radius:10px;background:' + (afford ? 'rgba(0,247,255,0.08)' : 'rgba(255,255,255,0.03)') + ';">' +
      '<span style="font-size:24px;flex-shrink:0;">' + u.emoji + '</span>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:bold;">' + u.desc + '</div><div style="font-size:10px;color:#888;">' + (ex ? 'Owned: ' + lv : 'Lv ' + lv + '/' + u.max) + '</div></div>' +
      '<button data-id="' + u.id + '" style="flex-shrink:0;background:' + (maxed ? 'rgba(80,80,80,0.3)' : afford ? 'rgba(0,200,100,0.3)' : 'rgba(200,50,50,0.2)') + ';color:' + (maxed ? '#666' : afford ? '#0f8' : '#f55') + ';border:none;border-radius:8px;padding:6px 12px;font-size:11px;font-weight:bold;cursor:pointer;white-space:nowrap;">' + (maxed ? 'MAX' : cost + ci) + '</button>' +
      '</div>';
  }
  if (state.totalEarned >= 100000) {
    const gain = Math.floor(Math.pow(state.totalEarned / 100000, 1 / 3));
    h += '<div style="margin-top:10px;padding:10px;border:2px solid #FFD700;border-radius:10px;text-align:center;">' +
      '<div style="font-size:13px;color:#FFD700;font-weight:bold;">🌟 Rebirth → +' + gain + '⭐</div>' +
      '<div style="font-size:10px;color:#888;margin:4px 0;">Reset all, keep ⭐ & 50%🦄</div>' +
      '<button data-id="__rebirth" style="background:rgba(255,215,0,0.2);color:#FFD700;border:1px solid #FFD700;border-radius:8px;padding:6px 20px;font-size:12px;font-weight:bold;cursor:pointer;">REBIRTH</button></div>';
  }
  if (state.stardust > 0) {
    h += '<div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;"><div style="font-size:13px;color:#FFD700;font-weight:bold;margin-bottom:6px;">⭐ Star Shop (' + state.stardust + ')</div>';
    for (const s of STAR_SHOP) {
      const owned = state.star[s.id] || 0;
      const maxed = s.max && owned >= s.max;
      const afford = !maxed && state.stardust >= s.cost;
      h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin-bottom:4px;border-radius:8px;background:' + (afford ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)') + ';">' +
        '<span style="font-size:20px;">' + s.emoji + '</span>' +
        '<div style="flex:1;min-width:0;"><div style="font-size:11px;font-weight:bold;">' + s.desc + '</div>' + (s.max ? '<div style="font-size:10px;color:#888;">' + owned + '/' + s.max + '</div>' : '') + '</div>' +
        '<button data-id="star:' + s.id + '" style="background:' + (maxed ? 'rgba(80,80,80,0.3)' : afford ? 'rgba(255,215,0,0.2)' : 'rgba(200,50,50,0.15)') + ';color:' + (maxed ? '#666' : afford ? '#FFD700' : '#f55') + ';border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:bold;cursor:pointer;">' + (maxed ? 'MAX' : s.cost + '⭐') + '</button>' +
        '</div>';
    }
    h += '</div>';
  }
  shopEl.innerHTML = h;
}

function toggleShop() {
  state.shopOpen = !state.shopOpen;
  if (shopEl) shopEl.style.display = state.shopOpen ? 'block' : 'none';
  if (state.shopOpen) updateShopDOM();
}

function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (u.type === 'exchange') {
    const src = state.animals.filter(a => a.tier === (u.cur === 'unicorn' ? 9 : 0));
    if (src.length < u.cost) return;
    for (let i = 0; i < u.cost; i++) src[i].dead = true;
    state.animals = state.animals.filter(a => !a.dead);
    state.cookies++;
    spawnText('🍪!', state.w / 2, state.h / 2, '#c8a165');
    state.shake = 6;
    return;
  }
  const lv = state.upgrades[id];
  if (lv >= u.max) return;
  const cost = u.cost(lv);
  if (u.cur === 'unicorn') {
    const unicorns = state.animals.filter(a => a.tier === 9);
    if (unicorns.length < cost) return;
    for (let i = 0; i < cost; i++) unicorns[i].dead = true;
    state.animals = state.animals.filter(a => !a.dead);
  } else {
    if (state.money < cost) return;
    state.money -= cost;
  }
  state.upgrades[id]++;
  spawnText(u.emoji + ' Lv' + state.upgrades[id], state.w / 2, state.h / 2, '#0ff');
  state.shake = 6;
}

function rebirth() {
  const gain = Math.floor(Math.pow(state.totalEarned / 100000, 1 / 3));
  if (gain <= 0) return;
  state.stardust += gain;
  const keepRate = state.star.destiny ? 0.8 : 0.5;
  const keptUni = Math.floor(state.animals.filter(a => a.tier === 9).length * keepRate);
  const keptCookie = state.star.cookieLegacy ? 1 : 0;
  state.money = (state.star.rainbowMemory ? 2000 : 0) + state.stardust * 500;
  state.animals = []; state.particles = []; state.texts = [];
  state.combo = 0; state.comboTimer = 0;
  state.totalEarned = 0; state.maxTier = 0; state.maxCombo = 0;
  state.cookies = keptCookie;
  state.upgrades = {
    goldenHooves: 0, luckyClover: 0, starWhip: 0, rainbowEngine: 0,
    nursery: state.star.eternalNursery ? 5 : 0, rainbowMill: 0,
    thunderDrum: 0, luckyFountain: 0, butterfly: 0, reactor: 0,
    citadel: state.star.starBorn ? 1 : 0
  };
  state.nurseryT = 0;
  state.quickStartT = state.star.quickStart ? 1800 : 0;
  state.shopActive = false; state.shopOpen = false;
  if (shopEl) shopEl.style.display = 'none';
  for (let i = 0; i < keptUni + (state.star.unicornSoul || 0); i++)
    state.animals.push(new Animal(9, state.w / 2 + rand(-60, 60), 80));
  state.time = 0;
  startTransition();
}

function buyStarShop(id) {
  const s = STAR_SHOP.find(x => x.id === id);
  if (state.stardust < s.cost) return;
  if (s.max && (state.star[id] || 0) >= s.max) return;
  state.stardust -= s.cost;
  state.star[id] = (state.star[id] || 0) + 1;
}

function autoClick() {
  const arr = TIERS.filter(i => state.money >= i.cost).map((t, i) => i);
  if (!arr.length) return;
  const tier = arr[Math.floor(Math.random() * arr.length)];
  state.money -= TIERS[tier].cost;
  state.animals.push(new Animal(tier, state.w / 2 + rand(-60, 60), 80));
  const b = state.plusBtn;
  state.btnPulse = Math.max(state.btnPulse, 0.4);
  for (let i = 0; i < 5; i++) spawnParticle(b.x + b.s / 2, b.y + b.s / 2, TIERS[tier].color, 'sparkle');
}

function drawTitleContent(anim) {
  const cx = state.w / 2, cy = state.h / 2, t = state.time;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const bob = anim ? Math.sin(t * 0.04) * 8 : 0;
  ctx.font = '72px serif';
  ctx.shadowBlur = 30; ctx.shadowColor = '#FF00FF';
  ctx.fillText('🦄', cx, cy - 80 + bob);
  const pulse = anim ? Math.sin(t * 0.05) * 0.05 + 1 : 1;
  ctx.shadowBlur = 25 * pulse; ctx.shadowColor = '#FF00FF';
  ctx.font = 'bold ' + (42 * pulse) + 'px sans-serif'; ctx.fillStyle = '#fff';
  ctx.fillText('Dealer 独角大亨', cx, cy + 20);
  if (anim) {
    const blink = Math.sin(t * 0.08) * 0.4 + 0.6;
    ctx.shadowBlur = 20 * blink; ctx.shadowColor = '#FFD700';
    ctx.font = 'bold ' + (18 * (1 + Math.sin(t * 0.08) * 0.05)) + 'px sans-serif';
    ctx.fillStyle = 'rgba(255,215,0,' + blink + ')';
    ctx.fillText('Tap to Start', cx, cy + 90);
  }
  ctx.restore();
}

function drawTitleScreen() {
  drawBackground();
  state.bgParticles.forEach(p => { p.update(); p.draw(ctx); });
  drawTitleContent(true);
}

function startTransition() {
  state.scene = 'transition';
  state.transT = 0;
  const gs = 32, cx = state.w / 2, cy = state.h / 2;
  const maxD = Math.hypot(cx, cy), spread = 20, grow = 10, hold = 6;
  state.waveMid = spread + grow + hold;
  state.waveTotal = state.waveMid + spread + grow;
  state.waveSquares = [];
  for (let y = -gs; y < state.h + gs; y += gs) {
    for (let x = -gs; x < state.w + gs; x += gs) {
      const d = Math.hypot(x - cx, y - cy);
      state.waveSquares.push({ x, y, s: gs, delay: d / maxD * spread + rand(-2, 2), hue: (d * 0.8) % 360 });
    }
  }
}

function drawTransitionScreen() {
  const t = state.transT, mid = state.waveMid;
  if (t < mid) {
    drawBackground();
    state.bgParticles.forEach(p => { p.update(); p.draw(ctx); });
    drawTitleContent(true);
  } else {
    drawBackground();
    state.animals.sort((a, b) => a.y - b.y).forEach(a => a.draw(ctx));
    drawPlusBtn();
    drawUI();
  }
  ctx.save();
  for (const sq of state.waveSquares) {
    let size = 0;
    if (t >= sq.delay && t < sq.delay + 10) size = sq.s * (t - sq.delay) / 10;
    else if (t < mid + sq.delay) size = sq.s;
    else if (t < mid + sq.delay + 10) size = sq.s * (1 - (t - mid - sq.delay) / 10);
    if (size > 0) {
      ctx.fillStyle = 'hsl(' + ((sq.hue + state.transT * 3) % 360) + ',85%,55%)';
      ctx.shadowBlur = 8; ctx.shadowColor = ctx.fillStyle;
      ctx.fillRect(sq.x - size / 2, sq.y - size / 2, size, size);
    }
  }
  ctx.restore();
}


function loop() {
  requestAnimationFrame(loop);

  if (state.scene === 'title') {
    state.time++;
    drawTitleScreen();
    return;
  }
  if (state.scene === 'transition') {
    state.time++;
    drawTransitionScreen();
    state.transT++;
    if (state.transT >= state.waveTotal) state.scene = 'game';
    return;
  }

  if (state.slowMo > 0) {
    state.slowMo--;
    if (state.time % 2 === 0) return;
  }

  state.time++;


  if (state.comboTimer > 0) {
    state.comboTimer--;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  if (state.upgrades.goldenHooves > 0) {
    const rate = state.upgrades.goldenHooves * (1 + state.upgrades.starWhip * 0.1);
    state.autoTimer += rate / 60;
    while (state.autoTimer >= 1) { state.autoTimer--; autoClick(); }
  }

  if (state.cookies) state.money += state.cookies * 100 * (1 + (state.upgrades.reactor || 0) * 0.5) / 60;
  if (state.upgrades.rainbowEngine) state.money += state.upgrades.rainbowEngine * 50 / 60;
  if (state.upgrades.citadel >= 3) state.money += state.animals.filter(a => a.tier === 9).length * 100 / 60;

  if (state.upgrades.nursery > 0) {
    const lv = state.upgrades.nursery + (state.star.eternalNursery ? 5 : 0);
    state.nurseryT++;
    if (state.nurseryT >= Math.max(3, 15 - lv) * 60) {
      state.nurseryT = 0;
      let t = lv >= 10 && Math.random() < 0.2 ? 1 : 0;
      if (lv >= 25) t = Math.min(2, Math.floor(rand(0, lv >= 50 ? 3 : 2)));
      state.animals.push(new Animal(t, state.w / 2 + rand(-60, 60), 80));
      if (lv >= 50) state.animals.push(new Animal(t, state.w / 2 + rand(-60, 60), 80));
    }
  }

  if (state.quickStartT > 0) state.quickStartT--;


  state.animals.forEach(a => a.update());
  state.particles.forEach(p => p.update());
  state.texts.forEach(t => t.update());

  state.particles = state.particles.filter(p => p.life > 0);
  state.texts = state.texts.filter(t => t.life > 0);

  if (state.shake > 0.5) state.shake *= 0.9;
  if (state.btnPulse > 0.01) state.btnPulse *= 0.85;


  ctx.save();
  if (state.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  drawBackground();


  if (state.dragged) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(state.dragged.x, state.dragged.y);
    ctx.lineTo(state.mouse.x, state.mouse.y);
    ctx.stroke();
    ctx.restore();
  }


  state.animals.sort((a, b) => a.y - b.y).forEach(a => a.draw(ctx));
  state.particles.forEach(p => p.draw(ctx));
  state.texts.forEach(t => t.draw(ctx));

  drawPlusBtn();
  drawUI();

  if (state.shopOpen && state.time % 30 === 0) updateShopDOM();

  ctx.restore();
}


bgm = (_ => {
  let ctx, timer, nextT = 0, beat = 0, bpm = 120;

  const $ = (t, f, g, d, type = 'sine') => {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = type; o.connect(a); a.connect(ctx.destination);
    o.frequency.setValueAtTime(f, t);
    if (d > 0.05) o.frequency.exponentialRampToValueAtTime(f * 0.01, t + d);
    a.gain.setValueAtTime(g, t);
    a.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.start(t); o.stop(t + d);
  };

  const noise = (t, g, d) => {
    const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate);
    const data = b.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
    const a = ctx.createGain(); s.connect(f); f.connect(a); a.connect(ctx.destination);
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.start(t); s.stop(t + d);
  };

  const tick = () => {
    const spb = 60 / bpm, look = 0.1;
    while (nextT < ctx.currentTime + look) {
      const p = beat % 4;
      if (p === 0) { $(nextT, 150, 0.9, 0.4); $(nextT, 55, 0.5, 0.3); }
      if (p === 2) { $(nextT, 150, 0.7, 0.4); noise(nextT, 0.35, 0.12); }
      if (p === 1 || p === 3) $(nextT, 8000, 0.06, 0.03, 'square');

      if (Math.random() > 0.7) {
        const notes = [523, 587, 659, 698, 784, 880];
        $(nextT + spb * 0.5, notes[beat % notes.length], 0.1, 0.25);
      }
      nextT += spb; beat++;
    }
  };

  return {
    start() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      nextT = ctx.currentTime + 0.05;
      beat = 0;
      timer = setInterval(tick, 25);
    },
    stop() {
      if (!ctx) return;
      clearInterval(timer);
      ctx.close();
      ctx = null;
    },
    setBPM(v) { bpm = v; }
  };
})();


function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const c = e.touches ? e.touches[0] : e;
  return {
    x: (c.clientX - rect.left) * (canvas.width / rect.width),
    y: (c.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function onDown(e) {
  if (e.touches) e.preventDefault();
  if (state.scene === 'title') {
    startTransition();
    setTimeout(_ => bgm.start(), 500);
    return;
  }
  if (state.scene === 'transition') return;
  const p = getPos(e);
  state.mouse = p;
  setTimeout(_ => bgm.start(), 500);

  if (state.shopActive) {
    const sb = state.shopBtn;
    if (Math.hypot(p.x - (sb.x + sb.s / 2), p.y - (sb.y + sb.s / 2)) < sb.s / 2) {
      toggleShop();
      return;
    }
  }

  const b = state.plusBtn;
  const bcx = b.x + b.s / 2, bcy = b.y + b.s / 2;
  if (Math.hypot(p.x - bcx, p.y - bcy) < b.s / 2) {
    const arr = TIERS.filter(i => state.money >= i.cost).map((t, i) => i);
    if (arr.length) {
      const tier = arr.sort(_ => Math.random() * 2 - 1)[0];
      state.money -= TIERS[tier].cost;
      const td = Math.floor((state.upgrades.thunderDrum || 0) / 5);
      for (let k = 0; k <= td; k++) state.animals.push(new Animal(tier, state.w / 2 + rand(-60, 60), 80));
      if ((state.upgrades.luckyFountain || 0) > 0 && Math.random() < 0.02 * state.upgrades.luckyFountain)
        state.animals.push(new Animal(Math.floor(rand(0, 9)), state.w / 2 + rand(-60, 60), 80));
      state.btnPulse = 1; state.shake = Math.max(state.shake, 5);
      for (let i = 0; i < 20; i++) spawnParticle(bcx, bcy, TIERS[tier].color, 'burst');
      const ring = new Particle(bcx, bcy, '#00f7ff', 'ring');
      ring.vx = ring.vy = 0; ring.decay = 0.05; ring.size = 12;
      state.particles.push(ring);
    }
    return;
  }


  for (let i = state.animals.length - 1; i >= 0; i--) {
    const a = state.animals[i];
    if (Math.hypot(p.x - a.x, p.y - a.y) < a.r) {
      state.dragged = a;
      state.dragOff = { x: p.x - a.x, y: p.y - a.y };
      a.vx = a.vy = 0;
      return;
    }
  }
}

function onMove(e) {
  if (e.touches) e.preventDefault();
  const p = getPos(e);
  state.mouse = p;
  if (state.dragged) {
    state.dragged.x = p.x - state.dragOff.x;
    state.dragged.y = p.y - state.dragOff.y;

    if (state.time % 3 === 0) {
      spawnParticle(state.dragged.x, state.dragged.y, TIERS[state.dragged.tier].glow, 'trail', 0.5);
    }
  }
}

function onUp(e) {
  if (!state.dragged) return;

  state.dragged = null;
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.w = canvas.width;
  state.h = canvas.height;
  state.shopY = state.h;
  state.plusBtn = { x: state.w - 92, y: state.h - 92, s: 52 };

  while (state.bgParticles.length < 40) state.bgParticles.push(new BgParticle());
}
window.addEventListener('resize', resize);

canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
window.addEventListener('touchend', onUp);


resize();
initShopDOM();
loop();
