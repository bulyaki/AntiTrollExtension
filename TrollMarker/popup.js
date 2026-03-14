// Layout measurement and sizing constants
const LAYOUT = {
  bodyPadding: 12,
  shellPadding: 12,
  shellBorder: 2, // 1px * 2 sides
  topbarMarginBottom: 10,
  panelMarginBottom: 12,
  segmentedControlGap: 8,
  segmentedControlMarginBottom: 12,

  // Topbar
  brandIconSize: 38,
  brandCopyHeight: 36,

  // Appearance panel
  appearancePanelPadding: 14,
  appearancePanelBorder: 2,
  appearanceGridGap: 10,
  fieldGap: 6,
  swatchControlHeight: 40,
  fieldLabelHeight: 14,

  // Tab buttons
  tabButtonHeight: 36,

  // Panel headers
  panelHeadMarginBottom: 10,
  panelHeadHeight: 32,

  // Forms
  inlineFormGap: 10,
  inlineFormMarginBottom: 10,
  inputHeight: 38,
  btnHeight: 38,

  // Bulk composer
  inlineToggleHeight: 34,
  inlineToggleMarginBottom: 8,
  bulkComposerMarginBottom: 10,
  textareaHeight: 86,
  composerActionsMarginTop: 10,

  // Lists
  itemListBorder: 2,
  itemListBorderRadius: 13,
  listItemMinHeight: 40,
  listItemPadding: 16, // 8px top + 8px bottom
  emptyStateHeight: 78,
  listMaxHeight: 212,

  // Status bars
  statusBarMarginBottom: 10,
  statusBarPadding: 20, // 10px * 2
  statusBarHeight: 40,
};

// Calculate exact heights
function calculateHeights() {
  // Topbar: icon height + margins
  const topbarHeight = LAYOUT.brandCopyHeight + LAYOUT.topbarMarginBottom;

  // Appearance panel: padding*2 + border + grid content
  const appearanceRow1Height = LAYOUT.fieldLabelHeight + LAYOUT.swatchControlHeight;
  const appearanceRow2Height = LAYOUT.fieldLabelHeight + LAYOUT.swatchControlHeight;
  const appearanceRow3Height = LAYOUT.fieldLabelHeight + LAYOUT.sliderControlHeight;
  const appearanceContentHeight = appearanceRow1Height + LAYOUT.appearanceGridGap + appearanceRow3Height;
  const appearancePanelHeight = LAYOUT.appearancePanelPadding * 2 + LAYOUT.appearancePanelBorder + appearanceContentHeight;

  // Segmented control
  const segmentedControlHeight = LAYOUT.tabButtonHeight + LAYOUT.segmentedControlMarginBottom;

  return { topbarHeight, appearancePanelHeight, segmentedControlHeight };
}

// Measure actual DOM element heights
function measureElementHeight(element) {
  if (!element || element.hidden || element.offsetParent === null) {
    return 0;
  }
  return element.offsetHeight;
}

// Calculate total content height
function calculateContentHeight() {
  const appShell = document.querySelector('.app-shell');
  if (!appShell) return 0;

  let contentHeight = 0;

  // Measure all visible children of app-shell
  const children = appShell.children;
  for (const child of children) {
    contentHeight += measureElementHeight(child);
  }

  // Add shell padding and border
  contentHeight += LAYOUT.shellPadding * 2 + LAYOUT.shellBorder;

  return contentHeight;
}

// Resize popup window to fit content
function resizePopup() {
  requestAnimationFrame(() => {
    const contentHeight = calculateContentHeight();

    // Add small buffer for rendering consistency
    const targetHeight = Math.ceil(contentHeight + 4);

    // Get current window
    chrome.windows.getCurrent((window) => {
      if (!window) return;

      // Only resize if height differs significantly (>2px)
      const heightDiff = Math.abs(window.height - targetHeight);
      if (heightDiff > 2) {
        chrome.windows.update(window.id, {
          height: targetHeight,
          width: 368 // Keep fixed width
        });
      }
    });
  });
}

// Debounced resize for performance
let resizeTimeout = null;
function scheduleResize() {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(resizePopup, 50);
}

