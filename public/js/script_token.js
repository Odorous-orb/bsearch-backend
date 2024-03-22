var global_address = "";
var global_prvKey = "";
const token_hosturl = "https://bsearchau.accziom.com:8886";
const TOKEN_MULTIPLIER = 1;
const FIXED_NUMBER = 0;

async function mnemonic_clicked() {
    /*
    let old_address = global_address;
    global_address = document.getElementById('address').value;
    global_prvKey = document.getElementById('prvKey').value;
    if (!global_address.startsWith('0x')) {
        global_address = '0x' + global_address;
    }
    if (!global_prvKey.startsWith('0x')) {
        global_prvKey = '0x' + global_prvKey;
    }

    let sk = hex_sha1(global_prvKey);
    httprequest(token_hosturl + '/register', {
        address: global_address,
        layer2PrivKey: sk
    })
    if (wss_socket != null && wss_socket.readyState == WebSocket.OPEN) {
        if (old_address == global_address) return;
        wss_socket.close();
    }

    wss_socket = CreateWebSocket(WSS_SOCKET_URL);
    wss_socket.onopen = evt=>{
        wss_socket.send(global_address);
    }
    wss_socket.onmessage = evt => {
        console.log(evt.data);
        let result = JSON.parse(evt.data);
        let bal = result.balance;
        let transaction = result.transaction;
        let nft = result.nft;
        let stat = result.statistics;
        show_balance(bal, transaction, nft, stat);
    }
    */
}

function changeAccount(account) {
    console.log(`changeAccount=${account}`);
    old_address = global_address;
    global_address = account;
    document.getElementById('address').value = account;
    if (wss_socket != null && wss_socket.readyState == WebSocket.OPEN) {
        if (old_address == global_address) return;
        wss_socket.close();
    }

    wss_socket = CreateWebSocket(WSS_SOCKET_URL);
    wss_socket.onopen = evt=>{
    }
    wss_socket.onmessage = async evt => {
        console.log(evt.data);
        let result = JSON.parse(evt.data);
        if (result.seed) {
            var sign_code = await personal_sign(result.seed);
            var output = {
                type: 'register',
                seed: result.seed,
                address: global_address,
                sign_code: sign_code,
            }
            wss_socket.send(JSON.stringify(output));
            return;
        }
        let bal = result.balance;
        let transaction = result.transaction;
        let nft = result.nft;
        let stat = result.statistics;
        show_balance(bal, transaction, nft, stat);
    }
}


async function deposit_clicked() {
    
    /*
    let div = document.getElementById('fee');
    let fee = parseInt(parseFloat(div.value) * TOKEN_MULTIPLIER);

    if (global_address != "" && fee > 0) {
        let result = await httprequest(token_hosturl + "/direct_deposit", {
            address: global_address,
            privateKey: global_prvKey,
            fee: fee
        });
        if (result.success == false) {
            if (result.msg) {
                alert(result.msg);
            } else {
                alert('deposit failed.');
            }
            return;
        }
        //show_balance();
        if (result.gasFee) {
            let gas = result.gasFee;
            alert(`consumed ${gas.toFixed(6)}ETH for gas fee.`)
        }
        else if (result.gasPrice) {
            let gas = parseFloat(result.gasPrice) / 1e9;
            gas *= result.gasLimit / 1e9;
            alert(`consumed ${gas.toFixed(6)}ETH for gas fee.`)
        } else {
            alert(`consumed ${parseFloat(result.gasUsed) / 1000} kgas for gas fee.`)
        }
    }
    else {
        alert("You should input correct address, private key and fee.")
    }
    */
}

async function secure_transaction(address, fee, type) {
    let seed = await httprequest(token_hosturl + "/request", {
        address: address,
        fee: fee,
        type: type
    });
    if (seed == "") {
        alert('Failed');
        return null;
    } else {
        vk = await personal_sign(seed)
        let result = await httprequest(token_hosturl + "/verify", {
            address: address,
            seed: seed,
            verification: vk,
            type: type
        });
        return result;
    }
}

