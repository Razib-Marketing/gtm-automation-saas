export const template = {
  "variables": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "46",
      "name": "WsVars.HotelID",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.HotelID"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "49",
      "name": "be-step",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Step"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "52",
      "name": "ecommerce-taxes",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Taxes"
        }
      ],
      "fingerprint": "1758303991058",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "54",
      "name": "be-view-class-on-body",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  return document.body.className;\n}"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "59",
      "name": "js.WsVars",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "61",
      "name": "ecommerce-value",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Amount"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "62",
      "name": "ecommerce-cart-items",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  // Reference the main WsVars object\n  var wsVars = {{js.WsVars}};\n\n  // Check if CartItems exists and has items\n  if (!wsVars || !wsVars.CartItems || !wsVars.CartItems.length) {\n    return []; // Return an empty array if no items are found\n  }\n\n  // Use .map() to transform EACH item in the CartItems array\n  var items = wsVars.CartItems.map(function(item) {\n    // Calculate the price per night. Handle case where Nights might be 0.\n    var pricePerNight = (item.Nights > 0) ? (item.Amt / item.Nights) : 0;\n\n    return {\n      item_id: item.RmID,\n      item_name: item.RoomType,\n      item_category: item.RateType,\n      affiliation: wsVars.HotelName,\n      price: pricePerNight,\n      quantity: item.Nights,\n      coupon: item.Promo,          // ADDED: The promo code used for the item\n      discount: Math.abs(item.Disc) // ADDED: The discount amount as a positive number\n    };\n  });\n\n  return items;\n}"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "63",
      "name": "ecommerce-currency",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.Currency"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "64",
      "name": "check-out-date",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.YYYYMMDD2"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "65",
      "name": "Measurement ID",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304306815",
      "parentFolderId": "50",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "66",
      "name": "check-in-date",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.YYYYMMDD1"
        }
      ],
      "fingerprint": "1758303991059",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "76",
      "name": "ecommerce-reservation-id",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.ResID"
        }
      ],
      "fingerprint": "1758303991060",
      "parentFolderId": "44",
      "formatValue": {}
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "variableId": "77",
      "name": "ecommerce-coupon",
      "type": "j",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "WsVars.CartItems[0].Promo"
        }
      ],
      "fingerprint": "1758303991060",
      "parentFolderId": "44",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "51",
      "name": "begin-checkout",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "4"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304065899",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "60",
      "name": "add-to-cart",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "EQUALS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "3"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304042766",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "70",
      "name": "purchase",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "5"
            }
          ]
        }
      ],
      "fingerprint": "1758304159683",
      "parentFolderId": "50"
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "triggerId": "73",
      "name": "view-item",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "2"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{be-view-class-on-body}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "WsRoomView"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{WsVars.HotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "17099"
            }
          ]
        }
      ],
      "fingerprint": "1758304200790",
      "parentFolderId": "50"
    }
  ],
  "tags": [
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "67",
      "name": "add-to-cart",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "add_to_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304046130",
      "firingTriggerId": [
        "60"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "78",
      "name": "purchase",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-reservation-id}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-coupon}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "tax"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-taxes}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "purchase"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304163453",
      "firingTriggerId": [
        "70"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "89",
      "name": "begin-checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-coupon}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "begin_checkout"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304071178",
      "firingTriggerId": [
        "51"
      ],
      "parentFolderId": "50",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "6003590540",
      "containerId": "43000071",
      "tagId": "96",
      "name": "view-item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "LIST",
          "key": "eventSettingsTable",
          "list": [
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "currency"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "value"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-value}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ecommerce-cart-items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-in-date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "item_category2"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{check-out-date}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1758304205256",
      "firingTriggerId": [
        "73"
      ],
      "parentFolderId": "50",
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
