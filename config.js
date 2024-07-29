let config = {};

fetch(chrome.runtime.getURL('config.json'))
  .then(response => response.json())
  .then(loadedConfig => {
    config = loadedConfig;
    console.log('Configuration loaded:', config);
  })
  .catch(error => console.error('Error loading configuration:', error));