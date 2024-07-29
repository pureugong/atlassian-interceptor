async function jiraInterceptor(details) {
    console.log('[Jira] Intercepted request:', details);
  
    if (details.url.includes(`${config.jiraHost}${config.interceptPaths[0]}`)) {
      console.log('[Jira] Matched assignable user search URL');
  
      // Extract the query parameters
      const url = new URL(details.url);
      const username = url.searchParams.get('username');
  
      // Construct the new URL for autocomplete suggestions
      const newUrl = `https://${config.jiraHost}${config.interceptPaths[1]}?fieldName=assignee&fieldValue=${username}`;
      
      console.log('[Jira] Calling autocomplete suggestions:', newUrl);
  
      try {
        const response = await fetch(newUrl);
        const data = await response.json();
  
        // Transform the autocomplete suggestions data into the required format
        const transformedData = data.results.map(item => {
          // Extract email and clean display name
          const match = item.displayName.match(/(.+) - (.+@.+) \(.+\)/);
          const cleanDisplayName = match ? match[1] : item.displayName;
          const email = match ? match[2] : `${item.value}@fastretailing.com`;
  
          return {
            "self": `https://${config.jiraHost}/rest/api/2/user?username=${item.value}`,
            "key": item.value,
            "name": item.value,
            "emailAddress": email,
            "avatarUrls": {
              "48x48": `https://${config.jiraHost}/secure/useravatar?ownerId=${item.value}&avatarId=13732`,
              "24x24": `https://${config.jiraHost}/secure/useravatar?size=small&ownerId=${item.value}&avatarId=13732`,
              "16x16": `https://${config.jiraHost}/secure/useravatar?size=xsmall&ownerId=${item.value}&avatarId=13732`,
              "32x32": `https://${config.jiraHost}/secure/useravatar?size=medium&ownerId=${item.value}&avatarId=13732`
            },
            "displayName": cleanDisplayName,
            "active": true,
            "deleted": false,
            "timeZone": "Asia/Tokyo",
            "locale": "en_US"
          };
        });
  
        return {
          redirectUrl: 'data:application/json,' + encodeURIComponent(JSON.stringify(transformedData))
        };
      } catch (error) {
        console.error('[Jira] Error fetching autocomplete suggestions:', error);
        // If there's an error, we'll let the original request go through
        return null;
      }
    }
  
    // For other Jira URLs, we don't intercept
    return null;
  }
  
  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      if (config.jiraHost && details.url.includes(config.jiraHost)) {
        return {redirectUrl: chrome.runtime.getURL('data/empty.json')};
      }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
  
  chrome.webRequest.onBeforeSendHeaders.addListener(
    async function(details) {
      if (config.jiraHost && details.url.includes(config.jiraHost)) {
        const result = await jiraInterceptor(details);
        if (result) {
          return result;
        }
      }
      return {requestHeaders: details.requestHeaders};
    },
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
  );