document.addEventListener('DOMContentLoaded', () => {
  const namesPanel = document.getElementById('namesPanel');
  const sourcesPanel = document.getElementById('sourcesPanel');
  const tabButtons = Array.from(document.querySelectorAll('.tab-button'));

  const nameInput = document.getElementById('nameInput');
  const addButton = document.getElementById('addButton');
  const nameList = document.getElementById('nameList');
  const clearAllButton = document.getElementById('clearAllButton');
  const itemCount = document.getElementById('itemCount');

  const bulkToggleButton = document.getElementById('bulkToggleButton');
  const bulkComposer = document.getElementById('bulkComposer');
  const bulkInput = document.getElementById('bulkInput');
  const bulkAddButton = document.getElementById('bulkAddButton');

  const urlInput = document.getElementById('urlInput');
  const addUrlButton = document.getElementById('addUrlButton');
  const urlList = document.getElementById('urlList');
  const urlCount = document.getElementById('urlCount');
  const refreshUrlsButton = document.getElementById('refreshUrlsButton');

  const bgColorInput = document.getElementById('bgColorInput');
  const textColorInput = document.getElementById('textColorInput');
  const bgOpacityInput = document.getElementById('bgOpacityInput');
  const bgOpacityValue = document.getElementById('bgOpacityValue');
  const bgColorValue = document.getElementById('bgColorValue');
  const textColorValue = document.getElementById('textColorValue');
  const bgColorSwatch = document.getElementById('bgColorSwatch');
  const textColorSwatch = document.getElementById('textColorSwatch');

  const fetchStatusBar = document.getElementById('fetchStatusBar');
  const fetchWarning = document.getElementById('fetchWarning');

  setActivePanel('namesPanel');
  setBulkComposer(false);

  loadNames();
  loadUrls();
  loadColors();
  loadFetchStatus();

  // Initial resize after content loads
  scheduleResize();

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setActivePanel(button.dataset.panel);
      scheduleResize();
    });
  });

  bulkToggleButton.addEventListener('click', () => {
    setBulkComposer(bulkComposer.hidden);
    scheduleResize();
  });

  bgColorInput.addEventListener('input', () => {
    updateAppearanceLabels();
    saveColors();
  });

  textColorInput.addEventListener('input', () => {
    updateAppearanceLabels();
    saveColors();
  });

  bgOpacityInput.addEventListener('input', () => {
    updateAppearanceLabels();
    saveColors();
  });

  addButton.addEventListener('click', () => addName(nameInput.value));
  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addName(nameInput.value);
    }
  });

  bulkAddButton.addEventListener('click', () => {
    const rawItems = bulkInput.value.split(/[\n\r\t]+/);
    const newItems = rawItems.map((item) => item.trim()).filter(Boolean);

    if (newItems.length === 0) {
      return;
    }

    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = new Set(result.namesToMark);
      newItems.forEach((item) => names.add(item));

      chrome.storage.local.set({ namesToMark: Array.from(names) }, () => {
        bulkInput.value = '';
        setBulkComposer(false);
        loadNames();
        scheduleResize();
      });
    });
  });

  clearAllButton.addEventListener('click', () => {
    chrome.storage.local.set({ namesToMark: [] }, () => {
      loadNames();
      scheduleResize();
    });
  });

  addUrlButton.addEventListener('click', () => addUrl(urlInput.value));
  urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addUrl(urlInput.value);
    }
  });

  refreshUrlsButton.addEventListener('click', () => {
    refreshSubscriptions('Refreshing source lists...');
    scheduleResize();
  });

  function setActivePanel(panelId) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.panel === panelId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    [namesPanel, sourcesPanel].forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  function setBulkComposer(isExpanded) {
    bulkComposer.hidden = !isExpanded;
    document.body.classList.toggle('is-bulk-open', isExpanded);
    bulkToggleButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    bulkToggleButton.textContent = isExpanded ? 'Hide bulk paste' : 'Paste multiple names';
  }

  function loadNames() {
    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = result.namesToMark || [];
      nameList.innerHTML = '';
      itemCount.textContent = String(names.length);

      if (names.length === 0) {
        nameList.appendChild(createEmptyState('No tracked names yet.'));
        scheduleResize();
        return;
      }

      names.forEach((name) => {
        nameList.appendChild(createListItem(name, 40, () => {
          removeName(name);
          scheduleResize();
        }));
      });

      scheduleResize();
    });
  }

  function addName(inputValue) {
    const name = inputValue.trim();
    if (!name) {
      return;
    }

    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = result.namesToMark || [];
      if (!names.includes(name)) {
        names.push(name);
        chrome.storage.local.set({ namesToMark: names }, () => {
          nameInput.value = '';
          loadNames();
        });
        return;
      }

      nameInput.value = '';
    });
  }

  function removeName(nameToRemove) {
    chrome.storage.local.get({ namesToMark: [] }, (result) => {
      const names = (result.namesToMark || []).filter((name) => name !== nameToRemove);
      chrome.storage.local.set({ namesToMark: names }, () => {
        loadNames();
      });
    });
  }

  function loadUrls() {
    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      const urls = result.subscriptionUrls || [];
      urlList.innerHTML = '';
      urlCount.textContent = String(urls.length);

      if (urls.length === 0) {
        urlList.appendChild(createEmptyState('No subscription sources configured.'));
        scheduleResize();
        return;
      }

      urls.forEach((url) => {
        urlList.appendChild(createListItem(url, 44, () => {
          removeUrl(url);
          scheduleResize();
        }));
      });

      scheduleResize();
    });
  }

  function addUrl(inputValue) {
    const url = inputValue.trim();
    if (!url) {
      return;
    }

    setActivePanel('sourcesPanel');
    hideWarning();

    try {
      new URL(url);
    } catch (_) {
      showWarning('Enter a valid direct URL to a raw text file.');
      scheduleResize();
      return;
    }

    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      const urls = result.subscriptionUrls || [];

      if (urls.includes(url)) {
        urlInput.value = '';
        showWarning('That subscription source is already added.');
        scheduleResize();
        return;
      }

      urls.push(url);
      chrome.storage.local.set({ subscriptionUrls: urls }, () => {
        urlInput.value = '';
        loadUrls();
        refreshSubscriptions('Refreshing source lists...');
      });
    });
  }

  function removeUrl(urlToRemove) {
    chrome.storage.local.get({ subscriptionUrls: [] }, (result) => {
      const urls = (result.subscriptionUrls || []).filter((url) => url !== urlToRemove);
      chrome.storage.local.set({ subscriptionUrls: urls }, () => {
        loadUrls();
        refreshSubscriptions('Refreshing source lists...');
      });
    });
  }

  function loadColors() {
    chrome.storage.local.get({ bgColor: '#ffff00', textColor: '#ff0000', bgOpacity: 100 }, (result) => {
      bgColorInput.value = result.bgColor;
      textColorInput.value = result.textColor;
      bgOpacityInput.value = result.bgOpacity;
      updateAppearanceLabels();
    });
  }

  function updateAppearanceLabels() {
    bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
    bgColorValue.textContent = formatColorValue(bgColorInput.value);
    textColorValue.textContent = formatColorValue(textColorInput.value);
    bgColorSwatch.style.backgroundColor = bgColorInput.value;
    textColorSwatch.style.backgroundColor = textColorInput.value;
  }

  function saveColors() {
    chrome.storage.local.set({
      bgColor: bgColorInput.value,
      textColor: textColorInput.value,
      bgOpacity: parseInt(bgOpacityInput.value, 10)
    });
  }

  function loadFetchStatus() {
    chrome.storage.local.get({ fetchStatus: null }, (result) => {
      if (result.fetchStatus) {
        if (result.fetchStatus.status === 'warning' || result.fetchStatus.status === 'error') {
          setActivePanel('sourcesPanel');
        }
        displayFetchResult(result.fetchStatus);
        scheduleResize();
        return;
      }
    });
  }

  function refreshSubscriptions(message) {
    showStatus(message, 'status-info');
    hideWarning();

    chrome.runtime.sendMessage({ action: 'fetchUrls' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Could not reach the background service. Reload the extension and try again.', 'status-error');
        scheduleResize();
        return;
      }

      displayFetchResult(response);
      scheduleResize();
    });
  }

  function displayFetchResult(result) {
    if (!result) {
      return;
    }

    const timestamp = formatTimestamp(result.timestamp);
    const timeSuffix = timestamp ? ` Last updated ${timestamp}.` : '';

    if (result.status === 'ok') {
      showStatus(`Synced ${result.totalItems} items.${timeSuffix}`, 'status-success');
      hideWarning();
      scheduleResize();
      return;
    }

    if (result.status === 'warning') {
      showStatus(`Loaded ${result.totalItems} items with warnings.${timeSuffix}`, 'status-warning');
      showWarning(joinErrors(result.errors));
      scheduleResize();
      return;
    }

    if (result.status === 'error') {
      showStatus(`Source sync failed.${timeSuffix}`, 'status-error');
      showWarning(joinErrors(result.errors) || result.error || 'Unable to fetch subscription sources.');
      scheduleResize();
    }
  }

  function showStatus(message, tone) {
    fetchStatusBar.hidden = false;
    fetchStatusBar.textContent = message;
    fetchStatusBar.className = `status-bar ${tone}`;
    scheduleResize();
  }

  function showWarning(message) {
    if (!message) {
      hideWarning();
      scheduleResize();
      return;
    }

    fetchWarning.hidden = false;
    fetchWarning.textContent = message;
    fetchWarning.className = 'status-bar status-warning';
    scheduleResize();
  }

  function hideWarning() {
    fetchWarning.hidden = true;
    fetchWarning.textContent = '';
    scheduleResize();
  }

  function createListItem(value, maxLength, removeHandler) {
    const item = document.createElement('li');

    const textSpan = document.createElement('span');
    textSpan.className = 'item-text';
    textSpan.textContent = truncateValue(value, maxLength);
    textSpan.title = value;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-btn';
    removeButton.textContent = 'x';
    removeButton.title = 'Remove';
    removeButton.setAttribute('aria-label', `Remove ${value}`);
    removeButton.addEventListener('click', () => {
      removeHandler();
      scheduleResize();
    });

    item.appendChild(textSpan);
    item.appendChild(removeButton);
    return item;
  }

  function createEmptyState(message) {
    const item = document.createElement('li');
    item.className = 'empty-state';
    item.textContent = message;
    return item;
  }

  function truncateValue(value, maxLength) {
    return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
  }

  function joinErrors(errors) {
    return Array.isArray(errors) ? errors.filter(Boolean).join('\n') : '';
  }

  function formatColorValue(value) {
    return value.toUpperCase();
  }

  function formatTimestamp(value) {
    if (!value) {
      return '';
    }

    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(timestamp);
  }
});
