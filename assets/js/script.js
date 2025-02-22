const peer = new Peer(); // Create PeerJS instance
const fileInput = document.getElementById("fileInput");
const receiverIdInput = document.getElementById("receiverId");
const sendButton = document.getElementById("sendFile");
const transfersDiv = document.getElementById("transfers");
const peerIdDisplay = document.getElementById("peer-id");
const history = [];

//Display the peer ID when ready
peer.on("open", (id) => {
    peerIdDisplay.textContent = id;
});

//Handle incoming connections
peer.on("connection", (conn) => {
    conn.on("data", (data) => {
        const blob = new Blob([new Uint8Array(data)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "received-file.zip";
        link.textContent = "Download received file";
        transfersDiv.appendChild(link);
        
        // Add to history
        history.push({
            type: 'received',
            timestamp: new Date(),
            from: conn.peer,
            size: data.byteLength
        });
        updateHistoryDisplay();
    });
});

// Send file
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
            conn.send(reader.result);
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
            <span class="peer">${entry.type === 'sent' ? 'to' : 'from'} ${entry.to || entry.from}</span>
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