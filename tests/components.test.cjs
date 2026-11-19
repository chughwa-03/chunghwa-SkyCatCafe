const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('all four pages load the shared components and expose nine close controls', () => {
  const pages = [['index.html', 2], ['index(order).html', 4], ['goods.html', 2], ['admin.html', 1]];
  for (const [name, expected] of pages) {
    const html = read(name);
    assert.match(html, /href="\.\/skycat-components\.css"/);
    assert.match(html, /src="\.\/skycat-components\.js"/);
    const tags = html.match(/<(?:button|a|label)\b[^>]*class="[^"]*\bsc-close\b[^"]*"[^>]*>/g) || [];
    assert.equal(tags.length, expected, name);
    tags.forEach(tag => {
      assert.match(tag, /aria-label="[^"]+"/);
      if (tag.startsWith('<label')) assert.match(tag, /tabindex="0"/);
    });
  }
  const css = read('skycat-components.css');
  assert.match(css, /--sc-close-size:\s*44px/);
  assert.match(css, /translate\(-50%, -50%\) rotate\(45deg\)/);
  assert.match(css, /translate\(-50%, -50%\) rotate\(-45deg\)/);
  assert.match(read('admin.js'), /classList\.toggle\('sc-close',open\)/);
});

test('label close activates once on Enter or Space and leaves native controls alone', () => {
  let handler;
  class Element {
    constructor(label) { this.label = label; this.clicks = 0; }
    matches() { return this.label; }
    click() { this.clicks++; }
  }
  vm.runInNewContext(read('skycat-components.js'), {
    Element, document: { addEventListener(type, callback) { assert.equal(type, 'keydown'); handler = callback; } }
  });
  const label = new Element(true), button = new Element(false);
  let prevented = 0;
  const key = (target, value, repeat = false) => handler({
    target, key: value, repeat, preventDefault() { prevented++; }
  });
  key(label, 'Enter'); key(label, ' '); key(label, ' ', true);
  key(label, 'Escape'); key(button, 'Enter'); key(button, ' ');
  assert.equal(label.clicks, 2);
  assert.equal(button.clicks, 0);
  assert.equal(prevented, 3);
});

test('menu descriptions and translations cover all 32 items', () => {
  const html = read('index(order).html');
  const blocks = [...html.matchAll(/<details class="menu-desc">\s*<summary>[^<]*<\/summary>\s*<p>([^<]+)<\/p>/g)];
  assert.equal(blocks.length, 32);
  assert.equal(new Set(blocks.map(m => m[1].trim())).size, 32);
  assert.doesNotMatch(html, /포트폴리오 예시|A안 · HTML·CSS 전용/);
  const descriptions = read('inder(order_Java).js').match(/const descriptions = (\[[\s\S]*?\n\]);/);
  assert.ok(descriptions);
  const rows = JSON.parse(descriptions[1]);
  assert.equal(rows.length, 32);
  rows.forEach(row => assert.equal(row.length, 2));
});
