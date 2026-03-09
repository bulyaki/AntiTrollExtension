document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('nameInput');
  const addButton = document.getElementById('addButton');
  const nameList = document.getElementById('nameList');
  
  const bulkInput = document.getElementById('bulkInput');
  const bulkAddButton = document.getElementById('bulkAddButton');
  const clearAllButton = document.getElementById('clearAllButton');
  const itemCount = document.getElementById('itemCount');

  // Load existing names
  loadNames();

  addButton.addEventListener('click', () => addName(nameInput.value));
  
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addName(nameInput.value);
    }
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
    if (confirm('Are you sure you want to remove all saved items?')) {
      chrome.storage.local.set({ namesToMark: [] }, () => {
        loadNames();
      });
    }
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
});
