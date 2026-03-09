document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('nameInput');
  const addButton = document.getElementById('addButton');
  const nameList = document.getElementById('nameList');

  const bulkInput = document.getElementById('bulkInput');
  const bulkAddButton = document.getElementById('bulkAddButton');
  const clearAllButton = document.getElementById('clearAllButton');
  const itemCount = document.getElementById('itemCount');

  const urlInput = document.getElementById('urlInput');
  const addUrlButton = document.getElementById('addUrlButton');
  const urlList = document.getElementById('urlList');
  const urlCount = document.getElementById('urlCount');

  const bgColorInput = document.getElementById('bgColorInput');
  const textColorInput = document.getElementById('textColorInput');
  const bgOpacityInput = document.getElementById('bgOpacityInput');
  const bgOpacityValue = document.getElementById('bgOpacityValue');

  const refreshUrlsButton = document.getElementById('refreshUrlsButton');
  const fetchStatusBar = document.getElementById('fetchStatusBar');
  const fetchWarning = document.getElementById('fetchWarning');

  // Load existing names, URLs, colors, and fetch status
  loadNames();
  loadUrls();
  loadColors();
  loadFetchStatus();

  bgColorInput.addEventListener('change', () => saveColors());
  textColorInput.addEventListener('change', () => saveColors());
  bgOpacityInput.addEventListener('input', () => {
    bgOpacityValue.textContent = bgOpacityInput.value + '%';
    saveColors();
  });

  addButton.addEventListener('click', () => addName(nameInput.value));

  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addName(nameInput.value);
    }
  });

  addUrlButton.addEventListener('click', () => addUrl(urlInput.value));

  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addUrl(urlInput.value);
    }
  });

  refreshUrlsButton.addEventListener('click', () => {
    fetchStatusBar.style.display = 'block';
    fetchStatusBar.textContent = 'Fetching...';
    fetchWarning.style.display = 'none';
    chrome.runtime.sendMessage({ action: 'fetchUrls' }, (response) => {
      if (chrome.runtime.lastError) {
        showWarning('Could not reach background service. Try reloading the extension.');
        return;
      }
      displayFetchResult(response);
    });
  });

  bulkAddButton.addEventListener('click', () => {
    const text = bulkInput.value;
    if (!text.trim()) return;

    // Split by newlines and parse
    const rawItems = text.split(/[\n\t]+/);
    const newItems = rawItems.map(item => item.trim()).filter(item => item);

    if (newItems.length === 0) return;

    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = new Set(result.namesToMark);
      newItems.forEach(item => names.add(item));
      const namesArray = Array.from(names);

      chrome.storage.local.set({ namesToMark: namesArray }, () => {
        bulkInput.value = '';
        loadNames();
      });
    });
  });

  clearAllButton.addEventListener('click', () => {
    chrome.storage.local.set({ namesToMark: [] }, () => {
      loadNames();
    });
  });

  function loadNames() {
    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      nameList.innerHTML = '';
      itemCount.textContent = result.namesToMark.length;

      result.namesToMark.forEach(name => {
        const li = document.createElement('li');
        // Truncate long strings for UI gracefully
        li.textContent = name.length > 30 ? name.substring(0, 30) + '...' : name;
        li.title = name;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.addEventListener('click', () => removeName(name));

        li.appendChild(removeBtn);
        nameList.appendChild(li);
      });
    });
  }

  function addName(inputValue) {
    const name = inputValue.trim();
    if (!name) return;

    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = result.namesToMark;
      if (!names.includes(name)) {
        names.push(name);
        chrome.storage.local.set({ namesToMark: names }, () => {
          nameInput.value = '';
          loadNames();
        });
      } else {
        nameInput.value = '';
      }
    });
  }

  function removeName(nameToRemove) {
    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = result.namesToMark.filter(name => name !== nameToRemove);
      chrome.storage.local.set({ namesToMark: names }, () => {
        loadNames();
      });
    });
  }

  function loadUrls() {
    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      urlList.innerHTML = '';
      urlCount.textContent = result.subscriptionUrls.length;

      result.subscriptionUrls.forEach(url => {
        const li = document.createElement('li');
        li.textContent = url.length > 40 ? url.substring(0, 40) + '...' : url;
        li.title = url;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'remove-btn';
        removeBtn.addEventListener('click', () => removeUrl(url));

        li.appendChild(removeBtn);
        urlList.appendChild(li);
      });
    });
  }

  function addUrl(inputValue) {
    const url = inputValue.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch (_) {
      alert("Please enter a valid URL.");
      return;
    }

    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      const urls = result.subscriptionUrls;
      if (!urls.includes(url)) {
        urls.push(url);
        chrome.storage.local.set({ subscriptionUrls: urls }, () => {
          urlInput.value = '';
          loadUrls();
          // Trigger background script to fetch immediately
          chrome.runtime.sendMessage({ action: 'fetchUrls' });
        });
      } else {
        urlInput.value = '';
      }
    });
  }

  function removeUrl(urlToRemove) {
    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      const urls = result.subscriptionUrls.filter(url => url !== urlToRemove);
      chrome.storage.local.set({ subscriptionUrls: urls }, () => {
        loadUrls();
        // Since a URL was removed, we should probably re-fetch remaining to clear out old data
        // Or simply trigger fetchUrls to rebuild the downloaded list
        chrome.runtime.sendMessage({ action: 'fetchUrls' });
      });
    });
  }

  function loadColors() {
    chrome.storage.local.get({ bgColor: '#ffff00', textColor: '#ff0000', bgOpacity: 100 }, (result) => {
      bgColorInput.value = result.bgColor;
      textColorInput.value = result.textColor;
      bgOpacityInput.value = result.bgOpacity;
      bgOpacityValue.textContent = result.bgOpacity + '%';
    });
  }

  function saveColors() {
    const bgColor = bgColorInput.value;
    const textColor = textColorInput.value;
    const bgOpacity = parseInt(bgOpacityInput.value);
    chrome.storage.local.set({ bgColor, textColor, bgOpacity });
  }

  function loadFetchStatus() {
    chrome.storage.local.get({ fetchStatus: null }, (result) => {
      if (result.fetchStatus) {
        displayFetchResult(result.fetchStatus);
      }
    });
  }

  function displayFetchResult(result) {
    if (!result) return;

    if (result.status === 'ok') {
      fetchStatusBar.style.display = 'block';
      fetchStatusBar.textContent = `✅ Last fetch: ${result.totalItems} items loaded.`;
      fetchStatusBar.style.color = '#28a745';
      fetchWarning.style.display = 'none';
    } else if (result.status === 'warning') {
      fetchStatusBar.style.display = 'block';
      fetchStatusBar.textContent = `⚠️ Fetched ${result.totalItems} items with warnings.`;
      fetchStatusBar.style.color = '#856404';
      showWarning(result.errors.join('\n'));
    } else if (result.status === 'error') {
      fetchStatusBar.style.display = 'block';
      fetchStatusBar.textContent = '❌ Fetch failed.';
      fetchStatusBar.style.color = '#dc3545';
      showWarning(result.errors.join('\n'));
    }
  }

  function showWarning(message) {
    fetchWarning.style.display = 'block';
    fetchWarning.textContent = message;
  }
});
