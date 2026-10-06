// Auto-generated basic tracking configurations

const GTAG_VAR = {
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

export const basicTemplates: Record<string, any> = {
  "basic_phone": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_phone_click",
  "name": "phone-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "tel:"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "phone-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "phone-click"
    }
  ],
  "firingTriggerId": [
    "trigger_phone_click"
  ]
}]
  },
  "basic_email": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_email_click",
  "name": "email-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "mailto:"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "email-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "email-click"
    }
  ],
  "firingTriggerId": [
    "trigger_email_click"
  ]
}]
  },
  "basic_facebook": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_facebook_click",
  "name": "facebook-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "facebook.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "facebook-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "facebook-click"
    }
  ],
  "firingTriggerId": [
    "trigger_facebook_click"
  ]
}]
  },
  "basic_instagram": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_instagram_click",
  "name": "instagram-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "instagram.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "instagram-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "instagram-click"
    }
  ],
  "firingTriggerId": [
    "trigger_instagram_click"
  ]
}]
  },
  "basic_gmb": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_gmb_click",
  "name": "gmb-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "MATCH_REGEX",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "g\\\\.page|g\\\\.co/kgs|search\\\\.google\\\\.com/local|google\\\\.com/maps"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "gmb-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "gmb-click"
    }
  ],
  "firingTriggerId": [
    "trigger_gmb_click"
  ]
}]
  },
  "basic_direction": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_direction_click",
  "name": "direction-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "MATCH_REGEX",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "maps\\\\.apple\\\\.com|waze\\\\.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "direction-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "direction-click"
    }
  ],
  "firingTriggerId": [
    "trigger_direction_click"
  ]
}]
  },
  "basic_tripadvisor": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_tripadvisor_click",
  "name": "tripadvisor-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "tripadvisor.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "tripadvisor-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "tripadvisor-click"
    }
  ],
  "firingTriggerId": [
    "trigger_tripadvisor_click"
  ]
}]
  },
  "basic_booking": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_booking_click",
  "name": "booking-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "booking.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "booking-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "booking-click"
    }
  ],
  "firingTriggerId": [
    "trigger_booking_click"
  ]
}]
  },
  "basic_expedia": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_expedia_click",
  "name": "expedia-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "expedia.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "expedia-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "expedia-click"
    }
  ],
  "firingTriggerId": [
    "trigger_expedia_click"
  ]
}]
  },
  "basic_agoda": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_agoda_click",
  "name": "agoda-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "CONTAINS",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "agoda.com"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "agoda-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "agoda-click"
    }
  ],
  "firingTriggerId": [
    "trigger_agoda_click"
  ]
}]
  },
  "basic_generic_outbound": {
    variables: [GTAG_VAR],
    triggers: [{
  "triggerId": "trigger_generic_outbound_click",
  "name": "generic-outbound-click",
  "type": "LINK_CLICK",
  "filter": [
    {
      "type": "DOES_NOT_CONTAIN",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "arg0",
          "value": "{{Click URL}}"
        },
        {
          "type": "TEMPLATE",
          "key": "arg1",
          "value": "{{Page Hostname}}"
        }
      ]
    }
  ],
  "waitForTags": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "checkValidation": {
    "type": "BOOLEAN",
    "value": "false"
  },
  "waitForTagsTimeout": {
    "type": "TEMPLATE",
    "value": "2000"
  }
}],
    tags: [{
  "name": "generic-outbound-click",
  "type": "gaawe",
  "parameter": [
    {
      "type": "TEMPLATE",
      "key": "measurementIdOverride",
      "value": "{{GTAG}}"
    },
    {
      "type": "TEMPLATE",
      "key": "eventName",
      "value": "generic-outbound-click"
    }
  ],
  "firingTriggerId": [
    "trigger_generic_outbound_click"
  ]
}]
  },
};

export const getBasicTemplate = (moduleId: string) => {
  return basicTemplates[moduleId] || null;
};
