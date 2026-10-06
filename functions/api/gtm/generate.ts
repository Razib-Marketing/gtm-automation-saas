import { getGoogleAccessToken } from './_utils';
import { safaraTemplate, synxisTemplate, ihotelierTemplate, windsurferTemplate, mewsTemplate, woocommerceTemplate, getBasicTemplate } from './templates/index';

// Only used for payload generation

function getModulePayloads(moduleId, measurementId, config: any = {}, globalFbPixelId = '', globalGoogleAdsId = '') {
  let template: any = { variables: [], triggers: [], tags: [] };

  let baseTemplate = null;

  // HOTEL BOOKING ENGINES & COMPLEX TEMPLATES
  if (moduleId === 'hotel_safara') baseTemplate = safaraTemplate;
  else if (moduleId === 'hotel_synxis') baseTemplate = synxisTemplate;
  else if (moduleId === 'hotel_ihotelier') baseTemplate = ihotelierTemplate;
  else if (moduleId === 'hotel_windsurfers') baseTemplate = windsurferTemplate;
  else if (moduleId === 'hotel_mews') baseTemplate = mewsTemplate;
  else if (moduleId === 'ecom_woocommerce') baseTemplate = woocommerceTemplate;
  else if (moduleId.startsWith('basic_')) baseTemplate = getBasicTemplate(moduleId);
  
  if (baseTemplate) {
    template = JSON.parse(JSON.stringify(baseTemplate)); // deep clone
  } else {
    // LEGACY MODULES (Converted to template format)
    let triggerPayload;
    let eventName = 'custom_event';
    let isAdvancedForm = false;
    let advancedListenerPayload = null;
    let customEventName = '';
    let listenerTriggerType = 'pageview';
    let listenerTriggerName = 'page_view_all';

    // Parse smart form types
    let baseModule = moduleId;
    let smartType = 'generic';

    if (moduleId.startsWith('form_')) {
      const parts = moduleId.split('_');
      // format: form_platform_type e.g. form_elementor_wedding
      if (parts.length >= 3) {
        baseModule = `form_${parts[1]}`;
        smartType = parts[2];
      }
    }

    const getSmartEventName = (platform) => {
      if (smartType === 'wedding') return 'wedding-rfp-submission';
      if (smartType === 'event') return 'event-rfp-submission';
      if (smartType === 'newsletter') return 'newsletter-submission';
      if (smartType === 'contact') return 'contact-submission';
      return `generate-lead-${platform}`;
    };

    const generateSmartJS = (platform, isJQuery) => {
      const getContextStrJQ = `var formText = (jQuery(e.target).text() || '').toLowerCase(); var formId = (jQuery(e.target).attr('id') || '').toLowerCase(); var formClass = (jQuery(e.target).attr('class') || '').toLowerCase(); var formAction = (jQuery(e.target).attr('action') || '').toLowerCase(); var inputStr = ''; jQuery(e.target).find('input, textarea, select').each(function() { inputStr += ' ' + (jQuery(this).attr('name') || '') + ' ' + (jQuery(this).attr('placeholder') || ''); }); var headingText = (jQuery(e.target).closest('.elementor-container, .elementor-widget-wrap, section, .wpb_row, .et_pb_row').length ? jQuery(e.target).closest('.elementor-container, .elementor-widget-wrap, section, .wpb_row, .et_pb_row').find('h1, h2, h3, h4, h5, h6').text() : jQuery(e.target).parent().parent().parent().find('h1, h2, h3, h4, h5, h6').text() || '').toLowerCase(); var contextStr = formText + " " + formId + " " + formClass + " " + formAction + inputStr + " " + headingText + " " + window.location.href.toLowerCase();`;
      const getContextStrVanilla = `var formText = (form.innerText || '').toLowerCase(); var formId = (form.id || '').toLowerCase(); var formClass = (form.className || '').toLowerCase(); var formAction = (form.action || '').toLowerCase(); var inputStr = ''; var inputs = form.querySelectorAll('input, textarea, select'); for(var i=0; i<inputs.length; i++) { inputStr += ' ' + (inputs[i].name || '') + ' ' + (inputs[i].placeholder || ''); } var parentContainer = form.closest ? (form.closest('section') || form.closest('.elementor-container') || form.closest('.wpb_row') || form.parentElement.parentElement) : (form.parentElement ? form.parentElement.parentElement : document); var headings = parentContainer ? parentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6') : []; var headingText = ''; for(var j=0; j<headings.length; j++) { headingText += ' ' + (headings[j].innerText || ''); } var contextStr = formText + " " + formId + " " + formClass + " " + formAction + inputStr + " " + headingText.toLowerCase() + " " + window.location.href.toLowerCase();`;
      const logic = `var eventName = 'generate-lead-${platform}'; if (contextStr.indexOf('wedding') > -1 || contextStr.indexOf('bride') > -1) eventName = 'wedding-rfp-submission'; else if (contextStr.indexOf('event') > -1 || contextStr.indexOf('meeting') > -1 || contextStr.indexOf('group') > -1) eventName = 'event-rfp-submission'; else if (contextStr.indexOf('subscribe') > -1 || contextStr.indexOf('newsletter') > -1 || contextStr.indexOf('optin') > -1 || contextStr.indexOf('opt-in') > -1 || contextStr.indexOf('updates') > -1 || contextStr.indexOf('join') > -1) eventName = 'newsletter-submission'; else if (contextStr.indexOf('contact') > -1 || contextStr.indexOf('touch') > -1 || contextStr.indexOf('message') > -1 || contextStr.indexOf('inquiry') > -1 || contextStr.indexOf('support') > -1) eventName = 'contact-submission'; window.dataLayer.push({ 'event': eventName, 'form_platform': '${platform}' });`;

      if (isJQuery) {
        return `${getContextStrJQ} ${logic}`;
      } else {
        return `${getContextStrVanilla} ${logic}`;
      }
    };

    if (moduleId === 'social_media') {
      triggerPayload = { name: `social-contact-click`, type: 'linkClick', filter: [{ type: 'matchRegex', parameter: [{ type: 'template', key: 'arg0', value: '{{Click URL}}' }, { type: 'template', key: 'arg1', value: 'mailto:|tel:|facebook\\\\.com|linkedin\\\\.com|instagram\\\\.com|twitter\\\\.com|x\\\\.com' }] }] };
      eventName = 'social-contact-click';
    } else if (moduleId === 'scroll_depth') {
      triggerPayload = { name: `scroll_depth_advanced`, type: 'scrollDepth', parameter: [{ type: 'template', key: 'verticalThresholds', value: '25,50,75,90' }, { type: 'boolean', key: 'verticalThresholdsUnits', value: 'PERCENT' }] };
      eventName = 'scroll';
    } else if (moduleId === 'video_engagement') {
      triggerPayload = { name: `video_youtube_engagement`, type: 'youTubeVideo', parameter: [{ type: 'boolean', key: 'captureStart', value: 'true' }, { type: 'boolean', key: 'captureComplete', value: 'true' }, { type: 'boolean', key: 'capturePause', value: 'true' }, { type: 'boolean', key: 'captureProgress', value: 'true' }, { type: 'template', key: 'progressThresholds', value: '25,50,75' }] };
      eventName = 'video-engagement';
    } else if (moduleId.endsWith('_entrance')) {
      let urlContains = 'bookingengine.com';
      if (moduleId === 'hotel_safara_entrance') urlContains = 'safara.com';
      else if (moduleId === 'hotel_synxis_entrance') urlContains = 'synxis.com';
      else if (moduleId === 'hotel_stayntouch_entrance') urlContains = 'stayntouch.com';
      else if (moduleId === 'hotel_windsurfers_entrance') urlContains = 'windsurfercrs.com';
      else if (moduleId === 'hotel_mews_entrance') urlContains = 'mews.li';
      else if (moduleId === 'hotel_ihotelier_entrance') urlContains = 'ihotelier.com';

      triggerPayload = { name: `click_booking-entrance`, type: 'linkClick', filter: [{ type: 'contains', parameter: [{ type: 'template', key: 'arg0', value: '{{Click URL}}' }, { type: 'template', key: 'arg1', value: urlContains }] }] };
      eventName = 'booking-entrance';
    } else if (baseModule === 'form_elementor') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('elementor');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_elementor_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  jQuery(document).on('submit_success', function(e, response){\n    ${generateSmartJS('elementor', true)}\n  });\n</script>` }]
      };
    } else if (baseModule === 'form_hubspot') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('hubspot');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_hubspot_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script type="text/javascript">\nwindow.addEventListener("message", function(event) {\nif(event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmit') {\nwindow.dataLayer.push({\n'event': 'hubspot-form-data',\n'hs-form-guid': event.data.id,\n'hs-formData': event.data.data\n});\n}\n});\nwindow.addEventListener("message", function(event) {\nif(event.data.type === 'hsFormCallback' && event.data.eventName === 'onFormSubmitted') {\nwindow.dataLayer.push({\n'event': '${customEventName}',\n'hs-form-guid': event.data.id\n});\n}\n});\n</script>` }]
      };
    } else if (baseModule === 'form_salesforce') {
      triggerPayload = { 
        name: `rfp-submission-${smartType}`, 
        type: 'formSubmission', 
        filter: [{ type: 'contains', parameter: [{ type: 'template', key: 'arg0', value: '{{Form URL}}' }, { type: 'template', key: 'arg1', value: 'webto.salesforce.com' }] }] 
      };
      eventName = getSmartEventName('salesforce');
    } else if (baseModule === 'form_revinate') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('revinate');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_revinate_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  document.addEventListener("submit", function(event) {\n    var form = event.target;\n    if(form && form.action && form.action.indexOf("revinate.com") !== -1) {\n      ${generateSmartJS('revinate', false)}\n    }\n  });\n</script>` }]
      };
    } else if (baseModule === 'form_gravity') {
      triggerPayload = { name: `form_gravity_submit_${smartType}`, type: 'formSubmission', filter: [{ type: 'contains', parameter: [{ type: 'template', key: 'arg0', value: '{{Form ID}}' }, { type: 'template', key: 'arg1', value: 'gform' }] }] };
      eventName = getSmartEventName('gravity');
    } else if (baseModule === 'form_zmail') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('zmail');
      eventName = customEventName;
      listenerTriggerType = 'domReady';
      listenerTriggerName = 'dom_ready_all';
      advancedListenerPayload = {
        name: 'chtml_zmail_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  (function() {\n    var formClicked = false;\n    window.addEventListener('blur', function() {\n      setTimeout(function() {\n        var activeElement = document.activeElement;\n        if (activeElement && activeElement.tagName === 'IFRAME' && \n           (activeElement.src.indexOf('zmaildirect.com') > -1 || \n            (activeElement.dataset.lazySrc && activeElement.dataset.lazySrc.indexOf('zmaildirect.com') > -1))) {\n          if (!formClicked) {\n            formClicked = true;\n            window.dataLayer = window.dataLayer || [];\n            window.dataLayer.push({\n              'event': '${customEventName}'\n            });\n            setTimeout(function(){ formClicked = false; }, 5000);\n          }\n        }\n      }, 100); \n    });\n  })();\n</script>` }]
      };
    } else if (baseModule === 'form_generic') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('generic');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_generic_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  document.addEventListener("submit", function(event) {\n    var form = event.target;\n    if(form) {\n      ${generateSmartJS('generic', false)}\n    }\n  });\n</script>` }]
      };
    } else if (baseModule === 'form_cf7') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('cf7');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_cf7_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  document.addEventListener('wpcf7mailsent', function(event) {\n    var form = event.target;\n    ${generateSmartJS('cf7', false)}\n  }, false);\n</script>` }]
      };
    } else if (baseModule === 'form_custom_php') {
      isAdvancedForm = true;
      customEventName = getSmartEventName('custom_php');
      eventName = customEventName;
      advancedListenerPayload = {
        name: 'chtml_custom_php_smart_listener',
        type: 'html',
        parameter: [{ type: 'template', key: 'html', value: `<script>\n  (function() {\n    var formElement = document.querySelector('form[action*="sendmail.php"]');\n    if (!formElement) formElement = document.querySelector('form.webform');\n    if (!formElement) return;\n    var observer = new MutationObserver(function(mutations) {\n      mutations.forEach(function(mutation) {\n        if (mutation.attributeName === 'class' && formElement.classList.contains('webform--success')) {\n          var form = formElement;\n          ${generateSmartJS('sendmail_ajax', false)}\n          observer.disconnect();\n        }\n      });\n    });\n    observer.observe(formElement, { attributes: true });\n  })();\n</script>` }]
      };
    } else {
      return null;
    }

    if (isAdvancedForm && advancedListenerPayload) {
      // 1. Add Custom HTML Listener Tag (Fires on All Pages)
      const pageViewTriggerId = 'dummy_pageview_1';
      template.triggers.push({
        name: listenerTriggerName,
        type: listenerTriggerType,
        triggerId: pageViewTriggerId
      });
      template.tags.push({
        ...advancedListenerPayload,
        firingTriggerId: [pageViewTriggerId]
      });

      // 2. Add Custom Event Trigger
      const customEventTriggerId = 'dummy_custom_event_1';
      const customEventFilter = [{ type: 'equals', parameter: [{ type: 'template', key: 'arg0', value: '{{_event}}' }, { type: 'template', key: 'arg1', value: customEventName }] }];
      
      const additionalFilters = [];
      if (config.pagePath) {
        additionalFilters.push({
          type: 'contains',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{Page Path}}' },
            { type: 'template', key: 'arg1', value: config.pagePath }
          ]
        });
      }

      const customEventTrigger: any = {
        name: `ce_${customEventName}${config.pagePath ? '_path' : ''}`,
        type: 'customEvent',
        customEventFilter: customEventFilter,
        triggerId: customEventTriggerId
      };
      
      if (additionalFilters.length > 0) {
        customEventTrigger.filter = additionalFilters;
      }
      
      template.triggers.push(customEventTrigger);

      // 3. Add GA4 Event Tag
      template.tags.push({
        name: eventName,
        type: 'gaawe',
        parameter: [
          { type: 'template', key: 'measurementIdOverride', value: '{{MEASUREMENT_ID_OVERRIDE}}' },
          { type: 'template', key: 'eventName', value: eventName }
        ],
        firingTriggerId: [customEventTriggerId]
      });
    } else {
      triggerPayload.triggerId = 'dummy_trigger_1';
      triggerPayload.filter = triggerPayload.filter || [];
      if (config.pagePath) {
        triggerPayload.filter.push({
          type: 'contains',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{Page Path}}' },
            { type: 'template', key: 'arg1', value: config.pagePath }
          ]
        });
        triggerPayload.name = `${triggerPayload.name}_path`;
      }
      
      template.triggers.push(triggerPayload);
      template.tags.push({
        name: moduleId.endsWith('_entrance') ? 'booking-entrance' : eventName,
        type: 'gaawe',
        parameter: [
          { type: 'template', key: 'measurementIdOverride', value: '{{MEASUREMENT_ID_OVERRIDE}}' },
          { type: 'template', key: 'eventName', value: eventName }
        ],
        firingTriggerId: ['dummy_trigger_1']
      });
    }

    // FB & Ads Tags injection
    let activeTriggerId = isAdvancedForm ? 'dummy_custom_event_1' : (triggerPayload ? triggerPayload.triggerId : null);
    if (activeTriggerId) {
      if (config.enableFb && globalFbPixelId) {
        let fbEvent = 'Contact';
        if (eventName.includes('lead')) fbEvent = 'Lead';
        if (eventName.includes('purchase')) fbEvent = 'Purchase';
        if (eventName.includes('add-to-cart')) fbEvent = 'AddToCart';
        if (eventName.includes('wedding') || eventName.includes('event')) fbEvent = 'Lead';
        
        template.tags.push({
          name: `fb_${eventName}`,
          type: 'html',
          parameter: [{ type: 'template', key: 'html', value: `<script>\n  fbq('track', '${fbEvent}');\n</script>` }],
          firingTriggerId: [activeTriggerId]
        });
      }

      if (config.enableAds && config.adsLabel && globalGoogleAdsId) {
        template.tags.push({
          name: `gads_${eventName}`,
          type: 'awct',
          parameter: [
            { type: 'template', key: 'conversionId', value: globalGoogleAdsId },
            { type: 'template', key: 'conversionLabel', value: config.adsLabel }
          ],
          firingTriggerId: [activeTriggerId]
        });
      }
    }
  }

  // Inject Custom HTML Data Layer Generator if requested
  if (config.injectDataLayer && moduleId === 'ecom_woocommerce') {
    const generatorTriggerId = 'generator_pageview_' + Math.floor(Math.random() * 1000);
    template.triggers.push({
      name: 'All Pages (Generator)',
      type: 'pageview',
      triggerId: generatorTriggerId
    });
    template.tags.push({
      name: 'WooCommerce Data Layer Generator',
      type: 'html',
      parameter: [{
        type: 'template',
        key: 'html',
        value: `<script>\n(function(){\n  window.dataLayer = window.dataLayer || [];\n  try {\n    if (document.body.classList.contains('single-product')) {\n      var title = document.querySelector('.product_title') ? document.querySelector('.product_title').innerText : '';\n      var priceTxt = document.querySelector('p.price .amount') ? document.querySelector('p.price .amount').innerText : '0';\n      var price = parseFloat(priceTxt.replace(/[^0-9.]/g, '')) || 0;\n      window.dataLayer.push({\n        event: 'view_item',\n        ecommerce: {\n          items: [{ item_name: title, price: price, quantity: 1 }]\n        }\n      });\n    }\n    if (typeof jQuery !== 'undefined') {\n      jQuery(document).on('added_to_cart', function() {\n         window.dataLayer.push({ event: 'add_to_cart', ecommerce: { items: [{ item_name: 'Product', quantity: 1 }] }});\n      });\n    }\n  } catch(e) {}\n})();\n</script>`
      }],
      firingTriggerId: [generatorTriggerId]
    });
  }

  // --- Dynamic Variable Cleanup ---
  if (template.variables && Array.isArray(template.variables)) {
    const redundantVars = template.variables.filter((v: any) => 
      v.type === 'c' && v.parameter && v.parameter.some((p: any) => p.key === 'value' && p.value === '{{MEASUREMENT_ID_OVERRIDE}}')
    );

    if (redundantVars.length > 0) {
      template.variables = template.variables.filter((v: any) => !redundantVars.includes(v));
      let str = JSON.stringify(template);
      redundantVars.forEach((rv: any) => {
        const regex = new RegExp(`\\{\\{${rv.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\}\\}`, 'g');
        str = str.replace(regex, '{{MEASUREMENT_ID_OVERRIDE}}');
      });
      template = JSON.parse(str);
    }
  }

  // Deeply inject the Measurement ID
  let str = JSON.stringify(template);
  str = str.replace(/\{\{MEASUREMENT_ID_OVERRIDE\}\}/g, measurementId);
  return JSON.parse(str);
}

function sanitizeGtmObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeGtmObject);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (key === 'type' && typeof obj[key] === 'string' && obj[key] === obj[key].toUpperCase() && obj[key].length > 1) {
        const conditionTypes = ['EQUALS', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'MATCH_REGEX', 'DOES_NOT_CONTAIN', 'DOES_NOT_EQUAL', 'DOES_NOT_START_WITH', 'DOES_NOT_END_WITH', 'DOES_NOT_MATCH_REGEX', 'LESS_THAN', 'LESS_OR_EQUALS', 'GREATER_THAN', 'GREATER_OR_EQUALS'];
        if (conditionTypes.includes(obj[key])) {
          newObj[key] = obj[key];
        } else {
          newObj[key] = obj[key].toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        }
      } else {
        newObj[key] = sanitizeGtmObject(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { containerPath, moduleIds, measurementId, isNewGTM, customFormEvents, moduleConfigs, fbPixelId, googleAdsId } = await request.json();

    if (!containerPath || !measurementId || !Array.isArray(moduleIds)) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const configMap = new Map();
    if (Array.isArray(moduleConfigs)) {
      for (const config of moduleConfigs) {
        configMap.set(config.id, config);
      }
    }

    const accessToken = await getGoogleAccessToken(env, request);
    const authHeader = `Bearer ${accessToken}`;
    let existingVarName = null;

    try {
      const varsRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/variables`, {
        headers: { 'Authorization': authHeader }
      });
      if (varsRes.ok) {
        const varsData = await varsRes.json();
        const existingVars = varsData.variable || [];
        const cleanMeasurementId = measurementId.trim().toLowerCase();
        for (const v of existingVars) {
          if (v.type === 'c' && v.parameter) {
            const valParam = v.parameter.find((p: any) => p.key === 'value');
            if (valParam && valParam.value && valParam.value.trim().toLowerCase() === cleanMeasurementId) {
              existingVarName = v.name;
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch existing variables', err);
    }

    const templates = [];
    let targetMeasurementIdString = measurementId;

    if (existingVarName) {
      targetMeasurementIdString = `{{${existingVarName}}}`;
    } else {
      targetMeasurementIdString = `{{GA4 Measurement ID}}`;
      templates.push({
        moduleId: 'ga4_constant_variable',
        variables: [
          sanitizeGtmObject({
            name: 'GA4 Measurement ID',
            type: 'c',
            parameter: [
              { type: 'template', key: 'value', value: measurementId }
            ]
          })
        ],
        triggers: [],
        tags: []
      });
    }

    if (isNewGTM) {
      templates.push({
        moduleId: 'ga4_config_base',
        variables: [],
        triggers: [
          sanitizeGtmObject({
            name: 'All Pages',
            type: 'pageview',
            triggerId: '2147473653'
          })
        ],
        tags: [
          sanitizeGtmObject({
            name: "GA4 - Config",
            type: "gaawc",
            parameter: [
              { type: 'template', key: 'measurementId', value: targetMeasurementIdString }
            ],
            firingTriggerId: ["2147473653"]
          })
        ]
      });
    }

    if (fbPixelId || googleAdsId) {
      let baseTags = [];
      let baseTriggers = [];
      
      baseTriggers.push(sanitizeGtmObject({
        name: 'All Pages',
        type: 'pageview',
        triggerId: 'dummy_all_pages_base_fb_ads'
      }));

      if (fbPixelId) {
        baseTags.push(sanitizeGtmObject({
          name: 'Facebook Pixel Base',
          type: 'html',
          parameter: [{
            type: 'template',
            key: 'html',
            value: `<!-- Facebook Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${fbPixelId}');\nfbq('track', 'PageView');\n</script>\n<!-- End Facebook Pixel Code -->`
          }],
          firingTriggerId: ['dummy_all_pages_base_fb_ads']
        }));
      }

      if (googleAdsId) {
        baseTags.push(sanitizeGtmObject({
          name: 'Conversion Linker',
          type: 'gclaw',
          parameter: [{ type: 'boolean', key: 'enableLinker', value: 'true' }],
          firingTriggerId: ['dummy_all_pages_base_fb_ads']
        }));
      }

      templates.push({
        moduleId: 'global_fb_ads_base',
        variables: [],
        triggers: baseTriggers,
        tags: baseTags
      });
    }

    const seenVariableNames = new Set<string>();
    const seenTriggerNames = new Set<string>();
    const seenTagNames = new Set<string>();

    for (const moduleId of moduleIds) {
      const config = configMap.get(moduleId) || {};
      const template = getModulePayloads(moduleId, targetMeasurementIdString, config, fbPixelId, googleAdsId);
      if (!template) {
        return new Response(JSON.stringify({ error: `Invalid module ID: ${moduleId}` }), { status: 400 });
      }

      const sanitizedVariables = (template.variables || [])
        .map((v: any) => {
          const isDuplicate = seenVariableNames.has(v.name);
          if (!isDuplicate) seenVariableNames.add(v.name);
          return sanitizeGtmObject({ name: v.name, type: v.type, parameter: v.parameter, _skipDeploy: isDuplicate });
        });

      const sanitizedTriggers = (template.triggers || [])
        .map((t: any) => {
          const isDuplicate = seenTriggerNames.has(t.name);
          if (!isDuplicate) seenTriggerNames.add(t.name);
          return sanitizeGtmObject({ name: t.name, type: t.type, filter: t.filter, customEventFilter: t.customEventFilter, triggerId: t.triggerId, _skipDeploy: isDuplicate });
        });

      const sanitizedTags = (template.tags || [])
        .map((t: any) => {
          const isDuplicate = seenTagNames.has(t.name);
          if (!isDuplicate) seenTagNames.add(t.name);
          return sanitizeGtmObject({ name: t.name, type: t.type, parameter: t.parameter, firingTriggerId: t.firingTriggerId, _skipDeploy: isDuplicate });
        });

      templates.push({
        moduleId,
        variables: sanitizedVariables,
        triggers: sanitizedTriggers,
        tags: sanitizedTags
      });
    }

    if (customFormEvents && Array.isArray(customFormEvents)) {
      for (const event of customFormEvents) {
        templates.push({
          moduleId: `custom_form_${event}`,
          variables: [],
          triggers: [
            sanitizeGtmObject({
              name: `form_submit - ${event}`,
              type: 'formSubmission',
              triggerId: `dummy_form_trigger_${event}`
            })
          ],
          tags: [
            sanitizeGtmObject({
              name: event.toLowerCase().replace(/_/g, '-'),
              type: 'gaawe',
              parameter: [
                { type: 'template', key: 'measurementIdOverride', value: targetMeasurementIdString },
                { type: 'template', key: 'eventName', value: event }
              ],
              firingTriggerId: [`dummy_form_trigger_${event}`]
            })
          ]
        });
      }
    }

    return new Response(JSON.stringify({ templates }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
