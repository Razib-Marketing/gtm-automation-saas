export const template = {
  "variables": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "17",
      "name": "content-name",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "content-name"
        }
      ],
      "fingerprint": "1553703890149",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "21",
      "name": "ihAmount",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihAmount"
        }
      ],
      "fingerprint": "1553703890152",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "22",
      "name": "ihTaxes",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihTaxes"
        }
      ],
      "fingerprint": "1553703890153",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "23",
      "name": "ihAmountAfterTax",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\nreturn parseFloat({{ihAmount}}) + parseFloat({{ihTaxes}});\n}\n"
        }
      ],
      "fingerprint": "1553703890154",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "24",
      "name": "ihAmountBeforeTax",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihAmountBeforeTax"
        }
      ],
      "fingerprint": "1553703890155",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "27",
      "name": "ihConfirmID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihConfirmID"
        }
      ],
      "fingerprint": "1553703890157",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "28",
      "name": "ihCurrency",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihCurrency"
        }
      ],
      "fingerprint": "1553703890158",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "29",
      "name": "ihDate",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihDate"
        }
      ],
      "fingerprint": "1553703890159",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "30",
      "name": "ihDateOut",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihDateOut"
        }
      ],
      "fingerprint": "1553703890160",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "36",
      "name": "ihHotelID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihHotelID"
        }
      ],
      "fingerprint": "1553703890168",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "37",
      "name": "ihHotelName",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihHotelName"
        }
      ],
      "fingerprint": "1553703890169",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "39",
      "name": "ihNights",
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
          "value": "ihNights"
        }
      ],
      "fingerprint": "1553703890170",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "41",
      "name": "ihRatePlanID",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihRatePlanID"
        }
      ],
      "fingerprint": "1553703890172",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "42",
      "name": "ihRatePlanName",
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
          "value": "ihRatePlanName"
        }
      ],
      "fingerprint": "1553703890173",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "44",
      "name": "ihRoomType",
      "type": "v",
      "parameter": [
        {
          "type": "INTEGER",
          "key": "dataLayerVersion",
          "value": "1"
        },
        {
          "type": "BOOLEAN",
          "key": "setDefaultValue",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "name",
          "value": "ihRoomType"
        }
      ],
      "fingerprint": "1553703890174",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "87",
      "name": "tc - dl - ecommerce.items",
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
      ],
      "fingerprint": "1745008400699",
      "parentFolderId": "65",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "93",
      "name": "GA4 - Code",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1745008400738",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "114",
      "name": "view_item_room_type",
      "type": "d",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "elementSelector",
          "value": "h1.RoomDetail-title"
        },
        {
          "type": "TEMPLATE",
          "key": "attributeName",
          "value": "room_type"
        },
        {
          "type": "TEMPLATE",
          "key": "selectorType",
          "value": "CSS"
        }
      ],
      "fingerprint": "1745009670083",
      "formatValue": {
        "caseConversionType": "LOWERCASE"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "115",
      "name": "item_view_price",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  var el = document.querySelector(\n    'div.PricingBox-option-text-subTotal > b.rates.subtotal-rates > div'\n  );\n  if (el && el.textContent) {\n    var txt = el.textContent.replace(/\\s+/g, '');\n    return parseFloat(txt.replace('$', ''));\n  }\n  return null;\n}"
        }
      ],
      "fingerprint": "1745010612613",
      "formatValue": {}
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "variableId": "117",
      "name": "item_variable",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n  try {\n    var gtmRatePlanIdVar = {{ihRatePlanID}};\n    var gtmRatePlanNameVar = {{ihRatePlanName}};\n    var gtmRoomTypeVar = {{ihRoomType}};\n    var gtmNightsVar = {{ihNights}};\n    var gtmAmountBeforeTaxVar = {{ihAmountBeforeTax}};\n    var itemId = gtmRatePlanIdVar || 'N/A';\n    var itemName = gtmRatePlanNameVar || 'N/A';\n    var itemCategory = gtmRoomTypeVar || 'N/A';\n\n    var quantity = parseInt(gtmNightsVar, 10);\n    if (isNaN(quantity) || quantity < 1) {\n      quantity = 1;\n    }\n    var totalValue = parseFloat(gtmAmountBeforeTaxVar);\n    if (isNaN(totalValue)) {\n      totalValue = 0;\n    }\n    var price = 0;\n    if (quantity > 0) {\n      price = parseFloat((totalValue / quantity).toFixed(2));\n    } else {\n      price = totalValue;\n    }\n     if (isNaN(price)) {\n        price = 0;\n     }\n    var item = {\n      item_id: String(itemId),\n      item_name: String(itemName),\n      item_category: String(itemCategory),\n      quantity: quantity\n    };\n\n    return [item];\n\n  } catch (e) {\n    return [];\n  }\n}"
        }
      ],
      "fingerprint": "1745011510962",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "12",
      "name": "Page View Event",
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
              "value": "content-view"
            }
          ]
        }
      ],
      "fingerprint": "1553703890135",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "69",
      "name": "Shopping Cart Total",
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
              "value": "content-view"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{content-name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "total|checkout"
            },
            {
              "type": "BOOLEAN",
              "key": "ignore_case",
              "value": "true"
            }
          ]
        },
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{ihHotelID}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "109342"
            }
          ]
        }
      ],
      "fingerprint": "1729112721888",
      "parentFolderId": "5"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "94",
      "name": "GA4 - Rooms - Trigger",
      "type": "PAGEVIEW",
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Page Path}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "/rooms/"
            }
          ]
        }
      ],
      "fingerprint": "1745008400738"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "106",
      "name": "tc - trigger - ga4 event - purchase",
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
              "value": "ga4_purchase"
            }
          ]
        }
      ],
      "fingerprint": "1745008400739",
      "parentFolderId": "65"
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "triggerId": "116",
      "name": "View Item V2",
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
              "value": "content-view"
            }
          ]
        }
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{content-name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "accommodation/room"
            }
          ]
        }
      ],
      "fingerprint": "1745010787646"
    }
  ],
  "tags": [
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "1",
      "name": "Push eCommerce Data",
      "type": "html",
      "priority": {
        "type": "INTEGER",
        "value": "100"
      },
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "html",
          "value": "<script>\nif(window.multiRoomReservation != undefined){\n\tdataLayer.push(function(){\n    var transactionProduct = [];\n    for(var i = 0; i < this.get('ihReservations').length; i ++){\n      var price = this.get('ihReservations')[i].ihAmount / this.get('ihReservations')[i].ihNights;\n      \ttransactionProduct.push({\n \t\t'sku': this.get('ihReservations')[i].ihConfirmID,\n \t\t'name': this.get('ihReservations')[i].ihRoomType,\n \t\t'category': this.get('ihReservations')[i].ihRatePlanName,\n \t\t'price': price,\n \t\t'quantity': this.get('ihReservations')[i].ihNights,\n \t\t})\n    }\n   \n  dataLayer.push({\n \t'transactionId':'{{ihHotelName}}'+' '+'{{ihConfirmID}}',\n   \t'transactionTotal': {{ihAmount}},\n   \t'transactionTax': {{ihTaxes}},\n \t'transactionProducts': transactionProduct\n\t})\n  });\n}else{\ndataLayer.push({\n   'transactionId':'{{ihHotelName}}'+' '+'{{ihConfirmID}}',\n   'transactionTotal': {{ihAmount}},\n   'transactionTax': {{ihTaxes}},\n   'transactionProducts': [{\n       'sku': '{{ihConfirmID}}',\n       'name': '{{ihRoomType}}',\n       'category': '{{ihRatePlanName}}',\n       'price': {{ihAmount}}/{{ihNights}},\n       'quantity': {{ihNights}}\n   }]\n});\n\n}\n\n</script>"
        },
        {
          "type": "BOOLEAN",
          "key": "supportDocumentWrite",
          "value": "true"
        }
      ],
      "fingerprint": "1745012026068",
      "firingTriggerId": [
        "12"
      ],
      "parentFolderId": "5",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NEEDED",
        "consentType": {
          "type": "LIST",
          "list": [
            {
              "type": "TEMPLATE",
              "value": "security_storage"
            }
          ]
        }
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "95",
      "name": "GA4 - Rooms - Tag",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
          "value": "false"
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "rooms_click"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011827837",
      "firingTriggerId": [
        "94"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "107",
      "name": "BE- Purchase Tag",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
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
                  "value": "transaction_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihConfirmID}}"
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
                  "value": "{{ihAmountAfterTax}}"
                }
              ]
            },
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
                  "value": "{{ihCurrency}}"
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
                  "value": "{{ihTaxes}}"
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
                  "value": "{{tc - dl - ecommerce.items}}"
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
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011802342",
      "firingTriggerId": [
        "106"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "109",
      "name": "View Item",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
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
                  "value": "item_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{view_item_room_type}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_in_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDate}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_out_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDateOut}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "price"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{item_view_price}}"
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
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011863275",
      "firingTriggerId": [
        "116"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    },
    {
      "accountId": "4395588209",
      "containerId": "11439948",
      "tagId": "112",
      "name": "Begin Checkout",
      "type": "gaawe",
      "parameter": [
        {
          "type": "BOOLEAN",
          "key": "sendEcommerceData",
          "value": "false"
        },
        {
          "type": "BOOLEAN",
          "key": "enhancedUserId",
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
                  "value": "{{ihCurrency}}"
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
                  "value": "{{ihAmountBeforeTax}}"
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
                  "value": "{{item_variable}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_in_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDate}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "check_out_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ihDateOut}}"
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
          "value": "{{GA4 - Code}}"
        }
      ],
      "fingerprint": "1745011815641",
      "firingTriggerId": [
        "69"
      ],
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_NEEDED"
      }
    }
  ]
};
