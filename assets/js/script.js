const cookieName = "peerjsUserId";  // Different name to avoid confusion

// Cookie functions
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to generate a unique user ID (alphanumeric only)
function generateUserId() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {  // Adjust length as needed
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Initialize or retrieve the user ID
let userId = getCookie(cookieName);

if (!userId) {
    userId = generateUserId();  // Generate a random ID
    setCookie(cookieName, userId, 365);
}

// Initialize PeerJS with persistent ID
const peer = new Peer(userId); // Pass in the id, if the peerJs id is available

peer.on("open", (id) => {
    console.log("Peer ID generated:", id);
    peerIdDisplay.textContent = id;

});

peer.on("error", (err) => {

    console.error("PeerJS error:", err);
        if (err.type === 'unavailable-id') {
            peerIdDisplay.textContent = "ID unavailable, generating new ID";
            userId = generateUserId(); // generate new
            setCookie(cookieName, userId, 365); // Store the *new* ID in the cookie!
            peer = new Peer(userId); // Create peer with new ID
            peerIdDisplay.textContent = userId;

        } else{
             peerIdDisplay.textContent = "Error generating ID. See console."; // Provide feedback
            alert("PeerJS Error: " + err.message);
        }

});

const fileInput = document.getElementById("fileInput");
const receiverIdInput = document.getElementById("receiverId");
const sendButton = document.getElementById("sendFile");
const transfersDiv = document.getElementById("transfers");
const peerIdDisplay = document.getElementById("peer-id");
const history = [];

//Dl a file
function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type }); // Use provided type!
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename); // Use setAttribute for better compatibility
    link.textContent = `Download ${filename}`; // Change text
    transfersDiv.appendChild(link); // Append to transfersDiv
}

//Handle incoming connections
peer.on("connection", (conn) => {
    conn.on("data", (data) => {

        let filename = "received-file.dat"; // Default filename
        let filetype = "application/octet-stream"; // Default type

        try {
            const receivedData = JSON.parse(data);
            const blob = new Blob([new Uint8Array(receivedData.file)], { type: receivedData.type });
            console.log("Received filename:", receivedData.name); // DEBUG
            downloadFile(blob, receivedData.name, receivedData.type)
            // Add to history
            history.push({
                type: 'received',
                timestamp: new Date(),
                from: conn.peer,
                size: receivedData.size
            });
            updateHistoryDisplay();
        } catch (e) {
            console.error("Error receiving file", e);
            alert("Error: Corrupted file received");
        }
    });
});

//Send file
sendButton.addEventListener("click", () => {
    const receiverId = receiverIdInput.value.trim();
    const file = fileInput.files[0];

    if (!receiverId || !file) {
        alert("Please enter a receiver ID and select a file.");
        return;
    }

    const conn = peer.connect(receiverId);
    conn.on("open", () => {
        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: file.name,
                type: file.type,
                size: file.size,
                file: Array.from(new Uint8Array(reader.result))
            };

            console.log("File name:", file.name);

            conn.send(JSON.stringify(fileData));
            transfersDiv.innerHTML += `<p>File sent to ${receiverId}</p>`;

            // Add to history
            history.push({
                type: 'sent',
                timestamp: new Date(),
                to: receiverId,
                size: file.size,
                name: file.name
            });
            updateHistoryDisplay();
        };
        reader.readAsArrayBuffer(file);
    });
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.log('Service Worker Registration Failed!', err));
    });
}
function updateHistoryDisplay() {
    const historyHTML = history.map(entry => `
        <div class="history-entry">
            <span class="type">${entry.type === 'sent' ? 'Sent' : 'Received'}</span>
            <span class="time">${entry.timestamp.toLocaleString()}</span>
            ${entry.name ? `<span class="name">${entry.name}</span>` : ''}
            <span class="size">${formatBytes(entry.size)}</span>
            <span class="peer">${entry.type === 'sent' ? 'to' : 'from'} ${entry.to || peer.id}</span>
        </div>
    `).join('');
    document.getElementById('history').innerHTML = historyHTML;
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}