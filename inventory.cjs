const fs = require('fs');
const files = [
  'GTM-5DW3B9HN_workspace10.json',
  'GTM-5CDR8C6_workspace1000024.json',
  'GTM-57BMZT4_workspace28.json',
  'GTM-5LMP4TC_workspace8.json',
  'GTM-Mews.json',
  'GTM-KPRN9JKR_workspace5.json'
];

let output = '';

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  output += `\n--- ${f} ---\n`;
  if (data.containerVersion) {
    output += `TAGS:\n`;
    if (data.containerVersion.tag) {
      data.containerVersion.tag.forEach(t => output += `  ${t.name}\n`);
    }
    output += `TRIGGERS:\n`;
    if (data.containerVersion.trigger) {
      data.containerVersion.trigger.forEach(t => output += `  ${t.name}\n`);
    }
    output += `VARIABLES:\n`;
    if (data.containerVersion.variable) {
      data.containerVersion.variable.forEach(t => output += `  ${t.name}\n`);
    }
  }
});

fs.writeFileSync('inventory.txt', output);
