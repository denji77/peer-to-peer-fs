import { peer } from './peer-utils.js';

const fileInput = document.getElementById("fileInput");
const receiverIdInput = document.getElementById("receiverId");
const sendButton = document.getElementById("sendFile");
const transfersDiv = document.getElementById("transfers");
const peerIdDisplay = document.getElementById("peer-id");
const history = [];
//Dl
function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type }); //Use provided type only
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename); //Use setAttribute for better compatibility
    link.textContent = `Download ${filename}`; //Change text
    transfersDiv.appendChild(link); //Append to transfersDiv
}

//Handle incoming connections
peer.on("connection", (conn) => {
    conn.on("data", (data) => {

        let filename = "received-file.dat"; //Default filename for some random types
        let filetype = "application/octet-stream"; //Default type

        try {
            const receivedData = JSON.parse(data);
            const blob = new Blob([new Uint8Array(receivedData.file)], { type: receivedData.type });
            console.log("Received filename:", receivedData.name);
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

//Snd
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

const updateHistoryDisplay = function(){
    const historyHTML = history.map(entry => `
        <div class="history-entry">
            <span class="type">${entry.type === 'sent' ? 'Sent' : 'Received'}</span>
            <span class="time">${entry.timestamp.toLocaleString()}</span>
            ${entry.name ? `<span class="name">${entry.name}</span>` : ''}
            <span class="size">${formatBytes(entry.size)}</span>
            <span class="peer">${entry.type === 'sent' ? 'to' : 'by'} ${entry.to || peer.id}</span>
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