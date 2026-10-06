const fs = require('fs');

const extract = (inputFile, outputFile, keyword) => {
  if (!fs.existsSync(inputFile)) {
    console.log(`File ${inputFile} not found`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

  const filtered = { tags: [], triggers: [], variables: [] };
  
  if (data.containerVersion) {
    if (data.containerVersion.tag) {
      filtered.tags = keyword ? data.containerVersion.tag.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase())) : data.containerVersion.tag;
    }
    if (data.containerVersion.trigger) {
      filtered.triggers = keyword ? data.containerVersion.trigger.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase())) : data.containerVersion.trigger;
    }
    if (data.containerVersion.variable) {
      filtered.variables = keyword ? data.containerVersion.variable.filter(v => v.name.toLowerCase().includes(keyword.toLowerCase())) : data.containerVersion.variable;
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2));
  console.log(`${keyword || 'ALL'} from ${inputFile} -> ${filtered.tags.length} tags, ${filtered.triggers.length} triggers, ${filtered.variables.length} variables.`);
};

extract('./GTM-5CDR8C6_workspace1000024.json', './synxis_filtered.json', 'Synxis');
extract('./GTM-57BMZT4_workspace28.json', './ihotelier_filtered.json', 'iHotelier');
extract('./GTM-5LMP4TC_workspace8.json', './windsurfer_filtered.json', 'Windsurfer');
extract('./GTM-Mews.json', './mews_filtered.json', 'Mews');
extract('./GTM-KPRN9JKR_workspace5.json', './basic_filtered.json', null); // extract all for basic?

