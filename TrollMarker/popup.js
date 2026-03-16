document.addEventListener('DOMContentLoaded', async () => {
  const POPUP_MARGIN = 10;
  const POPUP_SAFE_MIN_HEIGHT = 320;
  let heightAlignFrame = 0;

  const appShell = document.querySelector('.app-shell');
  const namesPanel = document.getElementById('namesPanel');
  const sourcesPanel = document.getElementById('sourcesPanel');
  const namesTabButton = document.getElementById('namesTabButton');
  const sourcesTabButton = document.getElementById('sourcesTabButton');

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
  const bgColorButton = document.getElementById('bgColorButton');
  const bgColorDot = document.getElementById('bgColorDot');
  const textColorInput = document.getElementById('textColorInput');
  const textColorButton = document.getElementById('textColorButton');
  const textColorDot = document.getElementById('textColorDot');
  const bgOpacityInput = document.getElementById('bgOpacityInput');
  const bgOpacityValue = document.getElementById('bgOpacityValue');
  const bgColorValue = document.getElementById('bgColorValue');
  const textColorValue = document.getElementById('textColorValue');

  const fetchStatusBar = document.getElementById('fetchStatusBar');
  const fetchWarning = document.getElementById('fetchWarning');

  const measureRoot = document.createElement('div');
  measureRoot.className = 'popup-measure-root';
  document.body.appendChild(measureRoot);

  const state = {
    activePanel: 'namesPanel',
    bulkExpanded: false,
    names: [],
    urls: [],
    fetchBar: {
      hidden: true,
      tone: 'status-info',
      text: ''
    },
    fetchWarning: ''
  };

  bindEvents();
  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await initializeState();
  } catch (error) {
    console.error('Popup initialization failed:', error);
    updateAppearanceLabels();
  }
  runTwoPassLayout();
  document.body.classList.add('popup-ready');

  function bindEvents() {
    namesTabButton.addEventListener('click', () => {
      state.activePanel = 'namesPanel';
      runTwoPassLayout();
    });

    sourcesTabButton.addEventListener('click', () => {
      state.activePanel = 'sourcesPanel';
      runTwoPassLayout();
    });

    bulkToggleButton.addEventListener('click', () => {
      state.bulkExpanded = !state.bulkExpanded;
      runTwoPassLayout();
    });

    bgColorButton.addEventListener('click', (event) => {
      openAnchoredColorPicker(bgColorInput, bgColorButton, event);
    });

    textColorButton.addEventListener('click', (event) => {
      openAnchoredColorPicker(textColorInput, textColorButton, event);
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

    addButton.addEventListener('click', async () => {
      await addName(nameInput.value);
    });

    nameInput.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await addName(nameInput.value);
      }
    });

    bulkAddButton.addEventListener('click', async () => {
      const rawItems = bulkInput.value.split(/[\n\r\t]+/);
      const newItems = rawItems.map((item) => item.trim()).filter(Boolean);

      if (newItems.length === 0) {
        return;
      }

      const merged = new Set(state.names);
      newItems.forEach((item) => merged.add(item));
      state.names = Array.from(merged);
      state.bulkExpanded = false;

      await storageSet({ namesToMark: state.names });
      bulkInput.value = '';
      runTwoPassLayout();
    });

    clearAllButton.addEventListener('click', async () => {
      state.names = [];
      await storageSet({ namesToMark: [] });
      runTwoPassLayout();
    });

    addUrlButton.addEventListener('click', async () => {
      await addUrl(urlInput.value);
    });

    urlInput.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await addUrl(urlInput.value);
      }
    });

    refreshUrlsButton.addEventListener('click', async () => {
      await refreshSubscriptions('Refreshing source lists...');
    });
  }

  async function initializeState() {
    const [namesResult, urlsResult, colorsResult, fetchResult] = await Promise.all([
      storageGet({ namesToMark: [] }),
      storageGet({ subscriptionUrls: [] }),
      storageGet({ bgColor: '#ffff00', textColor: '#ff0000', bgOpacity: 100 }),
      storageGet({ fetchStatus: null })
    ]);

    state.names = namesResult.namesToMark || [];
    state.urls = urlsResult.subscriptionUrls || [];

    bgColorInput.value = colorsResult.bgColor;
    textColorInput.value = colorsResult.textColor;
    bgOpacityInput.value = colorsResult.bgOpacity;
    updateAppearanceLabels();

    if (fetchResult.fetchStatus) {
      applyFetchResult(fetchResult.fetchStatus);
    }
  }

  async function addName(inputValue) {
    const name = inputValue.trim();
    if (!name) {
      return;
    }

    if (!state.names.includes(name)) {
      state.names = [...state.names, name];
      await storageSet({ namesToMark: state.names });
    }

    nameInput.value = '';
    runTwoPassLayout();
  }

  async function removeName(nameToRemove) {
    state.names = state.names.filter((name) => name !== nameToRemove);
    await storageSet({ namesToMark: state.names });
    runTwoPassLayout();
  }

  async function addUrl(inputValue) {
    const url = inputValue.trim();
    if (!url) {
      return;
    }

    state.activePanel = 'sourcesPanel';
    state.fetchWarning = '';

    try {
      new URL(url);
    } catch (_) {
      state.fetchWarning = 'Enter a valid direct URL to a raw text file.';
      runTwoPassLayout();
      return;
    }

    if (state.urls.includes(url)) {
      urlInput.value = '';
      state.fetchWarning = 'That subscription source is already added.';
      runTwoPassLayout();
      return;
    }

    state.urls = [...state.urls, url];
    await storageSet({ subscriptionUrls: state.urls });
    urlInput.value = '';
    runTwoPassLayout();
    await refreshSubscriptions('Refreshing source lists...');
  }

  async function removeUrl(urlToRemove) {
    state.urls = state.urls.filter((url) => url !== urlToRemove);
    await storageSet({ subscriptionUrls: state.urls });
    runTwoPassLayout();
    await refreshSubscriptions('Refreshing source lists...');
  }

  function updateAppearanceLabels() {
    bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
    bgColorValue.textContent = formatColorValue(bgColorInput.value);
    textColorValue.textContent = formatColorValue(textColorInput.value);
    bgColorDot.style.backgroundColor = bgColorInput.value;
    textColorDot.style.backgroundColor = textColorInput.value;
  }

  function saveColors() {
    storageSet({
      bgColor: bgColorInput.value,
      textColor: textColorInput.value,
      bgOpacity: parseInt(bgOpacityInput.value, 10)
    });
  }

  async function refreshSubscriptions(message) {
    state.fetchBar = {
      hidden: false,
      tone: 'status-info',
      text: message
    };
    state.fetchWarning = '';
    runTwoPassLayout();

    const response = await sendRuntimeMessage({ action: 'fetchUrls' });
    if (response.runtimeError) {
      state.fetchBar = {
        hidden: false,
        tone: 'status-error',
        text: 'Could not reach the background service. Reload the extension and try again.'
      };
      runTwoPassLayout();
      return;
    }

    applyFetchResult(response.payload);
    runTwoPassLayout();
  }

  function applyFetchResult(result) {
    if (!result) {
      return;
    }

    const timestamp = formatTimestamp(result.timestamp);
    const timeSuffix = timestamp ? ` Last updated ${timestamp}.` : '';

    if (result.status === 'ok') {
      state.fetchBar = {
        hidden: false,
        tone: 'status-success',
        text: `Synced ${result.totalItems} items.${timeSuffix}`
      };
      state.fetchWarning = '';
      return;
    }

    if (result.status === 'warning') {
      state.activePanel = 'sourcesPanel';
      state.fetchBar = {
        hidden: false,
        tone: 'status-warning',
        text: `Loaded ${result.totalItems} items with warnings.${timeSuffix}`
      };
      state.fetchWarning = joinErrors(result.errors);
      return;
    }

    if (result.status === 'error') {
      state.activePanel = 'sourcesPanel';
      state.fetchBar = {
        hidden: false,
        tone: 'status-error',
        text: `Source sync failed.${timeSuffix}`
      };
      state.fetchWarning = joinErrors(result.errors) || result.error || 'Unable to fetch subscription sources.';
    }
  }

  function runTwoPassLayout() {
    // Critical: keep this deterministic two-pass sizing.
    // It is shared by Chromium popup and Safari/Xcode wrapper and must not use browser-window resize APIs.
    const firstPassSize = calculatePopupSize(state);
    applyPopupSize(firstPassSize);
    renderFromState();
    const secondPassSize = calculatePopupSize(state);
    applyPopupSize(secondPassSize);
  }

  function renderFromState() {
    renderTabsAndPanels(appShell, state.activePanel);
    renderBulkComposer(appShell, state.bulkExpanded);
    renderNamesList(nameList, state.names);
    renderUrlsList(urlList, state.urls);
    itemCount.textContent = String(state.names.length);
    urlCount.textContent = String(state.urls.length);
    renderFetchBars(appShell, state.fetchBar, state.fetchWarning);
  }

  function calculatePopupSize(nextState) {
    const probe = appShell.cloneNode(true);
    renderTabsAndPanels(probe, nextState.activePanel);
    renderBulkComposer(probe, nextState.bulkExpanded);
    renderNamesList(probe.querySelector('#nameList'), nextState.names);
    renderUrlsList(probe.querySelector('#urlList'), nextState.urls);
    probe.querySelector('#itemCount').textContent = String(nextState.names.length);
    probe.querySelector('#urlCount').textContent = String(nextState.urls.length);
    renderFetchBars(probe, nextState.fetchBar, nextState.fetchWarning);
    stripProbeIds(probe);

    measureRoot.replaceChildren(probe);
    const measuredWidth = Math.ceil(probe.getBoundingClientRect().width + POPUP_MARGIN * 2);
    const measuredHeight = Math.ceil(probe.getBoundingClientRect().height + POPUP_MARGIN * 2);
    measureRoot.replaceChildren();

    return { width: measuredWidth, height: measuredHeight };
  }

  function renderTabsAndPanels(root, activePanelId) {
    const localNamesPanel = root.querySelector('#namesPanel');
    const localSourcesPanel = root.querySelector('#sourcesPanel');
    const localNamesButton = root.querySelector('#namesTabButton');
    const localSourcesButton = root.querySelector('#sourcesTabButton');

    setTabState(localNamesButton, activePanelId === 'namesPanel');
    setTabState(localSourcesButton, activePanelId === 'sourcesPanel');

    setPanelState(localNamesPanel, activePanelId === 'namesPanel');
    setPanelState(localSourcesPanel, activePanelId === 'sourcesPanel');
  }

  function renderBulkComposer(root, isExpanded) {
    const localBulkComposer = root.querySelector('#bulkComposer');
    const localBulkToggle = root.querySelector('#bulkToggleButton');
    localBulkComposer.hidden = !isExpanded;
    localBulkToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    localBulkToggle.textContent = isExpanded ? 'Hide bulk paste' : 'Paste multiple names';
  }

  function renderNamesList(targetList, names) {
    targetList.innerHTML = '';

    if (names.length === 0) {
      targetList.appendChild(createEmptyState('No tracked names yet.'));
      return;
    }

    names.forEach((name) => {
      targetList.appendChild(createListItem(name, 40, async () => {
        await removeName(name);
      }));
    });
  }

  function renderUrlsList(targetList, urls) {
    targetList.innerHTML = '';

    if (urls.length === 0) {
      targetList.appendChild(createEmptyState('No subscription sources configured.'));
      return;
    }

    urls.forEach((url) => {
      targetList.appendChild(createListItem(url, 44, async () => {
        await removeUrl(url);
      }));
    });
  }

  function renderFetchBars(root, fetchBarState, fetchWarningText) {
    const localFetchStatusBar = root.querySelector('#fetchStatusBar');
    const localFetchWarning = root.querySelector('#fetchWarning');

    if (fetchBarState.hidden) {
      localFetchStatusBar.hidden = true;
      localFetchStatusBar.textContent = '';
      localFetchStatusBar.className = 'status-bar';
    } else {
      localFetchStatusBar.hidden = false;
      localFetchStatusBar.textContent = fetchBarState.text;
      localFetchStatusBar.className = `status-bar ${fetchBarState.tone}`;
    }

    if (fetchWarningText) {
      localFetchWarning.hidden = false;
      localFetchWarning.textContent = fetchWarningText;
      localFetchWarning.className = 'status-bar status-warning';
    } else {
      localFetchWarning.hidden = true;
      localFetchWarning.textContent = '';
      localFetchWarning.className = 'status-bar status-warning';
    }
  }

  function applyPopupSize(size) {
    const width = `${size.width}px`;
    const requestedHeight = Math.max(size.height, POPUP_SAFE_MIN_HEIGHT);
    const height = `${requestedHeight}px`;

    document.documentElement.style.width = width;
    document.documentElement.style.height = height;
    document.documentElement.style.overflow = 'hidden';

    document.body.style.width = '100%';
    document.body.style.height = height;

    cancelAnimationFrame(heightAlignFrame);
    heightAlignFrame = requestAnimationFrame(() => {
      const actualViewportHeight = window.visualViewport
        ? Math.floor(window.visualViewport.height)
        : Math.floor(window.innerHeight || requestedHeight);

      if (actualViewportHeight > 0 && actualViewportHeight + 1 < requestedHeight) {
        const cappedHeight = `${actualViewportHeight}px`;
        document.documentElement.style.height = cappedHeight;
        document.body.style.height = cappedHeight;
        document.body.classList.add('popup-capped');
        return;
      }

      document.body.classList.remove('popup-capped');
    });
  }

  function openAnchoredColorPicker(input, trigger, clickEvent) {
    const triggerRect = trigger.getBoundingClientRect();
    const hasPointerLocation = Number.isFinite(clickEvent?.clientX)
      && Number.isFinite(clickEvent?.clientY)
      && (clickEvent.clientX !== 0 || clickEvent.clientY !== 0);

    const anchorCenterX = hasPointerLocation
      ? clickEvent.clientX
      : (triggerRect.left + (triggerRect.width / 2));
    const anchorTop = hasPointerLocation
      ? (clickEvent.clientY + 8)
      : (triggerRect.bottom + 6);
    const anchorSize = 24;

    input.style.left = `${Math.round(anchorCenterX - (anchorSize / 2))}px`;
    input.style.top = `${anchorTop}px`;
    input.style.width = `${anchorSize}px`;
    input.style.height = `${anchorSize}px`;

    // Force layout so the picker reads the latest anchor coordinates.
    input.getBoundingClientRect();

    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch (_) {
        // Fall through to click() on engines where showPicker exists but is blocked.
      }
    }

    input.click();
  }

  function stripProbeIds(probe) {
    probe.querySelectorAll('[id]').forEach((element) => {
      element.removeAttribute('id');
    });
  }

  function setTabState(button, isActive) {
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }

  function setPanelState(panel, isActive) {
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
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
    if (typeof removeHandler === 'function') {
      removeButton.addEventListener('click', removeHandler);
    }

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

  function storageGet(defaultValues) {
    return new Promise((resolve) => {
      chrome.storage.local.get(defaultValues, resolve);
    });
  }

  function storageSet(values) {
    return new Promise((resolve) => {
      chrome.storage.local.set(values, resolve);
    });
  }

  function sendRuntimeMessage(payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        resolve({
          payload: response,
          runtimeError: chrome.runtime.lastError
        });
      });
    });
  }
});
