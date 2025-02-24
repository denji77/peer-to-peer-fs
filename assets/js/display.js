import { peer } from './peer-utils.js';

const fileInput = document.getElementById("fileInput");
const receiverIdInput = document.getElementById("receiverId");
const sendButton = document.getElementById("sendFile");
const transfersDiv = document.getElementById("transfers");
const peerIdDisplay = document.getElementById("peer-id");
const history = [];
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
export {updateHistoryDisplay}