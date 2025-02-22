const peer = new Peer(); // Create PeerJS instance
const fileInput = document.getElementById("fileInput");
const receiverIdInput = document.getElementById("receiverId");
const sendButton = document.getElementById("sendFile");
const transfersDiv = document.getElementById("transfers");
const peerIdDisplay = document.getElementById("peer-id");

// Display the peer ID when ready
peer.on("open", (id) => {
    peerIdDisplay.textContent = id;
});

// Handle incoming connections
peer.on("connection", (conn) => {
    conn.on("data", (data) => {
        const blob = new Blob([new Uint8Array(data)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "received-file.zip";
        link.textContent = "Download received file";
        transfersDiv.appendChild(link);
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
            transfersDiv.innerHTML += `<p>File sent to - ${receiverId}</p>`;
        };
        reader.readAsArrayBuffer(file);
    });
});
// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.log('Service Worker Registration Failed!', err));
    });
}