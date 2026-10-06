const GTM_API_BASE = 'https://tagmanager.googleapis.com/tagmanager/v2';

export const createVariable = async (accessToken: string, containerPath: string, variableName: string) => {
  const payload = {
    name: `DLV - ${variableName}`,
    type: "v",
    parameter: [
      { type: "template", key: "name", value: variableName },
      { type: "integer", key: "dataLayerVersion", value: "2" }
    ]
  };

  return fetch(`${GTM_API_BASE}/${containerPath}/workspaces/ACTIVE/variables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const createTrigger = async (accessToken: string, containerPath: string, regexPattern: string) => {
  const payload = {
    name: "Click - Dynamic Outbound",
    type: "click",
    filter: [
      {
        type: "matchRegex",
        parameter: [
          { type: "template", key: "arg0", value: "{{Click URL}}" },
          { type: "template", key: "arg1", value: regexPattern }
        ]
      }
    ]
  };

  return fetch(`${GTM_API_BASE}/${containerPath}/workspaces/ACTIVE/triggers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

export const createTag = async (accessToken: string, containerPath: string, triggerId: string, measurementId: string, eventName: string) => {
  const payload = {
    name: `GA4 - Event - ${eventName}`,
    type: "gaawe",
    parameter: [
      { type: "template", key: "measurementId", value: measurementId },
      { type: "template", key: "eventName", value: eventName },
      {
        type: "list",
        key: "eventParameters",
        list: [
          {
            type: "map",
            map: [
              { type: "template", key: "name", value: "link_url" },
              { type: "template", key: "value", value: "{{Click URL}}" }
            ]
          }
        ]
      }
    ],
    firingTriggerId: [triggerId]
  };

  return fetch(`${GTM_API_BASE}/${containerPath}/workspaces/ACTIVE/tags`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
