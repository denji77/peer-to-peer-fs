// peer-utils.js
import { cookieName, setCookie, getCookie } from './cookie-utils.js';

const peerIdDisplay = document.getElementById("peer-id");

// Function to generate a unique user ID (alphanumeric only)
function generateUserId() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

//Init or retrive uid.
let userId = getCookie(cookieName);

if (!userId) {
    userId = generateUserId();  //Gen uid.
    setCookie(cookieName, userId);  //stores cookie
}


const peer = new Peer(userId); //Initialize PeerJS with persistent ID.

peer.on("open", (id) => {
    console.log("Peer ID generated:", id);
    peerIdDisplay.textContent = id;

});

peer.on("error", (err) => {
    console.error("PeerJS error:", err);
    if (err.type === 'unavailable-id') {
        peerIdDisplay.textContent = "ID unavailable, generating new ID";
        userId = generateUserId(); //id unavaible time to generate new id.
        setCookie(cookieName, userId);
        peer = new Peer(userId); // Create peer with this id.
        peerIdDisplay.textContent = userId;

    } else {
        peerIdDisplay.textContent = "Error generating ID. See console.";//feedback.
        alert("PeerJS Error: " + err.message);
    }
});
export { peer, peerIdDisplay };