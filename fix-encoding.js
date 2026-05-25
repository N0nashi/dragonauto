const fs = require('fs');

// CORRECT CP1251 byte -> unicode table (bytes 0x80-0xFF)
// Source: https://www.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WindowsBestFit/bestfit1251.txt
const cp1251 = [
  // 0x80-0x9F (special Windows chars)
  0x0402,0x0403,0x201A,0x0453,0x201E,0x2026,0x2020,0x2021,
  0x20AC,0x2030,0x0409,0x2039,0x040A,0x040C,0x040B,0x040F,
  0x0452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,
  0x0000,0x2122,0x0459,0x203A,0x045A,0x045C,0x045B,0x045F,
  // 0xA0-0xFF
  0x00A0,0x040E,0x045E,0x0408,0x00A4,0x0490,0x00A6,0x00A7,
  0x0401,0x00A9,0x0404,0x00AB,0x00AC,0x00AD,0x00AE,0x0407,
  0x00B0,0x00B1,0x0406,0x0456,0x0491,0x00B5,0x00B6,0x00B7,
  0x0451,0x2116,0x0454,0x00BB,0x0458,0x0405,0x0455,0x0457,
  0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,
  0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,
  0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,
  0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,
  0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,
  0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,
  0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,
  0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F
];

// Build unicode -> cp1251 byte (forward: given unicode char, get its cp1251 byte)
const uniToCp = new Map();
for (let i = 0; i < 128; i++) uniToCp.set(i, i);
for (let i = 0; i < cp1251.length; i++) {
  if (cp1251[i]) uniToCp.set(cp1251[i], i + 128);
}

// Given a string: for each char, look up cp1251 byte; collect bytes; decode as UTF-8
function fixMojibake(str) {
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (uniToCp.has(cp)) {
      bytes.push(uniToCp.get(cp));
    } else {
      // Unknown – keep raw UTF-8 bytes
      for (const b of Buffer.from(ch, 'utf8')) bytes.push(b);
    }
  }
  try {
    return Buffer.from(bytes).toString('utf8');
  } catch (e) {
    return str;
  }
}

// Given a string: re-garble it (encode each char as UTF-8 bytes, each byte as CP1251 char, encode as UTF-8)
// This is the INVERSE of fixMojibake – produces the mojibake form of the input
function toMojibake(str) {
  const chars = [];
  for (const b of Buffer.from(str, 'utf8')) {
    if (b < 128) {
      chars.push(String.fromCodePoint(b)); // ASCII
    } else {
      // Look up cp1251 codepoint for this byte
      const cp = cp1251[b - 128];
      if (cp) chars.push(String.fromCodePoint(cp));
      else chars.push(String.fromCodePoint(b)); // fallback
    }
  }
  return chars.join('');
}

const filePath = 'C:/Users/N0nashi/dragonauto/client/src/pages/AdminPage.jsx';
const rawBuf = fs.readFileSync(filePath);

let start = 0;
if (rawBuf[0] === 0xEF && rawBuf[1] === 0xBB && rawBuf[2] === 0xBF) {
  start = 3;
  console.log('BOM stripped');
}

const current = rawBuf.slice(start).toString('utf8');

// The file was fixed twice (both times with the old wrong table that had
// 0x9A=0x045A, 0x9C=0x045C, 0x9D=0x045D instead of correct values).
// Step 1: undo the two wrong fixes by re-garbling twice using CORRECT toMojibake.
// Step 2: apply one correct fixMojibake.
// Net effect: 3 ops total = 1 correct fix of the original garbled file.

const step1 = toMojibake(current);   // undo 2nd wrong fix
const step2 = toMojibake(step1);     // undo 1st wrong fix (back to original garble)
const fixed = fixMojibake(step2);    // apply correct fix

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Done. Checking strings:');

const checks = [
  ['Выберите…', true],
  ['—', true],
  ['₽', true],
  ['Чат с клиентами', true],
  ['Загрузка', true],
  ['Нет открытых диалогов', true],
  ['Гость', true],
  ['Активный', true],
  ['Ожидает', true],
  ['Год: 1900', true],
  ['Цена: 1 —', true],
  ['Мощность: 1 —', true],
  ['Пробег: 0 —', true],
  ['Нет позиций', true],
];

let allOk = true;
for (const [s, expected] of checks) {
  const found = fixed.includes(s);
  const ok = found === expected;
  if (!ok) allOk = false;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + s);
}
if (allOk) console.log('\nAll checks passed!');
else console.log('\nSome checks failed.');
