const axios = require('axios');
const request = require('request');

var {
    GBG_USERID,
    GBG_PASSWORD,
    GBG_API_ENDPOINT,
    GBG_INFO_ENDPOINT
} = require('./config');

async function verification_by_id(id, type, callback_fn) {
    var userid = GBG_USERID;
    var password = GBG_PASSWORD;
    var endpoint = GBG_API_ENDPOINT;
    var url = GBG_INFO_ENDPOINT;
    
    var d = {
        "businessNumber": `${id}`,
        "businessNumberType": type,
        "dataSourceCountry": "AU"
    };

    var param = JSON.stringify(d);
    
    var headers = {
        'Content-Type': 'application/json',
    };
    
    var options = {
        url: url,
        auth: {
            "user": userid,
            "pass": password
        },
        method: 'POST',
        headers: headers,
        body: param
    };
    
    request(options, (err3, ret3, body3)=> {
        var result = body3;
        callback_fn(result);
    });
}

async function verification_by_name(name, type, subtype, id, callback_fn) {
    var userid = GBG_USERID;
    var password = GBG_PASSWORD;
    var endpoint = GBG_API_ENDPOINT;
    var url = GBG_INFO_ENDPOINT;
    
    var d1 = {
        "name": name,
        "businessType": type
    }
    var d;
    if (id != '') {
        d1['businessNumber'] = `${id}`;
    }
    if (subtype != '') {
        d1['subtype'] = subtype;
    }

    d = {
        "manual": true,
        "countryCode": "AU",
        "business": d1
    };
    
    var param = JSON.stringify(d);
    
    var headers = {
        'Content-Type': 'application/json',
    };
    
    var options = {
        url: url,
        auth: {
            "user": userid,
            "pass": password
        },
        method: 'POST',
        headers: headers,
        body: param
    };
    
    request(options, (err3, ret3, body3)=> {
        var result = body3;
        callback_fn(result);
    });
}

async function get_verification_info(vid, callback_fn) {
    var endpoint = `${GBG_API_ENDPOINT}/${vid}`;
    request.get({uri: endpoint, headers: {"Accept": "application/json"}}, (err3, ret3, body3)=> {
        var result = body3;
        callback_fn(result);
    });    
}
module.exports={
    verification_by_id,
    verification_by_name, 
    get_verification_info
};

