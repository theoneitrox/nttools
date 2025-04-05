// ======================
// PAGE NAVIGATION SYSTEM
// ======================

// Initialize page navigation
function initNavigation() {
    // Handle nav link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    // Handle tool button clicks
    document.querySelectorAll('.tool-card .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            switchPage(pageId);
        });
    });

    // Switch to initial page if hash exists
    if (window.location.hash) {
        const pageId = window.location.hash.substring(1);
        if (document.getElementById(pageId)) {
            switchPage(pageId);
        }
    }
}

// Switch between pages
function switchPage(pageId) {
    console.log(`Switching to page: ${pageId}`);

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(navLink => {
        navLink.classList.remove('active');
        if (navLink.getAttribute('data-page') === pageId) {
            navLink.classList.add('active');
        }
    });

    // Update active page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');

    // Load content for specific pages
    if (pageId === 'available-tags') {
        loadTeamTags();
    }

    // Update URL hash
    window.location.hash = pageId;
}

// ======================
// ACCOUNT GENERATOR SYSTEM
// ======================

// Initialize account generator
function initAccountGenerator() {
    document.getElementById('generateBtn').addEventListener('click', generateAccounts);
}

// Generate random string
function generateRandomString(length, includeSymbols = true) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const symbols = '!@#$%^&*';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        if (includeSymbols && i === length - 1) {
            result += symbols.charAt(Math.floor(Math.random() * symbols.length));
        } else {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return result;
}

// Validate inputs
function validateBaseInputs(baseUsername, basePassword) {
    if (baseUsername && baseUsername.length > 15) {
        alert("Base username too long! Maximum 15 characters.");
        return false;
    }
    if (basePassword && basePassword.length > 10) {
        alert("Base password too long! Maximum 10 characters.");
        return false;
    }
    return true;
}

// Generate username
function generateUsername(base, index) {
    if (!base) return generateRandomString(6 + Math.floor(Math.random() * 7), false);
    
    const suffix = `_${index}`;
    const maxBaseLength = 20 - suffix.length;
    const finalUsername = `${base.slice(0, maxBaseLength)}${suffix}`;
    
    if (finalUsername.length > 20) {
        console.warn(`Generated username too long: ${finalUsername}`);
        return generateRandomString(10, false);
    }
    return finalUsername;
}

// Generate password
function generatePassword(base) {
    if (!base) return generateRandomString(8 + Math.floor(Math.random() * 5));
    
    const availableLength = 20 - base.length;
    if (availableLength <= 0) {
        console.warn("Password base too long! Falling back to random password.");
        return generateRandomString(10);
    }
    const suffix = generateRandomString(availableLength);
    return `${base}${suffix}`;
}

