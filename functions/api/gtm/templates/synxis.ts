export const template = {
  "variables": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "2",
      "name": "Synxis View Name",
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
          "value": "ViewName"
        }
      ],
      "fingerprint": "1686773406758",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "3",
      "name": "Synxis Hotel ID",
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
          "value": "HOTEL_ID"
        }
      ],
      "fingerprint": "1686773406760",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "4",
      "name": "Booking Engine Step",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function(){\nvar hotel = {{Synxis Hotel ID}}\nif(hotel==''){\n  hotel = {{Synxis Chain ID}}\n}\nif ({{Synxis View Name}}){\n  var viewName = {{Synxis View Name}}.toLowerCase()\n}\nelse var viewName = \"rooms\"\nvar e = \"sbe/\"+hotel+\"/booking-engine/\"+viewName\nif (viewName == \"rates\") {\n  e = \"sbe/\"+hotel+\"/booking-engine/rooms\"\n}\nreturn e}"
        }
      ],
      "fingerprint": "1686773406770",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "5",
      "name": "url",
      "type": "u",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "component",
          "value": "URL"
        }
      ],
      "fingerprint": "1686773406768"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "9",
      "name": "AdultQty",
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
          "value": "AdultQty"
        }
      ],
      "fingerprint": "1686773406764",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "13",
      "name": "ArrivalDt",
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
          "value": "ArrivalDt"
        }
      ],
      "fingerprint": "1686773406766",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "21",
      "name": "ChildQty",
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
          "value": "ChildQty"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "25",
      "name": "CurrCode",
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
          "value": "CurrCode"
        }
      ],
      "fingerprint": "1686773406775",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "30",
      "name": "DepartDt",
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
          "value": "DepartDt"
        }
      ],
      "fingerprint": "1686773406766",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "41",
      "name": "GuestQty",
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
          "value": "GuestQty"
        }
      ],
      "fingerprint": "1686773406767",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "46",
      "name": "ItineraryNo",
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
          "value": "ItineraryNo"
        }
      ],
      "fingerprint": "1686773406759",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "51",
      "name": "NightsQty",
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
          "value": "NightsQty"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "55",
      "name": "PromoCode",
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
          "value": "PromoCode"
        }
      ],
      "fingerprint": "1686773406764",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "74",
      "name": "Synxis - Chain Name",
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
          "value": "ChainNm"
        }
      ],
      "fingerprint": "1686773406765",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "76",
      "name": "Synxis Chain ID",
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
          "value": "CHAIN_ID"
        }
      ],
      "fingerprint": "1686773406762",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "79",
      "name": "Synxis Hotel Name",
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
          "value": "HName"
        }
      ],
      "fingerprint": "1686773406767",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "144",
      "name": "GA4 Measurement ID",
      "type": "c",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "value",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773424588",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "148",
      "name": "Coupon Code",
      "type": "u",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "component",
          "value": "QUERY"
        },
        {
          "type": "TEMPLATE",
          "key": "queryKey",
          "value": "coupon"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "149",
      "name": "Retail Product Attribute Filter Groups",
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
          "value": "retailFilterAttributeGroups"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "150",
      "name": "Retail Product Attribute Filter Names",
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
          "value": "retailFilterAttributeNames"
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "152",
      "name": "Retail Product Attribute Filter Codes",
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
          "value": "retailFilterAttributeCodes"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "153",
      "name": "SBE Config Code",
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
          "value": "ConfigCode"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "154",
      "name": "SBE Theme Code",
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
          "value": "ThemeCode"
        }
      ],
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "155",
      "name": "GA4 - items",
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
      "fingerprint": "1686773406592",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "162",
      "name": "GA4 - items array - boolean test",
      "type": "jsm",
      "parameter": [
        {
          "type": "TEMPLATE",
          "key": "javascript",
          "value": "function() {\n    var items = {{GA4 - items}};\n    return items.length ? true : false;\n}"
        }
      ],
      "fingerprint": "1686773406690",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "172",
      "name": "DLV Event",
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
          "value": "Event"
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "174",
      "name": "GA4 purchase adult qty",
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
          "value": "rpAdultQty"
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "175",
      "name": "GA4 promo code",
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
          "value": "rpPromoCode"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "176",
      "name": "GA4 purchase guest qty",
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
          "value": "rpGuestQty"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "177",
      "name": "GA4 purchase child qty",
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
          "value": "rpChildQty"
        }
      ],
      "fingerprint": "1686773406598",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "178",
      "name": "GA4 transaction currency",
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
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "179",
      "name": "SBE - Hotel City",
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
          "value": "Hotel.City"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "180",
      "name": "GA4 transaction tax",
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
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "181",
      "name": "GA4 purchase depart date",
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
          "value": "rpDepartDt"
        }
      ],
      "fingerprint": "1686773406599",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "182",
      "name": "GA4 purchase rate code",
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
          "value": "ecommerce.items.item_category_2"
        }
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "183",
      "name": "GA4 purchase book date",
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
          "value": "rpBookDt"
        }
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "184",
      "name": "GA4 transaction value",
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
      ],
      "fingerprint": "1686773406600",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "185",
      "name": "SBE - Hotel Region",
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
          "value": "Hotel.Region"
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "186",
      "name": "GA4 purchase room code",
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
          "value": "ecommerce.items.item_id"
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "188",
      "name": "GA4 purchase arrival date",
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
          "value": "rpArrivalDt"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "189",
      "name": "SBE - Hotel Country",
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
          "value": "Hotel.Country"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "190",
      "name": "GA4 purchase room name",
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
          "value": "ecommerce.items.item_name"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "191",
      "name": "GA4 purchase group code",
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
          "value": "rpGroupCode"
        }
      ],
      "fingerprint": "1686773406602",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "192",
      "name": "GA4 purchase rate name",
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
          "value": "ecommerce.items.item_category"
        }
      ],
      "fingerprint": "1686773406603",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "193",
      "name": "GA4 purchase confirmation number",
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
      ],
      "fingerprint": "1686773406680",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "195",
      "name": "Retail Product Filter Category",
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
          "value": "OfferCategory"
        }
      ],
      "fingerprint": "1686773406681",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "207",
      "name": "Retail Product Filter Search",
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
          "value": "FilterSearchUsed"
        }
      ],
      "fingerprint": "1686773406684",
      "parentFolderId": "140",
      "formatValue": {}
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "variableId": "219",
      "name": "Available Rooms",
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
          "value": "AvailRooms"
        }
      ],
      "fingerprint": "1686773406688",
      "parentFolderId": "140",
      "formatValue": {}
    }
  ],
  "triggers": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "141",
      "name": "GA4 - Retail Offers - view_item_list",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "Offers"
            }
          ]
        }
      ],
      "fingerprint": "1686773406589",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "151",
      "name": "GA4 - Retail Offers - attribute filter",
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
              "value": "retailproduct_attribute_filter"
            }
          ]
        }
      ],
      "fingerprint": "1686773406591",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "158",
      "name": "GA4 - Retail Offers - select_item",
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
              "value": "select_item"
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
              "value": "{{Page Path}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "addons"
            }
          ]
        }
      ],
      "fingerprint": "1686773406593",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "163",
      "name": "GA4 remove_from_cart",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406594",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "166",
      "name": "GA4 - Retail Offers - category filter",
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
              "value": "retailproducts.filterevent.category"
            }
          ]
        }
      ],
      "fingerprint": "1686773406595",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "167",
      "name": "GA4 - Retail Offers - view_item",
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
      ],
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
              "value": "addons"
            }
          ]
        }
      ],
      "fingerprint": "1686773406595",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "170",
      "name": "GA4 Rooms add_to_cart",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        }
      ],
      "fingerprint": "1686773406596",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "173",
      "name": "GA4 - Retail Offers - add_to_cart",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{DLV Event}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "retailProducts"
            }
          ]
        }
      ],
      "fingerprint": "1686773406597",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "187",
      "name": "GA4 purchase",
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
              "value": "roomPurchase"
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
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406601",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "197",
      "name": "GA4 View Item Rooms",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406682",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "199",
      "name": "GA4 - Addons view_item_list",
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
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": ".*Add\\-ons.*"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406682",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "202",
      "name": "GA4 Addons add_to_cart",
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
      ],
      "filter": [
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Synxis View Name}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": ".*Add\\-ons.*"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406683",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "204",
      "name": "GA4 begin_checkout",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "true"
            }
          ]
        }
      ],
      "fingerprint": "1686773406684",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "208",
      "name": "GA4 - Retail Offers - search filter",
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
              "value": "retailproducts.filterevent.search"
            }
          ]
        }
      ],
      "fingerprint": "1686773406685",
      "parentFolderId": "140"
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "triggerId": "220",
      "name": "GA4 - Rooms view_item_list",
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
      ],
      "filter": [
        {
          "type": "CONTAINS",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{Booking Engine Step}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "rooms"
            }
          ]
        },
        {
          "type": "MATCH_REGEX",
          "parameter": [
            {
              "type": "TEMPLATE",
              "key": "arg0",
              "value": "{{GA4 - items array - boolean test}}"
            },
            {
              "type": "TEMPLATE",
              "key": "arg1",
              "value": "^true$"
            }
          ]
        }
      ],
      "fingerprint": "1686773406688",
      "parentFolderId": "140"
    }
  ],
  "tags": [
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "156",
      "name": "GA4 Retail Products attribute filter",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_groups"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Groups}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_names"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Names}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_attribute_codes"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Attribute Filter Codes}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_attribute"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406593",
      "firingTriggerId": [
        "151"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "159",
      "name": "GA4 Retail Products select_item",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "select_item"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406593",
      "firingTriggerId": [
        "158"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "168",
      "name": "GA4 Retail Products view_item",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
      "fingerprint": "1686773406596",
      "firingTriggerId": [
        "167"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "171",
      "name": "GA4 Rooms add_to_cart",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
                  "value": "{{CurrCode}}"
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
      "fingerprint": "1686773406596",
      "firingTriggerId": [
        "170"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "194",
      "name": "GA4 Purchase",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
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
                  "value": "{{GA4 purchase confirmation number}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "affiliation"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "Synxis Booking Engine"
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
                  "value": "{{GA4 transaction value}}"
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
                  "value": "{{GA4 transaction tax}}"
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
                  "value": "{{GA4 transaction currency}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 promo code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "group_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase group code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase guest qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase adult qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase child qty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase room name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "room_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase room code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "rate_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase rate name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "rate_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase rate code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase arrival date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase depart date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "book_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 purchase book date}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "itinerary_number"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ItineraryNo}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_city"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel City}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_region"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel Region}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_country"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE - Hotel Country}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "purchase_full_url"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{url}}"
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
      "fingerprint": "1686773406681",
      "firingTriggerId": [
        "187"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "196",
      "name": "GA4 Retail Products category filter",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_search"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Filter Category}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_category"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406681",
      "firingTriggerId": [
        "166"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "198",
      "name": "GA4 Rooms view_item",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
                  "value": "{{CurrCode}}"
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
      "fingerprint": "1686773406682",
      "firingTriggerId": [
        "197"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "203",
      "name": "GA4 Addons add_to_cart",
      "type": "gaawe",
      "parameter": [
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
      "fingerprint": "1686773406683",
      "firingTriggerId": [
        "202"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "205",
      "name": "GA4 remove_from_cart",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "remove_from_cart"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406684",
      "firingTriggerId": [
        "163"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "209",
      "name": "GA4 Retail Products search filter",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "filter_search"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Retail Product Filter Search}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "retail_product_filter_search"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406685",
      "firingTriggerId": [
        "208"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "213",
      "name": "GA4 begin_checkout",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
                  "value": "{{CurrCode}}"
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
      "fingerprint": "1686773406686",
      "firingTriggerId": [
        "204"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "215",
      "name": "GA4 Addons view_item_list",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_addons"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "place holder"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406687",
      "firingTriggerId": [
        "199"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "217",
      "name": "GA4 Retail Products add_to_cart",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
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
      "fingerprint": "1686773406687",
      "firingTriggerId": [
        "173"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "222",
      "name": "GA4 Rooms view_item_list",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_rooms"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Available Rooms}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406688",
      "firingTriggerId": [
        "220"
      ],
      "parentFolderId": "140",
      "tagFiringOption": "ONCE_PER_EVENT",
      "monitoringMetadata": {
        "type": "MAP"
      },
      "consentSettings": {
        "consentStatus": "NOT_SET"
      }
    },
    {
      "accountId": "2841819166",
      "containerId": "8723234",
      "tagId": "224",
      "name": "GA4 Retail Products view_item_list",
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
                  "value": "items"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GA4 - items}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_id"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Chain ID}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "hotel_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis Hotel Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "chain_name"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Synxis - Chain Name}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "arrival_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ArrivalDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "departure_date"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{DepartDt}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "adult_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{AdultQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "child_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{ChildQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "guest_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{GuestQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "promo_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{PromoCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "available_rooms"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Available Rooms}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "nights_qty"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{NightsQty}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "coupon_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{Coupon Code}}"
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
                  "value": "{{CurrCode}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "theme_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Theme Code}}"
                }
              ]
            },
            {
              "type": "MAP",
              "map": [
                {
                  "type": "TEMPLATE",
                  "key": "parameter",
                  "value": "config_code"
                },
                {
                  "type": "TEMPLATE",
                  "key": "parameterValue",
                  "value": "{{SBE Config Code}}"
                }
              ]
            }
          ]
        },
        {
          "type": "TEMPLATE",
          "key": "eventName",
          "value": "view_item_list"
        },
        {
          "type": "TEMPLATE",
          "key": "measurementIdOverride",
          "value": "{{MEASUREMENT_ID_OVERRIDE}}"
        }
      ],
      "fingerprint": "1686773406689",
      "firingTriggerId": [
        "141"
      ],
      "parentFolderId": "140",
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
