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
    
    let successfulAccounts = [];
    let failedAccounts = [];
    
    for (let i = 0; i < accountCount; i++) {
        // Generate random username (6-12 chars) and password (8-12 chars)
        const username = generateRandomString(6 + Math.floor(Math.random() * 7));
        const password = generateRandomString(8 + Math.floor(Math.random() * 5));
        
        const result = await createAccount(username, password, wpm);
        
        if (result.success) {
            successfulAccounts.push(`${result.username}:${result.password}`);
        } else {
            failedAccounts.push(`Failed to create ${username}: ${result.error}`);
        }
        
        // Update progress
        responseDiv.innerHTML = `Generated ${i+1}/${accountCount} accounts...`;
    }
    
    // Display results
    if (successfulAccounts.length > 0) {
        accountsList.innerHTML = `
            <h3>Successfully Created Accounts</h3>
            <div class="alert alert-success">
                <p>${successfulAccounts.length} accounts created successfully!</p>
            </div>
            <pre>${successfulAccounts.join('\n')}</pre>
        `;
    }
    
    if (failedAccounts.length > 0) {
        accountsList.innerHTML += `
            <h3>Failed Accounts</h3>
            <div class="alert alert-danger">
                <p>${failedAccounts.length} accounts failed to create.</p>
            </div>
            <pre>${failedAccounts.join('\n')}</pre>
        `;
    }
    
    responseDiv.innerHTML = `Completed! ${successfulAccounts.length} succeeded, ${failedAccounts.length} failed.`;
    responseDiv.className = successfulAccounts.length > 0 ? "alert alert-success" : "alert alert-danger";
}