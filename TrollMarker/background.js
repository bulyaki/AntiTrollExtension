const DEFAULT_URL = 'https://gist.githubusercontent.com/bulyaki/bc3c9e7bff2265a1c8b265b226697b9f/raw/1bdb1e670efe0ff8fca3d74494ae6818c02cc461/facebook_names_and_links.txt';
const ALARM_NAME = 'fetchUrlsAlarm';
const FETCH_INTERVAL_MINUTES = 60;

// Initialize default URL if none exist
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get({ subscriptionUrls: null }, (result) => {
        if (result.subscriptionUrls === null) {
            chrome.storage.local.set({ subscriptionUrls: [DEFAULT_URL] }, () => {
                fetchAllUrls();
            });
        } else {
            fetchAllUrls();
        }
    });

    // Create alarm for periodic background fetching
    chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: FETCH_INTERVAL_MINUTES
    });
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        fetchAllUrls();
    }
});

// Listen for manual trigger from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchUrls') {
        fetchAllUrls();
        sendResponse({ status: 'started' });
    }
    return true;
});

async function fetchAllUrls() {
    console.log('Fetching remote URL lists...');

    // Get the configured URLs
    chrome.storage.local.get({ subscriptionUrls: [] }, async (result) => {
        const urls = result.subscriptionUrls;

        let allItems = new Set();

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                    continue;
                }

                const text = await response.text();

                // Parse lines, filter out empty ones
                const lines = text.split(/[\n\r]+/).map(item => item.trim()).filter(item => item);
                for (const line of lines) {
                    allItems.add(line);
                }
            } catch (error) {
                console.error(`Error fetching or parsing ${url}:`, error);
            }
        }

        // Save to storage
        chrome.storage.local.set({ downloadedNamesToMark: Array.from(allItems) }, () => {
            console.log(`Successfully fetched and saved ${allItems.size} downloaded items.`);
        });
    });
}
