let namesToMark = [];
let linksToMark = [];

function updateLists(rawList) {
    namesToMark = [];
    linksToMark = [];
    rawList.forEach(item => {
        // If it starts with http or contains facebook.com, treat as a URL.
        if (item.includes('facebook.com') || item.startsWith('http')) {
            linksToMark.push(item);
        } else {
            namesToMark.push(item);
        }
    });
    // Sort names to match longest first
    namesToMark.sort((a, b) => b.length - a.length);
}

// Load names from storage
function loadNames(callback) {
    chrome.storage.local.get({ namesToMark: [] }, (result) => {
        updateLists(result.namesToMark);
        if (callback) callback();
    });
}

// Listen for updates from settings
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.namesToMark) {
        updateLists(changes.namesToMark.newValue);
        // Re-scan entire body when names are updated
        processNode(document.body);
    }
});

function processElementNode(el) {
    if (linksToMark.length === 0) return;

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
                break;
            }
        }
    }
}

// Function to process a given text node
function processTextNode(textNode) {
    if (namesToMark.length === 0) return;
    const parent = textNode.parentNode;

    // Prevent re-processing already marked nodes
    if (parent && parent.classList && parent.classList.contains('fb-name-marker-highlight')) {
        return;
    }

    // Don't process script or style tags
    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT')) {
        return;
    }

    // Check if any tracked name is in the text
    let content = textNode.nodeValue;
    if (!content || !content.trim()) return;

    let matchFound = false;
    for (const name of namesToMark) {
        if (content.includes(name)) {
            matchFound = true;
            break;
        }
    }

    if (!matchFound) return;

    for (const name of namesToMark) {
        // If the text node is exactly the name, or very close (with some whitespace)
        if (content.trim() === name) {
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