async function withdraw_clicked() {
    /*
    let div = document.getElementById('fee');
    let fee = parseInt(parseFloat(div.value) * TOKEN_MULTIPLIER);

    if (global_address != "" && fee > 0) {
        let sig = await secure_transaction(global_address, fee, "withdraw");
        httprequest(token_hosturl+"/withdraw_with_signature", {
            address: global_address,
            fee: fee,
            signature: sig,
            privateKey: global_prvKey
        })
    }
    else {
        alert("You should input correct mnemonic and fee.")
    }
    */
}

function ledget_to_string(type) {
    switch(type){
        case 1:
            return "Layer1";
        case 2:
            return "Layer2";
        case 3:
            return "Bitcoin";
        default:
            return "";
    }
}

function balance_from_ledger(balance, ledger) {
    switch(ledger) {
        case 1:
            return balance.layer1;
        case 2:
            return balance.layer2;
        default:
            return "";
    }
}

async function show_balance(bal, transaction, nft, stat) {
    var result = bal;
    let table = document.getElementById('token_prop_table');
    let eth = document.getElementById('eth_bal');
    let layer1 = document.getElementById('layer1_bal');
    let layer2 = document.getElementById('layer2_bal');

    let eth_body = `<td>Ethereum</td><td>${parseFloat(result.eth).toFixed(4)} ETH</td>`;
    let layer1_body = `<td>MERC(Layer1)</td><td>${(parseFloat(result.layer1)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER)} MRC</td>`;
    let layer2_body = `<td>MERC(Layer2)</td><td>${(parseFloat(result.layer2)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER)} MRC</td>`;
    
    if (layer1) {
        eth.innerHTML = eth_body;
        layer1.innerHTML = layer1_body;
        layer2.innerHTML = layer2_body;
    } else {
        table.innerHTML += `
            <tr class="table_body_1">
                <td style="width:20%;">Balance</td>
                <td style="width:80%;">
                    <table>
                    <tr id="eth_bal">${eth_body}</tr>
                    <tr id="layer1_bal">${layer1_body}</tr>
                    <tr id="layer2_bal">${layer2_body}</tr>
                    </table>
                </td>
            </tr>`;
    }

    result = transaction;
    //console.log(result);
    let trans_body = "";
    trans_body = `
    <tr>
        <td style="width:140px;">Time</td>
        <td style="width:60px;">Ledger</td>
        <td style="width:100px;">Transaction</td>
        <td style="width:100px;">Dr<br/>(MERc)</td>
        <td style="width:100px;">Cr<br/>(MERc)</td>
        <td style="width:120px;">Balacnce<br/>(MERc)</td>
        <td style="width:380px;">Detail<td>
    </tr>
    `
    var bal = 0
    result.forEach(e => {
        var fee = parseFloat((parseFloat(e.fee)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER))
        var dr = ""
        var cr = ""
        bal += fee;
        if (e.event != "balance") {
            if (fee > 0) {
                dr = fee;
            } else {
                cr = -fee;
            }
        }
        trans_body += `
            <tr>
                <td>${e.time}</td>
                <td>${ledget_to_string(e.ledger)}</td>
                <td>${e.event}</td>
                <td>${dr.toLocaleString("en-US")}</td>
                <td>${cr.toLocaleString("en-US")}</td>
                <td>${balance_from_ledger(e.balance, e.ledger).toLocaleString("en-US")}</td>
                <td style="text-align:left;">${e.detail}</td>
            </tr>
        `;
    });
    let trans_history = document.getElementById('trans_hist');
    if (trans_history) {
        trans_history.innerHTML = trans_body;
    } else {
        table.innerHTML += `
        <tr class="table_body_odd_1">
            <td style="width:20%;">Transactions</td>
            <td style="width:80%;">
                <div style="overflow:scroll; height:400px;">
                    <table id="trans_hist" style="width:1000px; font-size:10px; table-layout:fixed;">${trans_body}</table>
                </div>
            </td>
        </tr>
        `;
    }

    result = stat;
    if (result) {
        //console.log(result);
        let stat1_body = "";
        Object.keys(result['1']).forEach(k => {
            var e = result['1'][k];
            stat1_body += `
            <tr>
                <td>${k}</td>
                <td>${(parseFloat(e)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER)} MRC</td>
            </tr>
            `;
        });
        let stat2_body = "";
        Object.keys(result['2']).forEach(k => {
            var e = result['2'][k];
            stat2_body += `
            <tr>
                <td>${k}</td>
                <td>${(parseFloat(e)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER)} MRC</td>
            </tr>
            `;
        });
        let stat3_body = "";
        Object.keys(result['3']).forEach(k => {
            var e = result['3'][k];
            stat3_body += `
            <tr>
                <td>${k}</td>
                <td>${(parseFloat(e)/TOKEN_MULTIPLIER).toFixed(FIXED_NUMBER)} MRC</td>
            </tr>
            `;
        });
        let stat_list = document.getElementById('stat1_list');
        if (stat_list) {
            stat_list.innerHTML = stat1_body;
            document.getElementById('stat2_list').innerHTML = stat2_body;
            document.getElementById('stat3_list').innerHTML = stat3_body;
        } else {
            table.innerHTML += `
            <tr class="table_body_odd_1">
                <td>Layer 1 Statistics</td>
                <td>
                    <table id="stat_list1" style="font-size:10px;">${stat1_body}</table>
                </td>
            </tr>
            <tr class="table_body_odd_1">
                <td>Layer 2 Statistics</td>
                <td>
                    <table id="stat_list2" style="font-size:10px;">${stat2_body}</table>
                </td>
            </tr>
            <tr class="table_body_odd_1">
                <td>BTC Statistics</td>
                <td>
                    <table id="stat_list3" style="font-size:10px;">${stat3_body}</table>
                </td>
            </tr>
            `;
        }
    }

    result = nft;
    let nft_body = "";
    nft_body += `
        <tr class="table_body_odd">
            <td>Name</td>
            <td>URI</td>
            <td>Total Rewards</td>
            <td>ID</td>
        </tr>
        `;
    result.forEach(e => {
        if (e.NFTID == '') {
            nft_body += `
            <tr class="table_body_odd_1">
                <td>${e["Name"]}</td>
                <td>${e["URI"]}</td>
                <td>${e["Total Rewards"]} MRC</td>
                <td><input type="button" value="mint" onclick='mintNFT("${e.URI}")'></td>
            </tr>
            `;
        }
        else {
            nft_body += `
            <tr class="table_body_odd_1">
                <td>${e["Name"]}</td>
                <td>${e["URI"]}</td>
                <td>${e["Total Rewards"]} MRC</td>
                <td>#${e["NFTID"]}</td>
            </tr>
            `;
    
        }
    });
    let nft_table = document.getElementById('nft_table');
    nft_table.innerHTML = nft_body;
    
}

