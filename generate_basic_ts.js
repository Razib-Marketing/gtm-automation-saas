const fs = require('fs');

const gtagVar = {
  "name": "GTAG",
  "type": "c",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "value",
      "value": "{{MEASUREMENT_ID_OVERRIDE}}"
    }
  ]
};

function createFilter(type, arg0, arg1) {
  return {
    "type": type,
    "parameter": [
      { "type": "TEMPLATE", "key": "arg0", "value": arg0 },
      { "type": "TEMPLATE", "key": "arg1", "value": arg1 }
    ]
  };
}

function createTrigger(name, filter) {
  return {
    "triggerId": `trigger_${name}`,
    "name": name,
    "type": "LINK_CLICK",
    "filter": [filter],
    "waitForTags": { "type": "BOOLEAN", "value": "false" },
    "checkValidation": { "type": "BOOLEAN", "value": "false" },
    "waitForTagsTimeout": { "type": "TEMPLATE", "value": "2000" }
  };
}

function createTag(name, eventName, triggerName) {
  return {
    "name": name,
    "type": "gaawe",
    "parameter": [
      { "type": "TEMPLATE", "key": "measurementIdOverride", "value": "{{GTAG}}" },
      { "type": "TEMPLATE", "key": "eventName", "value": eventName }
    ],
    "firingTriggerId": [`trigger_${triggerName}`]
  };
}

const modules = {
  "basic_phone": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "tel:"),
    triggerName: "phone_click",
    tagName: "GA4 Event - phone_click",
    eventName: "phone_click"
  },
  "basic_email": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "mailto:"),
    triggerName: "email_click",
    tagName: "GA4 Event - email_click",
    eventName: "email_click"
  },
  "basic_facebook": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "facebook.com"),
    triggerName: "facebook_click",
    tagName: "GA4 Event - facebook_click",
    eventName: "facebook_click"
  },
  "basic_instagram": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "instagram.com"),
    triggerName: "instagram_click",
    tagName: "GA4 Event - instagram_click",
    eventName: "instagram_click"
  },
  "basic_gmb": {
    filter: createFilter("MATCH_REGEX", "{{Click URL}}", "g\\\\.page|g\\\\.co/kgs|search\\\\.google\\\\.com/local|google\\\\.com/maps"),
    triggerName: "gmb_click",
    tagName: "GA4 Event - gmb_click",
    eventName: "gmb_click"
  },
  "basic_direction": {
    filter: createFilter("MATCH_REGEX", "{{Click URL}}", "maps\\\\.apple\\\\.com|waze\\\\.com"),
    triggerName: "direction_click",
    tagName: "GA4 Event - direction_click",
    eventName: "direction_click"
  },
  "basic_tripadvisor": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "tripadvisor.com"),
    triggerName: "tripadvisor_click",
    tagName: "GA4 Event - tripadvisor_click",
    eventName: "tripadvisor_click"
  },
  "basic_booking": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "booking.com"),
    triggerName: "booking_click",
    tagName: "GA4 Event - booking_click",
    eventName: "booking_click"
  },
  "basic_expedia": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "expedia.com"),
    triggerName: "expedia_click",
    tagName: "GA4 Event - expedia_click",
    eventName: "expedia_click"
  },
  "basic_agoda": {
    filter: createFilter("CONTAINS", "{{Click URL}}", "agoda.com"),
    triggerName: "agoda_click",
    tagName: "GA4 Event - agoda_click",
    eventName: "agoda_click"
  },
  "basic_generic_outbound": {
    filter: createFilter("DOES_NOT_CONTAIN", "{{Click URL}}", "{{Page Hostname}}"),
    triggerName: "generic_outbound_click",
    tagName: "GA4 Event - generic_outbound_click",
    eventName: "generic_outbound_click"
  }
};

let output = `// Auto-generated basic tracking configurations\n\n`;

output += `const GTAG_VAR = ${JSON.stringify(gtagVar, null, 2)};\n\n`;

output += `export const basicTemplates: Record<string, any> = {\n`;

for (const [modId, conf] of Object.entries(modules)) {
  const trigger = createTrigger(conf.triggerName, conf.filter);
  const tag = createTag(conf.tagName, conf.eventName, conf.triggerName);
  
  output += `  "${modId}": {
    variables: [GTAG_VAR],
    triggers: [${JSON.stringify(trigger, null, 2)}],
    tags: [${JSON.stringify(tag, null, 2)}]
  },\n`;
}

output += `};\n\n`;
output += `export const getBasicTemplate = (moduleId: string) => {\n  return basicTemplates[moduleId] || null;\n};\n`;

fs.writeFileSync('functions/api/gtm/templates/basic.ts', output);
console.log('basic.ts generated successfully');
