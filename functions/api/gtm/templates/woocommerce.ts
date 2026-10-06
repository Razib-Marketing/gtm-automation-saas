export const template = {
  "variables": [
    {
      "name": "dlv - GA4 - ecommerce Items",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.items"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce transaction ID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.transaction_id"
        }
      ]
    },
    {
      "name": "dlv -  GA4 - ecommerce affiliation",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.affiliation"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce value",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.value"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce tax",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.tax"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce shipping",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.shipping"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce currency",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.currency"
        }
      ]
    },
    {
      "name": "dlv - GA4 - ecommerce coupon",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "2"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ecommerce.coupon"
        }
      ]
    }
  ],
  "triggers": [
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "100",
      "name": "WooCommerce - view_item",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "101",
      "name": "WooCommerce - view_item_list",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_item_list"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "102",
      "name": "WooCommerce - select_promotion",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "select_promotion"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "103",
      "name": "WooCommerce - add_to_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_to_cart"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "104",
      "name": "WooCommerce - remove_from_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "remove_from_cart"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "105",
      "name": "WooCommerce - begin_checkout",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "begin_checkout"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "106",
      "name": "WooCommerce - add_payment_info",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_payment_info"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "107",
      "name": "WooCommerce - purchase",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "purchase"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "108",
      "name": "WooCommerce - add_shipping_info",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "add_shipping_info"
            }
          ]
        }
      ]
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "triggerId": "109",
      "name": "WooCommerce - view_cart",
      "type": "CUSTOM_EVENT",
      "customEventFilter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{_event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "view_cart"
            }
          ]
        }
      ]
    }
  ],
  "tags": [
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "200",
      "name": "GA4 - view_item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "100"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "201",
      "name": "GA4 - view_item_list",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "101"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "202",
      "name": "GA4 - select_promotion",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "select_promotion"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "102"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "203",
      "name": "GA4 - add_to_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "103"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "204",
      "name": "GA4 - remove_from_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "remove_from_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "104"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "205",
      "name": "GA4 - begin_checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "105"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "206",
      "name": "GA4 - add_payment_info",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_payment_info"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "106"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "207",
      "name": "GA4 - purchase",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "107"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "208",
      "name": "GA4 - add_shipping_info",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_shipping_info"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "108"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6210202861",
      "containerId": "173612340",
      "tagId": "209",
      "name": "GA4 - view_cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        },
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "true"
        },
        {
          "type": "TEMPLATE",
          "key": "getEcommerceDataFrom",
          "value": "dataLayer"
        }
      ],
      "firingTriggerId": [
        "109"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    }
  ]
};