async function mintNFT(uri) {
    /*
    await httprequest(token_hosturl + '/releaseNFT', {
        address: global_address,
        privateKey: global_prvKey,
        tokenURI: uri
    });
    */
}

async function refresh_balance() {
    let result = secure_transaction(global_address, 0, "info")
    show_balance(result.balance, result.transaction, result.nft);
}

async function httprequest(url, requestData, method="GET"){
    return new Promise(resolve=>{
        $.ajax({
            type: method, 
            url: url,
            data: requestData, 
            success: function(res){
               resolve(res); 
        }});
    });
    
};

const WSS_PORT = 8887;
const WSS_SOCKET_URL = `wss://bsearchau.accziom.com:${WSS_PORT}`;

let wss_socket = null;

function get_uuid() {
    var d = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r:(r & 0x3) | 0x8).toString(16);
    });
    return uuid;
}

async function mintAnzicNFT() {
    let div = document.getElementById('anzic_code');
    let code = div.innerText;
    let nft_name = document.getElementById('nft_name').value;
    if (nft_name == '') {
        alert("Please input NFT Name");
        return;
    }
    if (global_address == '') {
        alert("Please input Address of User Wallet");
        return;
    }

    let id = get_uuid();
    if (global_info.rdf && global_info.rdf.uri) {
        let uri = global_info.rdf.uri;
        let time = new Date();
        let time_str = time.toISOString();
        let record_str = `<${uri}> azp:anzicCategory [
            azp:value anzic:C${code} ;
            azpr:public "N" ;
            azpr:resource "${id}" ;
        ] .
        <${uri}> azp:personalTimestamp [
            azp:value "${time_str}" ;
            azpr:resource "${id}" ;
            azpr:public "Y" ;
        ] . `;

        await httprequest("https://" + URL + ":8007" + "/insert_rdf", {
            record: record_str,
            address: global_address,
            id: id,
            timestamp: time_str,
            nftname: nft_name
        }, "POST");
    }
}

