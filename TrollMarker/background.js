const DEFAULT_URL = 'https://gist.githubusercontent.com/bulyaki/bc3c9e7bff2265a1c8b265b226697b9f/raw/1bdb1e670efe0ff8fca3d74494ae6818c02cc461/facebook_names_and_links.txt';
const ALARM_NAME = 'fetchUrlsAlarm';
const FETCH_INTERVAL_MINUTES = 60;

// Initialize default URL on first install
chrome.runtime.onInstalled.addListener(async () => {
    try {
        const result = await chrome.storage.local.get({ subscriptionUrls: null });
        if (result.subscriptionUrls === null) {
            await chrome.storage.local.set({ subscriptionUrls: [DEFAULT_URL] });
        }
    } catch (e) {
        console.error('Error in onInstalled:', e);
    }

    // Create alarm for periodic background fetching
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: FETCH_INTERVAL_MINUTES
    });

    // Run initial fetch
    await fetchAllUrls();
});

// Also fetch on browser startup (onInstalled only fires once)
chrome.runtime.onStartup.addListener(async () => {
    // Re-create alarm in case it was cleared
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: FETCH_INTERVAL_MINUTES
    });
    await fetchAllUrls();
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
        await fetchAllUrls();
    }
});

// Listen for manual trigger from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrls') {
        fetchAllUrls().then(result => {
            sendResponse(result);
        }).catch(e => {
            sendResponse({ status: 'error', error: e.message });
        });
        return true; // keep message channel open for async response
    }
    if (request.action === 'getFetchStatus') {
        chrome.storage.local.get({ fetchStatus: null }, (result) => {
            sendResponse(result.fetchStatus || { status: 'unknown' });
        });
        return true;
    }
});

async function fetchAllUrls() {
    console.log('Fetching remote URL lists...');
    const fetchResults = { status: 'ok', urls: [], errors: [], totalItems: 0, timestamp: Date.now() };

    try {
        const result = await chrome.storage.local.get({ subscriptionUrls: [] });
        const urls = result.subscriptionUrls || [];

        if (urls.length === 0) {
            fetchResults.status = 'warning';
            fetchResults.errors.push('No subscription URLs configured.');
            await chrome.storage.local.set({ fetchStatus: fetchResults, downloadedNamesToMark: [] });
            return fetchResults;
        }

        let allItems = new Set();

        for (const url of urls) {
            const urlResult = { url: url, status: 'ok', itemCount: 0 };
            try {
                // Cache busting for Safari
                const urlWithBuster = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                const response = await fetch(urlWithBuster, { cache: 'no-store' });

                if (!response.ok && response.status !== 0) {
                    urlResult.status = 'error';
                    urlResult.error = `HTTP ${response.status} ${response.statusText}`;
                    fetchResults.errors.push(`${url}: HTTP ${response.status}`);
                    fetchResults.urls.push(urlResult);
                    continue;
                }

                let text = await response.text();

                if (!text || text.trim().length === 0) {
                    urlResult.status = 'warning';
                    urlResult.error = 'Empty response';
                    fetchResults.errors.push(`${url}: Empty response received`);
                    fetchResults.urls.push(urlResult);
                    continue;
                }

                // If the response looks like HTML, reject it — HTML pages produce garbage
                const trimmedText = text.trim().toLowerCase();
                if (trimmedText.startsWith('<!doctype html') || trimmedText.startsWith('<html')) {
                    urlResult.status = 'error';
                    urlResult.error = 'URL returned an HTML page, not a text file. Please use a raw/direct download link instead.';
                    fetchResults.errors.push(`${url}: Returned HTML page instead of text file`);
                    fetchResults.urls.push(urlResult);
                    continue;
                }

                // Parse plain text: split by newlines and tabs, keep all valid entries
                const lines = text.split(/[\n\r\t]+/).map(item => item.trim()).filter(item => item);

                let validCount = 0;
                for (const line of lines) {
                    allItems.add(line);
                    validCount++;
                }

                urlResult.itemCount = validCount;
                if (validCount === 0) {
                    urlResult.status = 'warning';
                    urlResult.error = 'No valid names/links found in file';
                    fetchResults.errors.push(`${url}: No valid names/links found`);
                }
            } catch (error) {
                urlResult.status = 'error';
                urlResult.error = error.message;
                fetchResults.errors.push(`${url}: ${error.message}`);
                console.error(`Error fetching or parsing ${url}:`, error);
            }
            fetchResults.urls.push(urlResult);
        }

        fetchResults.totalItems = allItems.size;
        if (fetchResults.errors.length > 0 && allItems.size === 0) {
            fetchResults.status = 'error';
        } else if (fetchResults.errors.length > 0) {
            fetchResults.status = 'warning';
        }

        // Save to storage
        await chrome.storage.local.set({ downloadedNamesToMark: Array.from(allItems), fetchStatus: fetchResults });
        console.log(`Successfully fetched and saved ${allItems.size} downloaded items.`);
        return fetchResults;
    } catch (e) {
        console.error('Error in fetchAllUrls:', e);
        fetchResults.status = 'error';
        fetchResults.errors.push(e.message);
        await chrome.storage.local.set({ fetchStatus: fetchResults });
        return fetchResults;
    }
}
