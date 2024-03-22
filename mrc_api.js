const request = require('request');
//const rsa = require('./rsa_encrypt');

async function httprequest(url, requestData, method="GET"){
    return new Promise((resolve, reject)=>{
        var option ={
          url: url,
          method: method,
          json: true,
          headers: {
              "content-type": "application/x-www-form-urlencoded",
          },
          form: requestData
        }
        request(option, function(error, response, body) {
          if (!error && response.statusCode == 200) {
              resolve(body);
          } else {
              resolve({});
          }
        });
    });  
};

/*
async function call_encrpyt_deposit(hosturl, address, fee) {
    var param = {
        address: address,
        fee: fee
    };
    var encrypted_param = rsa.encrypt(JSON.stringify(param));
    return await httprequest(hosturl + "/deposit", {
        param: encrypted_param
    })
}
*/
async function call_reward(hosturl, fee, records) {
    return httprequest(hosturl + "/reward", {
        fee: fee,
        records: records
    });
}

async function call_mintNFT(hosturl, address, name, records) {
    return httprequest(hosturl + "/mint_nft", {
        address: address,
        name: name,
        records: records
    });
}

async function call_nftRecords(hosturl, id) {
    return httprequest(hosturl + "/get_nft_records", {
        id: id
    });
}

async function call_request(hosturl, address, fee, type, reason="") {
    let result = await httprequest(hosturl + "/request", {
        address: address,
        fee: fee,
        type: type,
        reason: reason
    });
    return result;
}

async function call_verify(hosturl, address, seed, vk, type) {
    result = await httprequest(hosturl + "/verify", {
        address: address,
        seed: seed,
        verification: vk,
        type: type
    });
    return result;
}

async function call_getNFTName(hosturl, address, record) {
    result = await httprequest(hosturl + "/get_nft_name", {
        address: address,
        record: record
    });
    return result;
}

module.exports = {
    call_reward,
    call_mintNFT,
    call_request,
    call_verify,
    call_nftRecords,
    call_getNFTName
}