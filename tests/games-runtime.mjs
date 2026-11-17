import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class FakeElement {
  constructor(attrs = {}, inner = '') {
    this.attrs = attrs; this.inner = inner; this.dataset = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    }
    this.onclick = null; this.listeners = {}; this.disabled = 'disabled' in attrs;
    this.textContent = ''; this.className = attrs.class || '';
    this.classList = { toggle: (name, enabled) => {
      const names = this.className.split(/\s+/).filter(Boolean);
      if (enabled && !names.includes(name)) names.push(name);
      this.className = enabled ? names.join(' ') : names.filter(x => x !== name).join(' ');
    }};
  }
  addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); }
  click() { if (!this.disabled) this.onclick?.({ target: this }); }
}
class FakeHost {
  constructor() { this.html = ''; this.elements = []; this.feedback = { textContent: '', className: '' }; }
  set innerHTML(value) {
    this.html = value; this.elements = [];
    const pattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/g; let match;
    while ((match = pattern.exec(value))) {
      const attrs = {};
      for (const attr of match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[attr[1]] = attr[2] ?? '';
      this.elements.push(new FakeElement(attrs, match[2]));
    }
  }
  get innerHTML() { return this.html; }
  querySelectorAll(selector) {
    if (selector === '[data-mode]') return this.elements.filter(x => 'mode' in x.dataset);
    if (selector === '[data-part]') return this.elements.filter(x => 'part' in x.dataset);
    if (selector === '[data-slot]') return this.elements.filter(x => 'slot' in x.dataset);
    if (selector === '.part-chip') return this.elements.filter(x => (x.attrs.class || '').includes('part-chip'));
    return [];
  }
  querySelector(selector) {
    if (selector === '.game-feedback') return this.feedback;
    if (['closeSwitch', 'checkCircuit', 'resetCircuit'].includes(selector)) return this.elements.find(x => x.attrs.id === selector) ?? null;
    return null;
  }
}
const host = new FakeHost();
const document = { getElementById: id => id === 'circuitArcade' ? host : null };
vm.runInNewContext(readFileSync(new URL('../games.js', import.meta.url), 'utf8'), { document, console, Math, Number, Object, String });

function clickData(key, value) {
  const element = host.elements.find(x => x.dataset[key] === value);
  assert.ok(element, 'Missing [data-' + key + '="' + value + '"]'); element.click();
}
function clickId(id) {
  const element = host.elements.find(x => x.attrs.id === id);
  assert.ok(element, 'Missing #' + id); element.click();
}
function place(part, slot) { clickData('part', part); clickData('slot', slot); }
function fillCircuit(resistors) {
  place('battery', 'source'); place('switch', 'switch'); place('lamp', 'lamp');
  for (const [part, slot] of resistors) place(part, slot);
}
function feedback() { return host.feedback.textContent; }

fillCircuit([['r4', 'r1'], ['r8', 'r2']]);
clickId('checkCircuit');
assert.match(feedback(), /اللمبة نورت/); assert.match(feedback(), /0\.67 A/); assert.match(feedback(), /18\.00 Ω/);

clickData('mode', 'parallel');
fillCircuit([['r4', 'r1'], ['r8', 'r2']]);
clickId('checkCircuit');
assert.match(feedback(), /اللمبة نورت/); assert.match(feedback(), /1\.38 A/); assert.match(feedback(), /8\.67 Ω/);

clickData('mode', 'ohm');
fillCircuit([['r6', 'r1']]);
clickId('checkCircuit');
assert.match(feedback(), /اللمبة نورت/); assert.match(feedback(), /2\.00 A/); assert.match(feedback(), /6\.00 Ω/);

clickId('closeSwitch');
assert.match(host.innerHTML, /اللمبة مطفأة/);
clickId('resetCircuit');
assert.equal((host.innerHTML.match(/ضع القطعة هنا/g) || []).length, 4);

fillCircuit([['r4', 'r1']]);
clickId('checkCircuit');
assert.match(feedback(), /تلف افتراضي/); assert.match(host.innerHTML, /اللمبة تالفة/);
console.log('PASS: circuit game DOM flow, series/parallel/Ohm calculations, switch opening, reset, and wrong-value failure.');
