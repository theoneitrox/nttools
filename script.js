// Page Navigation for header links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show selected page
        const pageId = this.getAttribute('data-page');
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    });
});

// Page Navigation for tool buttons on home page
document.querySelectorAll('.tool-card .btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const pageId = this.getAttribute('data-page');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
            if (navLink.getAttribute('data-page') === pageId) {
                navLink.classList.add('active');
            }
        });
        
        // Show selected page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    });
});

// Account Generator Functionality
document.getElementById('generateBtn').addEventListener('click', generateAccounts);

function generateRandomString(length, includeSymbols = true) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const symbols = '!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        if (includeSymbols && i === length - 1) {
            // Ensure at least one symbol in password
            result += symbols.charAt(Math.floor(Math.random() * symbols.length));
        } else {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return result;
}

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

function generateUsername(base, index) {
    if (!base) {
        return generateRandomString(6 + Math.floor(Math.random() * 7), false);
    }
    const suffix = `_${index}`;
    const maxBaseLength = 20 - suffix.length;
    const finalUsername = `${base.slice(0, maxBaseLength)}${suffix}`;
    
    // Final validation check
    if (finalUsername.length > 20) {
        alert(`Generated username too long: ${finalUsername}`);
        return generateRandomString(10, false); // Fallback to random
    }
    return finalUsername;
}

function generatePassword(base) {
    if (!base) {
        return generateRandomString(8 + Math.floor(Math.random() * 5));
    }
    const availableLength = 20 - base.length;
    if (availableLength <= 0) {
        alert("Password base too long! Falling back to random password.");
        return generateRandomString(10);
    }
    const suffix = generateRandomString(availableLength);
    return `${base}${suffix}`;
}

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
            return { 
                success: false, 
                error: responseData.results?.username?.[0] || 
                      responseData.results?.password?.[0] || 
                      responseData.results?.avgSpeed?.[0] || 
                      "Unknown error" 
            };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function generateAccounts() {
    const accountCount = document.getElementById('accountCount').value;
    const wpm = document.getElementById('wpm').value;
    const baseUsername = document.getElementById('baseUsername').value.trim();
    const basePassword = document.getElementById('basePassword').value.trim();
    const responseDiv = document.getElementById('response');
    const accountsList = document.getElementById('accountsList');
    
    if (!validateBaseInputs(baseUsername, basePassword)) {
        return;
    }
    
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = "Generating accounts...";
    responseDiv.className = "alert";
    accountsList.innerHTML = "";
    
    let successfulAccounts = [];
    let failedAccounts = [];
    
    // Create all account promises first
    const accountPromises = [];
    for (let i = 0; i < accountCount; i++) {
        const username = generateUsername(baseUsername, i+1);
        const password = generatePassword(basePassword);
        accountPromises.push(createAccount(username, password, wpm));
    }
    
    try {
        // Process in batches to avoid rate limiting
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
            
            // Small delay between batches
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
        
        responseDiv.innerHTML = `Completed! ${successfulAccounts.length} succeeded, ${failedAccounts.length} failed.`;
        responseDiv.className = successfulAccounts.length > 0 ? "alert alert-success" : "alert alert-danger";
        
    } catch (error) {
        responseDiv.innerHTML = `Error during account generation: ${error.message}`;
        responseDiv.className = "alert alert-danger";
    }
}