// Create account via API
async function createAccount(username, password, wpm) {
    const url = 'https://www.nitrotype.com/api/v2/auth/register/username';
    const data = {
        "acceptPolicy": "on",
        "avgAcc": 98,
        "avgSpeed": parseInt(wpm),
        "carID": 9,
        "password": password,
        "qualifying": 1, 
        "raceSounds": "none",
        "receiveContact": "",
        "tz": "America/Indianapolis",
        "username": username
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const responseData = await response.json();
        
        if (response.status === 200) {
            return { success: true, username: responseData.results.username, password: password };
        } else {
            const error = responseData.results?.username?.[0] || 
                         responseData.results?.password?.[0] || 
                         responseData.results?.avgSpeed?.[0] || 
                         "Unknown error";
            return { success: false, error: error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Main account generation function
async function generateAccounts() {
    const accountCount = document.getElementById('accountCount').value;
    const wpm = document.getElementById('wpm').value;
    const baseUsername = document.getElementById('baseUsername').value.trim();
    const basePassword = document.getElementById('basePassword').value.trim();
    const responseDiv = document.getElementById('response');
    const accountsList = document.getElementById('accountsList');
    
    if (!validateBaseInputs(baseUsername, basePassword)) return;
    
    // Show loading state
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = "Generating accounts...";
    responseDiv.className = "alert";
    accountsList.innerHTML = "";
    
    let successfulAccounts = [];
    let failedAccounts = [];
    const accountPromises = [];
    
    // Create account promises
    for (let i = 0; i < accountCount; i++) {
        const username = generateUsername(baseUsername, i+1);
        const password = generatePassword(basePassword);
        accountPromises.push(createAccount(username, password, wpm));
    }
    
    // Process in batches
    try {
        const BATCH_SIZE = 5;
        for (let i = 0; i < accountPromises.length; i += BATCH_SIZE) {
            const batch = accountPromises.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.allSettled(batch);
            
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successfulAccounts.push(`${result.value.username}:${result.value.password}`);
                } else {
                    const error = result.reason?.error || result.value?.error || "Unknown error";
                    failedAccounts.push(error);
                }
            });

            // Update progress
            const processed = Math.min(i + BATCH_SIZE, accountCount);
            responseDiv.innerHTML = `Generating accounts... (${processed}/${accountCount} completed)`;
            
            // Add delay between batches
            if (i + BATCH_SIZE < accountPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Display results
        if (successfulAccounts.length > 0) {
            accountsList.innerHTML = `
                <h3>Successfully Created Accounts (${successfulAccounts.length})</h3>
                <div class="alert alert-success">
                    <p>${successfulAccounts.length} accounts created successfully!</p>
                </div>
                <pre>${successfulAccounts.join('\n')}</pre>
            `;
        }
        
        if (failedAccounts.length > 0) {
            accountsList.innerHTML += `
                <h3>Failed Accounts (${failedAccounts.length})</h3>
                <div class="alert alert-danger">
                    <p>${failedAccounts.length} accounts failed to create.</p>
                </div>
                <pre>${failedAccounts.slice(0, 10).join('\n')}</pre>
                ${failedAccounts.length > 10 ? `<p>+ ${failedAccounts.length - 10} more failures...</p>` : ''}
            `;
        }
        
        // Final status
        responseDiv.innerHTML = `Completed! ${successfulAccounts.length} succeeded, ${failedAccounts.length} failed.`;
        responseDiv.className = successfulAccounts.length > 0 ? "alert alert-success" : "alert alert-danger";
        
    } catch (error) {
        responseDiv.innerHTML = `Error during account generation: ${error.message}`;
        responseDiv.className = "alert alert-danger";
    }
}

// ======================
// TEAM TAGS SYSTEM
// ======================

// Team tags configuration
const TAGS_CONFIG = {
    batchSize: 500,
    renderDelay: 50,
    cacheDuration: 24 * 60 * 60 * 1000 // 24 hours
};

// Load team tags
async function loadTeamTags() {
    console.log('Loading team tags...');
    
    // Show loading state
    document.getElementById('twoLetterTags').innerHTML = '<div class="alert alert-info">Loading 2-letter tags...</div>';
    document.getElementById('threeLetterTags').innerHTML = '<div class="alert alert-info">Loading 3-letter tags...</div>';
    
    try {
        // Load both files simultaneously
        const [twoLetterTags, threeLetterTags] = await Promise.all([
            loadTagFile('2lettertags.txt', 2),
            loadTagFile('3lettertags.txt', 3)
        ]);
        
        // Update last loaded time
        const now = new Date();
        document.getElementById('update-date-2').textContent = now.toLocaleString();
        document.getElementById('update-date-3').textContent = now.toLocaleString();
        
        // Display tags with virtual scrolling
        displayTagsWithVirtualScroll('twoLetterTags', twoLetterTags);
        displayTagsWithVirtualScroll('threeLetterTags', threeLetterTags);
        
        // Setup filtering
        setupTagFiltering(twoLetterTags, threeLetterTags);
        
    } catch (error) {
        console.error('Error loading tags:', error);
        document.getElementById('twoLetterTags').innerHTML = `
            <div class="alert alert-danger">
                Failed to load tags: ${error.message}<br>
                <button onclick="loadTeamTags()" class="btn btn-sm btn-danger">Retry</button>
            </div>`;
    }
}

// Load individual tag file
async function loadTagFile(filename, expectedLength) {
    const response = await fetch(`${filename}?v=${Date.now()}`); // Cache bust
    if (!response.ok) throw new Error(`Failed to load ${filename}: ${response.status}`);
    
    const text = await response.text();
    return text.split('\n')
        .map(tag => tag.trim().toUpperCase())
        .filter(tag => tag.length === expectedLength);
}

// Display tags with virtual scrolling
function displayTagsWithVirtualScroll(containerId, tags) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">No tags available</div>';
        return;
    }
    
    // Create viewport
    const viewport = document.createElement('div');
    viewport.className = 'tags-viewport';
    viewport.style.height = `${Math.ceil(tags.length / 4) * 30}px`; // Approximate height
    
    // Create visible window
    const window = document.createElement('div');
    window.className = 'tags-window';
    window.style.height = '500px';
    window.style.overflow = 'auto';
    
    // Render initial batch
    renderTagBatch(window, viewport, tags, 0);
    
    // Handle scrolling
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollTop;
        const startIdx = Math.floor(scrollPos / 30);
        renderTagBatch(window, viewport, tags, startIdx);
    });
    
    window.appendChild(viewport);
    container.appendChild(window);
}

// Render a batch of tags
function renderTagBatch(window, viewport, tags, startIdx) {
    const endIdx = Math.min(startIdx + TAGS_CONFIG.batchSize, tags.length);
    
    // Clear existing tags
    viewport.innerHTML = '';
    
    // Render visible tags
    for (let i = startIdx; i < endIdx; i++) {
        const tag = document.createElement('div');
        tag.className = 'tag-item';
        tag.textContent = tags[i];
        tag.style.position = 'absolute';
        tag.style.top = `${i * 30}px`;
        viewport.appendChild(tag);
    }
}

// Setup tag filtering
function setupTagFiltering(twoLetterTags, threeLetterTags) {
    const filterInput = document.getElementById('tagFilter');
    
    filterInput.addEventListener('input', function() {
        const filter = this.value.trim().toUpperCase();
        
        const filteredTwoLetter = twoLetterTags.filter(tag => tag.includes(filter));
        const filteredThreeLetter = threeLetterTags.filter(tag => tag.includes(filter));
        
        displayTagsWithVirtualScroll('twoLetterTags', filteredTwoLetter);
        displayTagsWithVirtualScroll('threeLetterTags', filteredThreeLetter);
    });
}

// ======================
// INITIALIZATION
// ======================

// Initialize all systems when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    
    initNavigation();
    initAccountGenerator();
    
    // Load tags if on that page initially
    if (document.getElementById('available-tags').classList.contains('active')) {
        loadTeamTags();
    }
});