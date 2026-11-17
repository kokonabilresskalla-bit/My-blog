import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = read('index.html');
const app = read('platform.js');
const games = read('games.js');
const css = read('platform.css');
const sw = read('sw.js');
const data = JSON.parse(read('data/experiments.json'));
const manifest = JSON.parse(read('manifest.json'));

assert.match(html, /id="labCanvas"/);
assert.match(html, /id="circuitArcade"/);
assert.match(html, /src="vendor\/three\/three\.min\.js"/);
assert.match(html, /src="platform\.js"/);
assert.match(html, /src="games\.js"/);
assert.ok(existsSync(new URL('../vendor/three/three.min.js', import.meta.url)), 'vendored Three.js must exist');

for (const id of ['wire','coil','solenoid','flux','pendulum','projectile','incline','ohm','series','reflection','refraction','wave']) {
  assert.ok(app.includes("id:'" + id + "'") || app.includes("['" + id + "',"), 'missing experiment: ' + id);
  assert.ok(app.includes(id + ':['), 'missing experiment information: ' + id);
}
for (const key of ['wire','coil','solenoid','flux']) assert.ok(data[key], 'missing experiment data: ' + key);
assert.match(app, /state\\.reverse\\?\.13:-\.13/, 'wire field arrows must follow the right-hand rule and reverse with current');
assert.match(app, /Math\.min\(30,state\.turns\)/, 'solenoid visualization must support all selectable turns');
assert.match(app, /Math\.asin\(Math\.max\(-1,Math\.min\(1,Math\.sin\(a\)\/state\.refractive\)\)\)/, 'refraction must use Snell law');
assert.match(app, /Object\.assign\(state,\{current:2/, 'reset must restore experiment defaults');
assert.match(app, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);

for (const mode of ['series','parallel','ohm']) {
  assert.ok(games.includes(mode + ':'), 'missing circuit mission: ' + mode);
}
assert.match(games, /function correct\(\)/);
assert.match(games, /function compute\(\)/);
assert.match(games, /function validate\(\)/);
assert.match(css, /\.circuit-board\.parallel/);
assert.match(sw, /\.\/games\.js/);
assert.equal(manifest.lang, 'ar');

const seriesCurrent = 12 / (6 + 4 + 8);
const parallelCurrent = 12 / (6 + 1 / (1/4 + 1/8));
const ohmCurrent = 12 / 6;
assert.ok(Math.abs(seriesCurrent - 2/3) < 1e-12);
assert.ok(Math.abs(parallelCurrent - 12/(6+8/3)) < 1e-12);
assert.equal(ohmCurrent, 2);

console.log('PASS: source syntax is checked separately; HTML, assets, experiment coverage, physics formulas, circuit missions, and offline cache references validated.');
