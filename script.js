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

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
    const responseDiv = document.getElementById('response');
    const accountsList = document.getElementById('accountsList');
    
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = "Generating accounts...";
    responseDiv.className = "alert";
    accountsList.innerHTML = "";
    
    // Create an array of promises for parallel processing
    const accountPromises = [];
    for (let i = 0; i < accountCount; i++) {
        const username = generateRandomString(6 + Math.floor(Math.random() * 7));
        const password = generateRandomString(8 + Math.floor(Math.random() * 5));
        
        accountPromises.push(createAccount(username, password, wpm));
    }
    
    try {
        // Run all account creations in parallel
        const results = await Promise.allSettled(accountPromises);
        
        const successfulAccounts = [];
        const failedAccounts = [];
        
        results.forEach((result, i) => {
            if (result.status === 'fulfilled' && result.value.success) {
                successfulAccounts.push(`${result.value.username}:${result.value.password}`);
            } else {
                const error = result.reason?.error || result.value?.error || "Unknown error";
                failedAccounts.push(`Account ${i+1}: ${error}`);
            }
        });
        
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
        responseDiv.innerHTML = `Error during parallel processing: ${error.message}`;
        responseDiv.className = "alert alert-danger";
    }
}