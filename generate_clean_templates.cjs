const fs = require('fs');

function extractCleanTemplate(inputFile, outputFile, tagWhitelist) {
  if (!fs.existsSync(inputFile)) return;
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  if (!data.containerVersion) return;

  const allTags = data.containerVersion.tag || [];
  const allTriggers = data.containerVersion.trigger || [];
  const allVariables = data.containerVersion.variable || [];

  // 1. Keep tags matching whitelist
  const keptTags = allTags.filter(tag => {
    return tagWhitelist.some(rule => tag.name.match(rule));
  });

  // 2. Keep triggers referenced by kept tags
  const requiredTriggerIds = new Set();
  keptTags.forEach(tag => {
    if (tag.firingTriggerId) {
      tag.firingTriggerId.forEach(id => requiredTriggerIds.add(id));
    }
  });
  
  // Some triggers reference other triggers (not common but possible), we just need the IDs
  const keptTriggers = allTriggers.filter(trigger => requiredTriggerIds.has(trigger.triggerId));

  // 3. Keep variables referenced by kept tags and triggers
  // We can find references by stringifying the kept items and looking for {{varName}}
  const keptString = JSON.stringify(keptTags) + JSON.stringify(keptTriggers);
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  const referencedVarNames = new Set();
  while ((match = regex.exec(keptString)) !== null) {
    referencedVarNames.add(match[1]);
  }

  // Also, some variables reference other variables
  let prevSize = 0;
  while (referencedVarNames.size > prevSize) {
    prevSize = referencedVarNames.size;
    allVariables.forEach(v => {
      if (referencedVarNames.has(v.name)) {
        const vStr = JSON.stringify(v);
        let m;
        while ((m = regex.exec(vStr)) !== null) {
          referencedVarNames.add(m[1]);
        }
      }
    });
  }

  const keptVariables = allVariables.filter(v => referencedVarNames.has(v.name));

  // Clean GA4 Measurement IDs to be {{MEASUREMENT_ID_OVERRIDE}}
  const cleanPayloads = (arr) => {
    let str = JSON.stringify(arr, null, 2);
    // Standardize measurement ID references
    str = str.replace(/\{\{[^}]*Measurement ID[^}]*\}\}/gi, '{{MEASUREMENT_ID_OVERRIDE}}');
    str = str.replace(/"G-[A-Z0-9]+"/g, '"{{MEASUREMENT_ID_OVERRIDE}}"'); // hardcoded IDs
    return JSON.parse(str);
  };

  const finalTemplate = {
    variables: cleanPayloads(keptVariables),
    triggers: cleanPayloads(keptTriggers),
    tags: cleanPayloads(keptTags)
  };

  fs.writeFileSync(outputFile, `export const template = ${JSON.stringify(finalTemplate, null, 2)};\n`);
  console.log(`Saved ${outputFile}: ${finalTemplate.tags.length} tags, ${finalTemplate.triggers.length} triggers, ${finalTemplate.variables.length} vars.`);
}

// Safara
extractCleanTemplate(
  './GTM-5DW3B9HN_workspace10.json', 
  './functions/api/gtm/templates/safara.ts', 
  [/Safara/]
);

// Synxis
extractCleanTemplate(
  './GTM-5CDR8C6_workspace1000024.json', 
  './functions/api/gtm/templates/synxis.ts', 
  [/GA4 Rooms/, /GA4 Retail/, /GA4 Addons/, /GA4 Purchase/i, /GA4 begin_checkout/, /GA4 remove_from_cart/, /GA4 select item/, /GA4 View Item/]
);

// iHotelier
extractCleanTemplate(
  './GTM-57BMZT4_workspace28.json', 
  './functions/api/gtm/templates/ihotelier.ts', 
  [/Purchase Tag/, /View Item/, /Begin Checkout/, /Rooms - Tag/, /Push eCommerce Data/]
);

// Windsurfer
extractCleanTemplate(
  './GTM-5LMP4TC_workspace8.json', 
  './functions/api/gtm/templates/windsurfer.ts', 
  [/add-to-cart/, /purchase/, /begin-checkout/, /view-item/]
);

// Mews
extractCleanTemplate(
  './GTM-Mews.json', 
  './functions/api/gtm/templates/mews.ts', 
  [/Mews GA4/]
);

// Basic
extractCleanTemplate(
  './GTM-KPRN9JKR_workspace5.json', 
  './functions/api/gtm/templates/basic.ts', 
  [/click/, /booking_entrance/]
);

