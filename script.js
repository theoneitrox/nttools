// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', function() {
    console.log('OneNitroX Tools Initialized');
    
    // Initialize all systems
    initMobileMenu();
    initAccountGenerator();
    initTagFiltering();
    initVideoCards();
    
    // Load word list for account generator
    loadWordList();
    
    // Check if we need to load tags
    if (document.querySelector('.page#available-tags')) {
        loadTeamTags();
    }
    
    // Add animations when elements come into view
    initScrollAnimations();
});

// ======================
// WORD LIST MANAGEMENT
// ======================
let WORD_LIST = [];

// Load words from text file
async function loadWordList() {
    try {
        const response = await fetch('words.txt?v=' + Date.now()); // Cache bust
        if (!response.ok) throw new Error('Failed to load words');
        const text = await response.text();
        WORD_LIST = text.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0);
        
        if (WORD_LIST.length === 0) {
            console.warn('Word list is empty, falling back to default words');
            WORD_LIST = ['racer', 'speed', 'fast', 'typer', 'key', 'board', 'nitro'];
        }
    } catch (error) {
        console.error('Error loading word list:', error);
        WORD_LIST = ['racer', 'speed', 'fast', 'typer', 'key', 'board', 'nitro'];
    }
}

// ======================
// MOBILE MENU
// ======================
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.querySelector('i').classList.toggle('fa-bars');
            this.querySelector('i').classList.toggle('fa-times');
        });
    }
}

// ======================
// ACCOUNT GENERATOR
// ======================
function initAccountGenerator() {
    const generateBtn = document.getElementById('generateBtn');
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAccounts);
    }
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
        showAlert('Base username too long! Maximum 15 characters.', 'danger');
        return false;
    }
    if (basePassword && basePassword.length > 10) {
        showAlert('Base password too long! Maximum 10 characters.', 'danger');
        return false;
    }
    return true;
}

// Generate username
function generateUsername(base, index, type = 'random') {
    if (!base) {
        if (type === 'words') {
            return generateWordBasedUsername();
        }
        return generateRandomString(6 + Math.floor(Math.random() * 7), false);
    }
    
    const suffix = `_${index}`;
    const maxBaseLength = 20 - suffix.length;
    const finalUsername = `${base.slice(0, maxBaseLength)}${suffix}`;
    
    if (finalUsername.length > 20) {
        console.warn(`Generated username too long: ${finalUsername}`);
        return type === 'words' ? generateWordBasedUsername() : generateRandomString(10, false);
    }
    return finalUsername;
}

function generateWordBasedUsername() {
    if (WORD_LIST.length === 0) {
        console.warn('Word list not loaded, using random string instead');
        return generateRandomString(8 + Math.floor(Math.random() * 5), false);
    }
    
    // Get 2-3 random words
    const wordCount = 2 + Math.floor(Math.random() * 2);
    let words = [];
    
    for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
        words.push(WORD_LIST[randomIndex]);
    }
    
    // Combine words and add some numbers
    let username = words.join('');
    
    // Add 1-3 numbers at the end
    const numCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numCount; i++) {
        username += Math.floor(Math.random() * 10);
    }
    
    // Ensure it's not too long
    if (username.length > 20) {
        username = username.substring(0, 20);
    }
    
    return username;
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

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    
    const responseDiv = document.getElementById('response');
    if (responseDiv) {
        responseDiv.innerHTML = '';
        responseDiv.appendChild(alertDiv);
        responseDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => {
                responseDiv.style.display = 'none';
            }, 300);
        }, 5000);
    }
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
    const usernameType = document.getElementById('usernameType').value;
    const responseDiv = document.getElementById('response');
    const accountsList = document.getElementById('accountsList');
    
    if (!validateBaseInputs(baseUsername, basePassword)) return;
    
    // Show loading state
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<div class="alert"><i class="fas fa-spinner fa-spin"></i> Generating accounts...</div>';
    accountsList.innerHTML = "";
    
    let successfulAccounts = [];
    let failedAccounts = [];
    const accountPromises = [];
    
    // Create account promises
    for (let i = 0; i < accountCount; i++) {
        const username = generateUsername(baseUsername, i+1, usernameType);
        const password = generatePassword(basePassword);
        accountPromises.push(createAccount(username, password, wpm));
    }

    try {
        const BATCH_SIZE = 50;
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
            responseDiv.innerHTML = `<div class="alert"><i class="fas fa-spinner fa-spin"></i> Generating accounts... (${processed}/${accountCount} completed)</div>`;
            
            // Add delay between batches
            if (i + BATCH_SIZE < accountPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Display results
        if (successfulAccounts.length > 0) {
            accountsList.innerHTML = `
                <h3><i class="fas fa-check-circle"></i> Successfully Created Accounts (${successfulAccounts.length})</h3>
                <div class="alert alert-success">
                    <p>${successfulAccounts.length} accounts created successfully!</p>
                </div>
                <pre>${successfulAccounts.join('\n')}</pre>
                <button class="btn btn-small copy-btn" data-text="${successfulAccounts.join('\n')}">
                    <i class="fas fa-copy"></i> Copy to Clipboard
                </button>
            `;
        }
        
        if (failedAccounts.length > 0) {
            accountsList.innerHTML += `
                <h3><i class="fas fa-times-circle"></i> Failed Accounts (${failedAccounts.length})</h3>
                <div class="alert alert-danger">
                    <p>${failedAccounts.length} accounts failed to create.</p>
                </div>
                <pre>${failedAccounts.slice(0, 10).join('\n')}</pre>
                ${failedAccounts.length > 10 ? `<p>+ ${failedAccounts.length - 10} more failures...</p>` : ''}
            `;
        }
        
        // Final status
        responseDiv.innerHTML = `<div class="alert ${successfulAccounts.length > 0 ? 'alert-success' : 'alert-danger'}">
            <i class="fas ${successfulAccounts.length > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            Completed! ${successfulAccounts.length} succeeded, ${failedAccounts.length} failed.
        </div>`;
        
        // Initialize copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const text = this.getAttribute('data-text');
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                });
            });
        });
        
    } catch (error) {
        responseDiv.innerHTML = `<div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle"></i>
            Error during account generation: ${error.message}
        </div>`;
    }
}

