//////////////////////////////////////////////////////////////
// configuration
const API_PORT = 8018;
//const WEB_SOCKET_URL = `ws://localhost:${API_PORT}`;
const WEB_SOCKET_URL = `ws://bsearchau.accziom.com:${API_PORT}`;
const START_MESSAGE = 'Hello! Please input your business name.';

let CreateWebSocket = (() => {
    return (urlValue) => {
        if (window.WebSocket) return new WebSocket(urlValue);
        if (window.MozWebSocket) return new MozWebSocket(urlValue);
        return false;
    };
})();

let webSocket = CreateWebSocket(WEB_SOCKET_URL);
webSocket.onopen = evt => {
    addMsg(1, START_MESSAGE);
}
webSocket.onmessage = evt => {
    var data = evt.data;
    if (data.startsWith('#code#')){
        document.getElementById('code_info').innerHTML=data.slice(6, data.length);
    }
    else if (data.startsWith('#desc#')){
        document.getElementById('desc_info').innerHTML=data.slice(6, data.length);
    }
    else if (data.startsWith('#phrase#')){
        document.getElementById('phr_info').innerHTML=data.slice(8, data.length);
    }
    else if (data.startsWith('#words#')){
        document.getElementById('wrd_info').innerHTML=data.slice(7, data.length);
        document.getElementById('detailsView').scrollTo(0, document.getElementById('detailsList').clientHeight);
    }
    else if (data.startsWith('#accounts#')){
        document.getElementById('account_info').innerHTML=data.slice(10, data.length);
    }
    else {
        addMsg(1, evt.data);
        submit.innerHTML = 'Send';
    }
}

function requestToChatbotServer(inputStr) {
    //alert(inputStr);
    webSocket.send(inputStr);
}

function processInput(inputStr) {
    addMsg(2, inputStr);
    requestToChatbotServer(inputStr)
}

function getCode(code) {
    select(code);
    //webSocket.send('$' + code);
}

function keyEnter() {
    document.getElementById('pl').scrollIntoView({
        behavior: 'auto',
        block: 'end'
    });

    if (event.keyCode == 13) {
        document.getElementById("submit").click();
    }
}

function addMsg(type, msg) {
    let li = document.createElement('li');
    // 1: bot / 2: user
    if (type == 1) {
        li.classList.add('computer-say');
        li.innerHTML = `<span class="sayman">BOT</span><span class="computer say">${msg}</span>`;
    } else {
        li.classList.add('my-say');
        li.innerHTML = `<span class="computer say">${msg}</span><span class="sayman">Me</span>`;
        pl.value = '';
    }
    document.getElementById('view').appendChild(li);
    document.getElementById('ulView').scrollTo(0, document.getElementById('view').clientHeight);
    document.getElementById('pl').focus();
}