function refine_html_text(html_str) {
    var result = html_str.replace(/[&]lt[;].*[&]gt[;]/g, ', ');
    var result = result.replace(/[<].*[>]/g, ', ');
    var result = result.replace(/  /g, ' ');
    return result;
}

async function mintTpbNFT() {
    if (!global_info.rdf) { 
        console.log('error: rdf info empty');
        return;
    }

    var uri = global_info.rdf.uri;
    let nft_name = document.getElementById('nft_name').value;
    if (nft_name == '') {
        alert("Please input NFT Name");
        return;
    }
    if (global_address == '') {
        alert("Please input Address of User Wallet");
        return;
    }
    
    var convert_table = {
        'BOARD_DECISION': 'boardDecision',
        'CATEGORY': 'tpbCategory',
        'REASON': 'taxReason',
        'SANCTION': 'taxSanction',
        'SUPSPENSION': 'taxSupspension',
        'TERMINATION': 'taxTermination',
        'DISQUALIFICATION': 'taxDisqualification',
        'REG_DATE': 'tpbRegisteredDate',
        'REG_EXPIRY': 'tpbRegExpiry',
        'REG_TYPE': 'tpbRegType'
    };

    if (global_info.tpb) {
        var tpb = global_info.tpb;

        let record_str = '';
        let id = get_uuid();
        let time = new Date();
        let time_str = time.toISOString();
        
        if (tpb.ID) {
            record_str += `
                <${uri}> azp:TPBID [
                    azp:value "${tpb.ID}" ;
                    azpr:public "N" ;
                    azpr:resource "${id}" ;
                ] .

                <${uri}> azp:personalTimestamp [
                    azp:value "${time_str}" ;
                    azpr:resource "${id}" ;
                    azpr:public "Y" ;
                ] . 
            `;
        }

        var keys = Object.keys(tpb);
        keys.forEach(key=>{
            if (convert_table[key] == undefined) return;
            record_str += `
                <${uri}> azp:${convert_table[key]} [
                    azp:value "${tpb[key]}" ;
                    azpr:public "N" ;
                    azpr:resource "TPB" ;
                ] .
            `;
        });

        if (tpb.BUS_ADDRESS) {
            var bus_addr = refine_html_text(tpb.BUS_ADDRESS);

            var res = await httprequest("https://" + URL + ":8007" + "/query_address", {
                address: bus_addr,
            }, "POST");

            if (res.entity) {
                var value = res.entity;
                
                if (res.detailed_address != '') {
                    record_str += `
                        <${uri}> azp:locateAt [
                            azp:value ${value} ;
                            azp:details <${res.detailed_address}>
                            azpr:public "N" ;
                            azpr:resource "TPB" ;
                        ] .
                    `;
                } else {
                    record_str += `
                        <${uri}> azp:locateAt [
                            azp:value ${value} ;
                            azpr:public "N" ;
                            azpr:resource "TPB" ;
                        ] .
                    `;
                }
                
            }
        }

        await httprequest("https://" + URL + ":8007" + "/insert_rdf", {
            record: record_str,
            address: global_address,
            id: id,
            timestamp: time_str,
            nftname: nft_name
        }, "POST");
    }
    else {
        console.log('error: tpb info empty');
    }
   
}