// ======================
// TEAM TAGS SYSTEM
// ======================

async function loadTeamTags() {
    console.log('Loading team tags...');
    
    // Show loading state
    document.getElementById('tags').innerHTML = '<div class="alert alert-info"><i class="fas fa-spinner fa-spin"></i> Loading tags...</div>';
    
    try {
        const tags = await loadTagFile('2lettertags.txt');
        
        // Update last loaded time
        const now = new Date();
        document.getElementById('update-date').textContent = now.toLocaleString();
        
        // Display tags
        displayTags('tags', tags);
        
        // Setup filtering
        setupTagFiltering(tags);
        
    } catch (error) {
        console.error('Error loading tags:', error);
        document.getElementById('tags').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Failed to load tags: ${error.message}<br>
                <button onclick="loadTeamTags()" class="btn btn-sm btn-danger">Retry</button>
            </div>`;
    }
}

// Load individual tag file
async function loadTagFile(filename) {
    const response = await fetch(`${filename}?v=${Date.now()}`); // Cache bust
    if (!response.ok) throw new Error(`Failed to load ${filename}: ${response.status}`);
    
    const text = await response.text();
    return text.split('\n')
        .map(tag => tag.trim().toUpperCase())
        .filter(tag => tag.length === 2);
}

// Display tags
function displayTags(containerId, tags) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!tags || tags.length === 0) {
        container.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-circle"></i> No tags available</div>';
        return;
    }
    
    tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-item';
        tagElement.textContent = tag;
        container.appendChild(tagElement);
    });
}

// Setup tag filtering
function setupTagFiltering(tags) {
    const filterInput = document.getElementById('tagFilter');
    if (!filterInput) return;
    
    filterInput.addEventListener('input', function() {
        const filter = this.value.trim().toUpperCase();
        const tagElements = document.querySelectorAll('.tag-item');
        
        tagElements.forEach(tag => {
            tag.style.display = tag.textContent.includes(filter) ? 'block' : 'none';
        });
    });
}

// Update the initialization to only load tags when on the tags page
document.addEventListener('DOMContentLoaded', function() {
    console.log('OneNitroX Tools Initialized');
    
    // Initialize all systems
    initMobileMenu();
    initAccountGenerator();
    initVideoCards();
    
    // Load word list for account generator
    loadWordList();
    
    // Check if we need to load tags
    if (document.querySelector('h1.page-title i.fa-tags')) {
        loadTeamTags();
    }
    
    // Add animations when elements come into view
    initScrollAnimations();
});

// ======================
// VIDEO CARDS
// ======================
function initVideoCards() {
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('a')) {
                // In a real implementation, this would open the video
                console.log('Opening video:', this.querySelector('h3').textContent);
            }
        });
    });
}

// ======================
// SCROLL ANIMATIONS
// ======================
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animated-card, .feature-card, .timeline-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// ======================
// UTILITY FUNCTIONS
// ======================
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}