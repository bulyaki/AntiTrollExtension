let namesToMark = [];     // standalone names (manually added, no URL pair)
let exactNamesToMark = []; // names from file pairs (only exact match)
let linksToMark = [];

function updateLists(rawList) {
    namesToMark = [];
    exactNamesToMark = [];
    linksToMark = [];
    rawList.forEach(item => {
        // Check if it's a tab-separated "Name\tURL" pair from a file
        if (item.includes('\t')) {
            const parts = item.split('\t');
            const url = parts.slice(1).join('\t').trim();
            if (url && (url.includes('facebook.com') || url.startsWith('http'))) {
                linksToMark.push(url);
            }
            // Names from file pairs are NOT used for matching — only URLs matter
        } else if (item.includes('facebook.com') || item.startsWith('http')) {
            linksToMark.push(item);
        } else {
            // Standalone names (manually added) — used for substring matching
            namesToMark.push(item);
        }
    });
    // Sort names to match longest first
    namesToMark.sort((a, b) => b.length - a.length);
    exactNamesToMark.sort((a, b) => b.length - a.length);
}

// Load names from storage
function loadNames(callback) {
    chrome.storage.local.get({ namesToMark: [], downloadedNamesToMark: [], bgColor: '#ffff00', textColor: '#ff0000' }, (result) => {
        applyCustomStyles(result.bgColor, result.textColor);
        const combined = [...result.namesToMark, ...result.downloadedNamesToMark];
        updateLists(combined);
        if (callback) callback();
    });
}

// Listen for updates from settings or background polling
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.bgColor || changes.textColor) {
            chrome.storage.local.get({ bgColor: '#ffff00', textColor: '#ff0000' }, (result) => {
                applyCustomStyles(result.bgColor, result.textColor);
            });
        }

        if (changes.namesToMark || changes.downloadedNamesToMark) {
            chrome.storage.local.get({ namesToMark: [], downloadedNamesToMark: [] }, (result) => {
                const combined = [...result.namesToMark, ...result.downloadedNamesToMark];
                updateLists(combined);
                // Re-scan entire body when names are updated
                processNode(document.body);
            });
        }
    }
});

function applyCustomStyles(bgColor, textColor) {
    let styleEl = document.getElementById('fb-name-marker-custom-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'fb-name-marker-custom-styles';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
        .fb-name-marker-highlight {
            background-color: ${bgColor} !important;
            color: ${textColor} !important;
        }
    `;
}

function processElementNode(el) {
    if (linksToMark.length === 0 && namesToMark.length === 0) return;

    // Ignore header / nav elements
    if (el.closest && (el.closest('header') || el.closest('[role="banner"]') || el.closest('[role="navigation"]'))) return;

    // Check if it's an anchor tag
    if (el.tagName === 'A' && el.href) {
        if (el.classList.contains('fb-name-marker-highlight')) return;

        let href = el.href;
        // Basic match: if the stored link URL is found inside the actual href
        // We strip the trailing slash for better matching
        for (let link of linksToMark) {
            let cleanLink = link.replace(/\/$/, '');
            let cleanHref = href.replace(/\/$/, '');
            if (cleanHref.includes(cleanLink) || cleanLink.includes(cleanHref)) {
                el.classList.add('fb-name-marker-highlight');
                // Also highlight all child elements so the displayed name text is visually marked
                el.querySelectorAll('*').forEach(child => {
                    child.classList.add('fb-name-marker-highlight');
                });
                break;
            }
        }
    }
}

// Function to process a given text node
function processTextNode(textNode) {
    if (linksToMark.length === 0 && namesToMark.length === 0 && exactNamesToMark.length === 0) return;
    const parent = textNode.parentNode;

    // Prevent re-processing already marked nodes
    if (parent && parent.classList && parent.classList.contains('fb-name-marker-highlight')) {
        return;
    }

    // Don't process script or style tags
    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT')) {
        return;
    }

    // Ignore header / nav elements
    if (parent && parent.closest && (parent.closest('header') || parent.closest('[role="banner"]') || parent.closest('[role="navigation"]'))) {
        return;
    }

    let content = textNode.nodeValue;
    if (!content || !content.trim()) return;
    const trimmed = content.trim();

    // 1. Exact name matching (names from file pairs — high precision)
    for (const name of exactNamesToMark) {
        if (trimmed === name) {
            if (parent) {
                parent.classList.add('fb-name-marker-highlight');
            }
            return;
        }
    }

    // 2. Substring matching (standalone manually-added names only)
    if (namesToMark.length === 0) return;

    let matchFound = false;
    for (const name of namesToMark) {
        if (content.includes(name)) {
            matchFound = true;
            break;
        }
    }

    if (!matchFound) return;

    for (const name of namesToMark) {
        if (trimmed === name) {
            if (parent) {
                parent.classList.add('fb-name-marker-highlight');
            }
            return;
        }
    }

    // Check if parent is an inline element (span, a, strong, b, em)
    const inlineTags = ['SPAN', 'A', 'STRONG', 'B', 'EM'];
    if (inlineTags.includes(parent.tagName)) {
        for (const name of namesToMark) {
            if (content.includes(name)) {
                parent.classList.add('fb-name-marker-highlight');
                break;
            }
        }
    }
}

// Traverse the DOM
function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        processElementNode(node);
        for (let child of node.childNodes) {
            processNode(child);
        }
    }
}

// Watch for DOM mutations
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                processNode(node);
            });
        } else if (mutation.type === 'characterData') {
            processTextNode(mutation.target);
        }
    }
});

// Init
loadNames(() => {
    processNode(document.body);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
});
