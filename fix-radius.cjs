const fs = require('fs');
let css = fs.readFileSync('src/pages/Dashboard.css', 'utf-8');

const replacements = [
  { selector: '.gtm-dropdown', search: 'border-radius: 0.5rem;', replace: 'border-radius: 9999px;' },
  { selector: '.gtm-dropdown', search: 'padding: 0.75rem 1rem;', replace: 'padding: 0.75rem 1.25rem;' },
  { selector: '.btn-audit', search: 'border-radius: 8px;', replace: 'border-radius: 9999px;' },
  { selector: '.global-config', search: 'border-radius: 0.5rem;', replace: 'border-radius: 1rem;' },
  { selector: '.module-card', search: 'border-radius: 8px;', replace: 'border-radius: 1rem;' },
  { selector: '.btn-deploy-bulk', search: 'border-radius: 0.5rem;', replace: 'border-radius: 9999px;' },
  { selector: '.input-field', search: 'border-radius: 0.5rem;', replace: 'border-radius: 9999px;' },
  { selector: '.btn-verify', search: 'border-radius: 0.5rem;', replace: 'border-radius: 9999px;' },
  { selector: '.deploy-log-card', search: 'border-radius: 1.5rem;', replace: 'border-radius: 1rem;' },
  { selector: '.page-path-input', search: 'border-radius: 0.5rem;', replace: 'border-radius: 9999px;' },
  { selector: '.btn-action', search: 'border-radius: 4px;', replace: 'border-radius: 9999px;' }
];

replacements.forEach(({ selector, search, replace }) => {
  const regex = new RegExp(`(${selector.replace(/\./g, '\\.')}\\s*\\{[^}]*?)${search.replace(/\./g, '\\.')}`, 'g');
  css = css.replace(regex, `$1${replace}`);
});

fs.writeFileSync('src/pages/Dashboard.css', css);
console.log('Fixed border radii in Dashboard.css');
