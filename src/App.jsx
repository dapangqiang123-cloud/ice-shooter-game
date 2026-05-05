import { useEffect, useMemo, useRef, useState } from 'react';

const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 440;
const GRAVITY = 0.7;
const PLAYER_SPEED = 4.5;
const JUMP_POWER = -13;
const BULLET_SPEED = 9;

const CHARACTERS = [
  { id: 'A', name: '寒冰射手 A', color: '#56b4ff', accent: '#d4f1ff', damage: 12 },
  { id: 'B', name: '寒冰射手 B', color: '#2a8bff', accent: '#b8efff', damage: 16 },
];

const ZOMBIES = [
  { id: 'normal', name: '普通僵尸', x: 560, y: GROUND_Y - 70, w: 46, h: 70, hp: 48, speed: 1.0, color: '#64af66' },
  { id: 'tall', name: '瘦高僵尸', x: 680, y: GROUND_Y - 95, w: 34, h: 95, hp: 44, speed: 1.2, color: '#7dbb6d' },
  { id: 'fat', name: '胖僵尸', x: 780, y: GROUND_Y - 80, w: 60, h: 80, hp: 65, speed: 0.7, color: '#5f9f52' },
  { id: 'small', name: '矮小僵尸', x: 840, y: GROUND_Y - 55, w: 42, h: 55, hp: 34, speed: 1.5, color: '#83c276' },
  { id: 'bucket', name: '戴桶僵尸', x: 910, y: GROUND_Y - 85, w: 50, h: 85, hp: 90, speed: 0.8, color: '#6aaa5f' },
];

function App() {
  const [screen, setScreen] = useState('start');
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);

  return (
    <div className="app-shell">
      {screen === 'start' && <StartScreen onStart={() => setScreen('character')} />}
      {screen === 'character' && (
        <CharacterSelect
          selected={selectedCharacter}
          onSelect={setSelectedCharacter}
          onConfirm={() => setScreen('playing')}
        />
      )}
      {screen === 'playing' && (
        <GameScene
          character={selectedCharacter}
          onVictory={() => setScreen('victory')}
          onBack={() => setScreen('start')}
        />
      )}
      {screen === 'victory' && <VictoryScreen onRestart={() => setScreen('start')} />}
    </div>
  );
}

function StartScreen({ onStart }) {
  return <section className="panel"><h1>Ice Shooter Garden</h1><p>寒冰射手花园防线</p><button onClick={onStart}>开始游戏</button></section>;
}

function CharacterSelect({ selected, onSelect, onConfirm }) {
  return (
    <section className="panel">
      <h2>选择角色</h2>
      <div className="char-grid">
        {CHARACTERS.map((c) => (
          <button key={c.id} className={`char-card ${selected.id === c.id ? 'active' : ''}`} onClick={() => onSelect(c)}>
            <div className="avatar" style={{ background: c.color }} />
            <strong>{c.name}</strong>
            <span>伤害: {c.damage}</span>
          </button>
        ))}
      </div>
      <button onClick={onConfirm}>确认进入战斗</button>
    </section>
  );
}

function GameScene({ character, onVictory, onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [hp, setHp] = useState(100);
  const [wave] = useState('Wave 1/1');
  const [paused, setPaused] = useState(false);

  const keys = useMemo(() => ({ a: false, d: false, w: false, ' ': false, j: false }), []);

  useEffect(() => {
    stateRef.current = {
      player: { x: 120, y: GROUND_Y - 72, w: 45, h: 72, vx: 0, vy: 0, onGround: true, direction: 1 },
      bullets: [],
      zombies: ZOMBIES.map((z) => ({ ...z, alive: true, slowUntil: 0, hitFlash: 0 })),
      lastShootAt: 0,
      enemyDamageCooldown: 0,
      gameOver: false,
    };

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keys) keys[key] = true;
      if (key === ' ') e.preventDefault();
    };
    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keys) keys[key] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let raf;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (paused) return;
      update(ts);
      render();
    };

    const update = (ts) => {
      const s = stateRef.current;
      if (!s || s.gameOver) return;
      const p = s.player;

      p.vx = keys.a ? -PLAYER_SPEED : keys.d ? PLAYER_SPEED : 0;
      if (p.vx !== 0) p.direction = p.vx > 0 ? 1 : -1;
      if ((keys.w || keys[' ']) && p.onGround) {
        p.vy = JUMP_POWER;
        p.onGround = false;
      }
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y + p.h >= GROUND_Y) {
        p.y = GROUND_Y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
      p.x = Math.max(0, Math.min(WIDTH - p.w, p.x));

      if (keys.j && ts - s.lastShootAt > 220) {
        s.lastShootAt = ts;
        s.bullets.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, r: 8, vx: p.direction * BULLET_SPEED, damage: character.damage, alive: true });
      }

      for (const b of s.bullets) {
        if (!b.alive) continue;
        b.x += b.vx;
        if (b.x < -20 || b.x > WIDTH + 20) b.alive = false;
      }

      s.zombies.forEach((z) => {
        if (!z.alive) return;
        const slowed = ts < z.slowUntil;
        const speed = slowed ? z.speed * 0.5 : z.speed;
        const dir = p.x + p.w / 2 < z.x ? -1 : 1;
        z.x += dir * speed;
        z.hitFlash = Math.max(0, z.hitFlash - 1);
      });

      for (const b of s.bullets) {
        if (!b.alive) continue;
        for (const z of s.zombies) {
          if (!z.alive) continue;
          if (circleRectCollide(b, z)) {
            b.alive = false;
            z.hp -= b.damage;
            z.slowUntil = ts + 1500;
            z.hitFlash = 5;
            if (z.hp <= 0) z.alive = false;
            break;
          }
        }
      }

      const aliveEnemies = s.zombies.filter((z) => z.alive);
      if (!aliveEnemies.length) {
        s.gameOver = true;
        onVictory();
        return;
      }

      if (ts > s.enemyDamageCooldown) {
        for (const z of aliveEnemies) {
          if (rectCollide(p, z)) {
            s.enemyDamageCooldown = ts + 900;
            setHp((current) => {
              const next = Math.max(0, current - 10);
              if (next <= 0) {
                s.gameOver = true;
                setTimeout(onBack, 900);
              }
              return next;
            });
            break;
          }
        }
      }

      s.bullets = s.bullets.filter((b) => b.alive);
    };

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const s = stateRef.current;
      const p = s.player;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawBackground(ctx);
      ctx.fillStyle = character.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = character.accent;
      ctx.fillRect(p.x + 10, p.y + 8, 24, 20);

      ctx.fillStyle = '#8ad9ff';
      s.bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      s.zombies.forEach((z) => {
        if (!z.alive) return;
        ctx.fillStyle = z.hitFlash > 0 ? '#f9e28c' : z.color;
        ctx.fillRect(z.x, z.y, z.w, z.h);
        if (z.id === 'bucket') {
          ctx.fillStyle = '#8c949e';
          ctx.fillRect(z.x + 7, z.y - 12, z.w - 14, 12);
        }
      });
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [character, keys, onBack, onVictory, paused]);

  return (
    <section className="game-wrap">
      <div className="hud">
        <span>生命值: {hp}</span>
        <span>{wave}</span>
        <button onClick={() => setPaused((v) => !v)}>{paused ? '继续' : '暂停'}</button>
      </div>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <p>操作: A/D 移动，W/Space 跳跃，J 发射冰弹</p>
    </section>
  );
}

function VictoryScreen({ onRestart }) {
  return <section className="panel"><h2>胜利！</h2><p>僵尸全部清除，寒冰射手和朋友们在花园里吃冰激凌庆祝！</p><button onClick={onRestart}>再玩一次</button></section>;
}

function drawBackground(ctx) {
  ctx.fillStyle = '#bde8ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#e6f8ff';
  ctx.fillRect(0, 70, WIDTH, 40);
  ctx.fillStyle = '#8fcd7f';
  ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
  ctx.fillStyle = '#dfc499';
  for (let i = 0; i < WIDTH; i += 48) ctx.fillRect(i, GROUND_Y - 80, 8, 80);
  ctx.fillStyle = '#f5e4cc';
  ctx.fillRect(40, GROUND_Y - 170, 160, 170);
  ctx.fillStyle = '#db8d66';
  ctx.fillRect(40, GROUND_Y - 170, 160, 35);
}

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectCollide(c, r) {
  const closestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const closestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
  const dx = c.x - closestX;
  const dy = c.y - closestY;
  return dx * dx + dy * dy < c.r * c.r;
}

export default App;
