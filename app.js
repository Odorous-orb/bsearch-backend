const express = require("express");
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const request = require('request');

const session = require("express-session");
var bodyParser = require('body-parser');
var cors = require('cors');
const {get_gics_name_to_data} = require('./gics');
const {verify_query} = require('./api_verify');
const {
    get_abn_info, search_abn
} = require('./api_abn');

const { 
    tpb_search_from_abn, 
    asx_search_by_name,
    asx_all_list,
    asx_all_list_count,
    search_asx
} = require('./api_asx');

const { 
    acn_search_from_abn, 
    acn_search_from_acn, 
    acn_search_by_name,
    acn_all_list_count,
    acn_all_list,
} = require('./api_acn');

const mrc = require('./mrc_api');
const qamanager = require('./anzic_qamanager');

const {
    get_tpb_info, tpb_all_list, tpb_all_list_count, search_tpb
} = require('./api_tpb');

const {
    get_tl_info
} = require('./api_truelocal');

const {
    get_lei_info, lei_all_list, lei_all_list_count, search_lei
} = require('./api_lei');

const {
    get_bing_info
} = require('./api_bing');

const {
    get_anzic_code
} = require('./api_anziccode');

const {
    manage_db
} = require('./app_manage');

const {
    abn_all_list_count,
    abn_all_list
} = require('./manage/update_abn');

const app = express();

app.set('trust proxy', 1)
/*http_app.use(session({
    secret: 'keyboard cat',
    resave: false,
    cookie: {secure:true}
}))*/

const cert_options = {
    key: fs.readFileSync('./certification/privkey.pem', 'utf8'),
    cert: fs.readFileSync('./certification/fullchain.pem', 'utf8'),
};

const api_app = express();
const api1_app = express();

const { 
    get_profile_by_abn, 
    get_profile_by_acn, 
    get_candidates,
} = require('./api.js')

const {
    sparql_login,
    search_name,
    search_by_abn,
    search_by_acn,
    search_by_name,
    search_uri,
    insert_rdf_record,
    sync_sparql_query,
    get_geolocation,
    rdf_all_list,
    rdf_all_list_count,
    search_rdf,
    get_new_uri,
    get_record_info,
    get_probable_properties,
    get_uri_candidates,
    vote_record,
    delete_record,
    sync_sparql_cmd,
    sync_sparql_update
} = require('./api_rdfdb.js');

sparql_login();
var port = 8008; //port = 8008;
var api_port = 8007;
var api1_port = 8009;


// web service
//app.use(express.static("public"));
//app.use(cors());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
////app.listen(port, () => console.log('App is running now!'));

// api server
api_app.use(cors());
api_app.use(bodyParser.json());
api_app.use(bodyParser.urlencoded({ extended: true }));

// api server
api1_app.use(cors());
api1_app.use(bodyParser.json());
api1_app.use(bodyParser.urlencoded({ extended: true }));

https.createServer(cert_options, api_app)
  .listen(api_port, () => console.log(`Server listening on port ${api_port}!`));

//https.createServer(cert_options, app)
//  .listen(https_port, () => console.log(`WebPage listening on port ${port}!`));

https.createServer(cert_options, api1_app)
  .listen(api1_port, () => console.log(`Server listening on port ${api1_port}!`));

const http_app = express();
http_app.listen(port, () => console.log('App is running now!'));
http_app.get("*", function(request, response){
    response.redirect("https://" + request.headers.host + request.url);
});

api_app.get('/namesearch_rdf/:name', async function(req, res) {
	if (!req.params) {
        return res.json({}); 
    }
    const name = req.params.name || '';

    var rdf_res = await search_name(name);
    var dict = {};
    var result = [];
    rdf_res.forEach(ri => {
        var id = "";
        if (ri.acn != undefined) {
            id = ri.acn;
            if (dict.hasOwnProperty(ri.acn)) return;
            dict[ri.acn] = 1;
        }
        if (ri.abn != undefined) {
            id = ri.abn;
            if (dict.hasOwnProperty(ri.abn)) return;
            dict[ri.abn] = 1;
        }
        result.push([100, ri.value, id, ri.type]);
    });
    //console.log(`candidates = ${JSON.stringify(result)}`);
    res.json(result);
	//ws_engine.searchName(name, res);
});

api_app.get('/namesearch/:name', function(req, res) {
	if (!req.params) {
        return res.json({}); 
    }
    const name = req.params.name || '';
	//console.log("Name Search : " + name);
	get_candidates(name, async abn_res => {
		//res.json(result)
        var rdf_res = await search_name(name);
        var dict = {};
        var result = [];
        rdf_res.forEach(ri => {
            var id = "";
            if (ri.acn != undefined) {
                id = ri.acn;
                if (dict.hasOwnProperty(ri.acn)) return;
                dict[ri.acn] = 1;
            }
            if (ri.abn != undefined) {
                id = ri.abn;
                if (dict.hasOwnProperty(ri.abn)) return;
                dict[ri.abn] = 1;
            }
            result.push([100, ri.value, id, ri.type]);
        });
        abn_res.forEach(ri => {
            if (dict.hasOwnProperty(ri[2])) return;
            dict[ri[2]] = 1;
            result.push(ri);
        });
		//console.log(`candidates = ${JSON.stringify(result)}`);
		res.json(result);
	});
	//ws_engine.searchName(name, res);
});

async function search_all(params) {
    var rdf_result = await search_rdf(params);
    var abn_result = await search_abn(params);
    var acn_result = await search_acn(params);
    var asx_result = await search_asx(params);
    var tpb_result = await search_tpb(params);
    var lei_result = await search_lei(params);

    //Promise.all([rdf_result, abn_result, acn_result, asx_result, tpb_result, lei_result])
    //.then(result=>{
        var result = [rdf_result, abn_result, acn_result, asx_result, tpb_result, lei_result]
        var s = [];
        for (var i = 0 ; i < result.length; i++) {
            if (result[i].length === 0) continue;
            s = [...s, ...result[i]]
        }
        return s;
    //})
}

api_app.post('/search', async function(req, res) {
    let params = null;
    if (req.body.query) {
        params = req.body;
    }
    else if (req.query.query) {
        params = req.query;
    }

    if (params === null || params.query === '') {
        res.json([]);
        return;
    }

    let db = params.db || '';
    db = db.toLowerCase();
    let result = [];
    
    if (db === 'all' || db === '') {
        result = await search_all(params);
    }
    else if (db === 'accziom' || db === 'rdf') {
        result = await search_rdf(params);
    }
    else if (db === 'abr' || db === 'abn') {
        result = await search_abn(params);
    }
    else if (db === 'asic' || db === 'acn') {
        result = await search_acn(params);
    }
    else if (db === 'asx') {
        result = await search_asx(params);
    }
    else if (db === 'tpb') {
        result = await search_tpb(params);
    }
    else if (db === 'lei') {
        result = await search_lei(params);
    }
    result = result.sort((a,b) => (b[0]-a[0]))
    res.json(result);
});

api_app.get('/profile_by_abn/:abnid', async function(req, res) {
    if (!req.params) {
        return res.json({}); 
    }
    const abnid = req.params.abnid || '';
    get_profile_by_abn(abnid, async result=> {
		//console.log(`The profile of ${abnid} is ${JSON.stringify(result)}`)
        result["rdf"] = await search_by_abn(abnid, true);
		res.json(result);
	});
});

api_app.get('/profile_by_acn/:acnid', async function(req, res) {
    if (!req.params) {
        return res.json({}); 
    }
    const acnid = req.params.acnid || '';
    get_profile_by_acn(acnid, async result=> {
		//console.log(`The profile of ${acnid} is ${JSON.stringify(result)}`)
		result["rdf"] = await search_by_acn(acnid, true);
		res.json(result);
	});
});

api_app.get('/profile_by_abn_pro/:abnid', async function(req, res) {
    if (!req.params) {
        return res.json({}); 
    }
    const abnid = req.params.abnid || '';
    get_profile_by_abn(abnid, async result=> {
		//console.log(`The profile of ${abnid} is ${JSON.stringify(result)}`)
        result["rdf"] = await search_by_abn(abnid, false);
		res.json(result);
	});
});

api_app.get('/profile_by_acn_pro/:acnid', async function(req, res) {
    if (!req.params) {
        return res.json({}); 
    }
    const acnid = req.params.acnid || '';
    get_profile_by_acn(acnid, async result=> {
		//console.log(`The profile of ${acnid} is ${JSON.stringify(result)}`)
		result["rdf"] = await search_by_acn(acnid, false);
		res.json(result);
	});
});

api_app.post('/abn_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // abn_id
    console.log(`abn query=${query}`);
    if (query == '') {
        res.json({});
        return;
    }
    var type = get_identifier_type(query);
    if (type == 'abn') {
        var info = await get_abn_info(query, 'id');
        res.json(info);
    }
    else {
        var info = await get_abn_info(query, 'text');
        res.json(info);
    }
    
});

api_app.post('/acn_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // acn_id
    query = query.trim();
    var type = get_identifier_type(query);
    var info = {};
    if (type == 'abn') {
        console.log(`acn from abn query=${query}`);
        info = await acn_search_from_abn(query);
    }
    else if (type == 'acn') {
        console.log(`acn from acn query=${query}`);
        info = await acn_search_from_acn(query);
    }
    //console.log(JSON.stringify(info));
    res.json(info);
});

api_app.post('/bing_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var fee = 0;

    if (body.address &&
        body.seed && 
        body.verification) {
        fee = await mrc.call_verify(TOKEN_URL, body.address, body.seed, body.verification, "spend");
        if (!fee || fee.status === false) {
            res.json({error: fee.error})
            return;
        }
        if (fee.data.amount < 1000) {
            res.json({error: "No enough balances. Please charge enough MERc."});
            return;
        }
    }
    else {
        res.json({error: "Parameter Invalid"});
        return;
    }

    var query_names = body.query; // name
    if (query_names==undefined) {
        res.json({});
        return;
    }
    
    var locality = body.locality;
    if (!locality) { locality = null;}
    console.log(`bing query=${JSON.stringify(query_names)}`);
    if (locality != null) {
        console.log(`bing locality=${JSON.stringify(locality)}`);
    }
    var info = await get_bing_info(query_names, locality);
    if (info) {
        res.json(info);
    }
    else {
        res.json({});
    }
});

api_app.post('/lei_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query_name = body.query; // name
    if (!query_name) {
        res.json({});
        return;
    }
    query_name = query_name.trim();
    if (query_name == '') {
        res.json({});
        return;
    }
    console.log(`lei query=${query_name}`);
    var info = await get_lei_info(query_name);
    if (info) {
        res.json(info);
    }
    else {
        res.json({});
    }
});

api_app.post('/tl_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query_name = body.query; // name
    if (!query_name) {
        res.json({});
        return;
    }
    query_name = query_name.trim();
    if (query_name == '') {
        res.json({});
        return;
    }
    console.log(`tl query=${query_name}`);
    var info = await get_tl_info(query_name);
    if (info) {
        res.json(info);
    }
    else {
        res.json({});
    }
});

api_app.post('/tpb_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // name
    if (!query) {
        res.json({});
        return;
    }
    console.log(`tpb query=${query}`);
    let info = await get_tpb_info(query);
    if (info) {
        res.json(info);
    }
    else {
        res.json({});
    }
});

api_app.post('/asx_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // name
    if (!query) {
        res.json({});
        return;
    }
    console.log(`asx query=${query}`);
    let info = await asx_search_by_name(query);
    if (info != null) {
        delete info['key'];
        res.json(info);
        return;
    }
    res.json({});
});

api_app.post('/sparql', async function(req, res) {
    var query = get_parameter(req, "query")
    if (query == undefined) {
        query = get_parameter(req, "update")
    }

    if (query== undefined) {
        res.json({
            error: "Invalid Parameter"
        })
        return
    }

    if (query.query) {
        var r = await sync_sparql_cmd(query.query)
        res.json(r)
        return
    } else if (query.update) {
        var r = await sync_sparql_update(query.update)
        res.json(r)
        return
    }

    res.json({
        error: "Invalid Parameter"
    })
    return
})

api_app.get('/asx_list', async function(req, res) {
    var start = 0;
    var cnt = 10;
    if (req.body && req.body.start) {
        start = req.body.start;
    }
    if (req.query && req.query.start) {
        start = req.query.start;
    }
    if (req.body && req.body.count) {
        cnt = req.body.count;
    }
    if (req.query && req.query.count) {
        cnt = req.query.count;
    }
    if (cnt>50) cnt = 50
    let info = await asx_all_list(start, cnt);
    res.json(info);
});

api_app.get('/db_list', async function(req, res) {
    var type = '';
    var start = 0;
    var cnt = 10;
    if (req.body && req.body.start) {
        start = parseInt(req.body.start);
    }
    if (req.query && req.query.start) {
        start = parseInt(req.query.start);
    }
    if (req.body && req.body.count) {
        cnt = parseInt(req.body.count);
    }
    if (req.query && req.query.count) {
        cnt = parseInt(req.query.count);
    }
    if (req.body && req.body.type) {
        type = req.body.type;
    }
    if (req.query && req.query.type) {
        type = req.query.type;
    }
    
    if (type == '') {
        res.json([]);
        return;
    }
    if (cnt>100) cnt = 100

    let info = [];
    switch(type) {
        case 'accziom':
            info = await rdf_all_list(start, cnt);
            break;
        case 'abr':
            info = await abn_all_list(start, cnt);
            break;
        case 'ansic':
            info = await acn_all_list(start, cnt);
            break;
        case 'asx':
            info = await asx_all_list(start, cnt);
            break;
        case 'tpb':
            info = await tpb_all_list(start, cnt);
            break;
        case 'lei':
            info = await lei_all_list(start, cnt);
            break;
        default:
            break;
    }
    res.json(info);
    return;
});

api_app.get('/db_list_count', async function(req, res) {
    var type = '';
    if (req.body && req.body.type) {
        type = req.body.type;
    }
    if (req.query && req.query.type) {
        type = req.query.type;
    }

    if (type == '') {
        res.json(0);
        return;
    }
    
    let cnt = 0;
    switch(type) {
        case 'accziom':
            cnt = await rdf_all_list_count();
            break;
        case 'abr':
            cnt = await abn_all_list_count();
            break;
        case 'ansic':
            cnt = await acn_all_list_count();
            break;
        case 'asx':
            cnt = await asx_all_list_count();
            break;
        case 'tpb':
            cnt = await tpb_all_list_count();
            break;
        case 'lei':
            cnt = await lei_all_list_count();
            break;
        default:
            break;
    }
    console.log(`get ${type} db count = ${cnt}`);
    res.json(cnt);
    return;
});

api_app.post('/anzic_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }
    var query = body.query; // query list
    console.log(`anzic query=${JSON.stringify(query)}`);
    let info = await get_anzic_code(query);
    if (info != null) {
        res.json(info);
        return;
    }
    res.json({});
});

const fee_per_record = 920;
const TOKEN_URL = "http://localhost:8885";

/**
  [POST] Request for pay service
  @method
  @param {string} address - address of Layer1
  @param {string} fee - fee
  
  @returns - true or false
*/

function getClientIP(req) {
    return req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        '';
}

api_app.post('/request', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.address) {
        body = req.body;
    }
    if (req.query && req.query.address) {
        body = req.query;
    }

    if (body === undefined) {
        console.log('invalid parameter');
        res.json('');
        return;
    }
    
    let query = body;

    if (query.address && query.fee) {
        let result = await mrc.call_request(TOKEN_URL, query.address, query.fee, "spend", query.reason || "");
        if (result.status === true) {
            res.json(result.data.seed);
            return;
        }
        else {
            console.log('failed request.')
            res.json('');
            return '';
        }
    }
    console.log('invalid parameter');
    res.json('');
    return;
});

/**
  [POST] Request for pay service
  @method
  @param {string} address - address of Layer1
  @param {string} seed - seed for verification
  @param {string} verification - verification code for pay
  @param {string} query - abn id, acn id or legal entity name
  @param {string} free - "true" or "false"
  @returns - true or false
*/

api_app.post('/rdf_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }

    if (body === undefined) {
        res.json({});
        return;
    }
    
    var query = body.query; // abn id / acn id / name
    if (query == undefined) {
        res.json({});
        return;
    }

    var fee = 0;
    var free = false;
    console.log(JSON.stringify(body));
    query = query.trim();
    
    var address = body.address;

    if (address &&
        body.seed &&
        body.verification) {
        let pay_info = await mrc.call_verify(TOKEN_URL, address, body.seed, body.verification, "spend");
        if (pay_info && pay_info.status === true) {
            fee = pay_info.data.amount;
        } else {
            free = true;
        }
        if (fee <= 0) {
            free = true;
        }
    }
    else {
        free = true;
    }
    
    var info = {};
    var type = get_identifier_type(query);
    if (type == 'abn') {
        info = await search_by_abn(query, free);
    }
    else if (type == 'acn') {
        info = await search_by_acn(query, free);
    }
    else {
        info = await search_by_name(query, free);    
    }
    var record_list = info.record_list;

    var predict_fee = 0;
    if (record_list) {
        predict_fee = record_list.length * fee_per_record;
    }
    
    if (free==false) {
        if (fee < predict_fee) {
            res.json({
                'error': 'Invalid payment.'
            });
            return;
        }
        if (record_list && record_list.length>0) {
            mrc.call_reward(TOKEN_URL, fee, record_list);
        }
    }
    delete info.record_list;
    info.predicted_fee = predict_fee;
    res.json(info);
});

/*
    [GET] Getting geolocation of legal entity
    @method
    @param {string} entity - entity uri
    @returns - {lat, lng}
*/
api_app.get('/geolocation', async function(req, res) {
    var entity = undefined;

    if (req.body && req.body.entity) {
        entity = req.body.entity;
    }
    if (req.query && req.query.entity) {
        entity = req.query.entity;
    }
    if (entity == undefined) {
        res.json([]);
        return;
    }

    var result = await get_geolocation(entity);
    res.json(result);
});

/**
  [POST] Request for pay service
  @method
  @param {string} address - address of Layer1
  @param {string} seed - seed for verification
  @param {string} verification - verification code for pay
  @param {string} query - URI
  @param {string} free - "true" or "false"
  @returns - true or false
*/

api_app.post('/uri_query', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.query) {
        body = req.body;
    }
    if (req.query && req.query.query) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // uri
    if (query == undefined) {
        res.json({});
        return;
    }
    var free = false;
    console.log(JSON.stringify(body));
    query = query.trim();
    
    var fee = 0;

    if (body.address &&
        body.seed && 
        body.verification) {
        let pay_info = await mrc.call_verify(TOKEN_URL, body.address, body.seed, body.verification, "spend");
        if (pay_info && pay_info.status === true) {
            fee = pay_info.data.amount;
        } else {
            free = true;
        }
        if (fee <= 0) {
            free = true;
        }
    }
    else {
        free = true;
    }
    
    let info = await search_uri(query, free);

    var record_list = info.record_list;
    var predict_fee = 0;
    if (record_list && record_list.length > 0) {
        predict_fee = record_list.length*fee_per_record;
    }

    if (!free) {
        if (fee < predict_fee) {
            res.json({
                'error': 'Invalid payment.'
            });
            return;
        }
        if (predict_fee > 0) {
            mrc.call_reward(TOKEN_URL, fee,record_list);
        }
    }
    delete info.record_list;
    info.predicted_fee = predict_fee
    res.json(info);
});

api_app.get('/gics', function(req, res) {
	var d = get_gics_name_to_data();
	res.json(d);
});

api_app.post('/updatedb', function(req, res) {
    //console.log(req);
    res.setTimeout(0);
    var rb = req.body;
    var rq = req.query;
    if (rb.hasOwnProperty('cmd')) {
        manage_db(rb, res);
    } else {
        manage_db(rq, res, false);
    }
});

api_app.post('/verify', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.address) {
        body = req.body;
    }
    if (req.query && req.query.address) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body.query; // uri
    if (query == undefined) {
        res.json({});
        return;
    }
    var free = false;
    console.log(JSON.stringify(body));
    query = query.trim();
    
    var fee = 0;

    if (body.address &&
        body.seed && 
        body.verification) {
        fee = await mrc.call_verify(TOKEN_URL, body.address, body.seed, body.verification, "spend");
        if (!fee || fee.status === false) {
            res.json({error: fee.error})
            return;
        }
        if (fee.data.amount < 52000) {
            res.json({error: "No enough balances. Please charge enough MERc."});
            return;
        }
    }
    else {
        res.json({error: "Parameter Invalid"});
        return;
    }

    verify_query(body, res, false);
    //res.json({"msg": "The service has been temporarily stopped."});
    return;
});

var g_qaInstance = new qamanager(0);

api_app.get('/anzic_query', async function(req,res){
    var query = undefined;
    if (req.body && req.body.query) {
        query = req.body;
    }
    if (req.query && req.query.query) {
        query = req.query;
    }

    if (query == undefined) {
        res.json({});
        return;
    }
    g_qaInstance.init();
    g_qaInstance.search_anzic_code(query.query, result=>{
        res.json(result);
    })
});

api_app.get('/legislation_query', async function(req,res){
    var query = undefined;
    if (req.body && req.body.query) {
        query = req.body;
    }
    if (req.query && req.query.query) {
        query = req.query;
    }

    if (query == undefined) {
        res.json({});
        return;
    }
    legislation_query(query.query, result=>{
        res.json(result);
    })
});

api_app.get('/chat', async function(req,res){
    var query = get_parameter(req, "query")
    if (query == undefined) {
        res.json({});
        return;
    }

    if (query.id == undefined) {
        query.id = ''
    }

    var result = await chat(query.query, query.id)
    res.json(result)
});

api1_app.get('/profile_by_abn/:abnid', async function(req, res) {
    const abnid = req.params.abnid;
    var result = {};
    result["rdf"] = await search_by_abn(abnid, true);
    res.json(result);
});

api1_app.get('/profile_by_acn/:acnid', async function(req, res) {
    const acnid = req.params.acnid;
    var result = {};
    result["rdf"] = await search_by_acn(acnid, true);
    res.json(result);
});

api1_app.get('/profile_by_abn_pro/:abnid', async function(req, res) {
    const abnid = req.params.abnid;
    var result = {};
    result["rdf"] = await search_by_abn(abnid, false);
    res.json(result);
});

api1_app.get('/profile_by_acn_pro/:acnid', async function(req, res) {
    const acnid = req.params.acnid;
    var result = {};
    result["rdf"] = await search_by_acn(acnid, false);
    res.json(result);
});

/*
    [POST] Insert RDF data and mint NFT
    @method
    @param {string} record - record that would be inserted to rdf db.
    @param {string} address - address that mint NFT for
    @param {string} id - record id
    @param {string} timestamp - timestamp
    @param {string} nftname - the name of NFT    
*/

api_app.post('/insert_rdf', async function(req, res) {
    var body = undefined;
    if (req.body && req.body.record) {
        body = req.body;
    }
    if (req.query && req.query.record) {
        body = req.query;
    }
    if (body === undefined) {
        res.json({
            error: "Invalid Parameter."
        });
        return;
    }

    var query = body;

    if (query.record && 
        query.address && 
        query.id && 
        query.timestamp &&
        query.nftname) {
        var records = await insert_rdf_record(query.record, query.id, query.timestamp);
        if (records.length == 0) {
            res.json({
                error: 'No record has been inserted. They are already exist in Accziom ontology.'
            })
            return;
        }
        var result = await mrc.call_mintNFT(TOKEN_URL, query.address, query.nftname, records);
        if (result.status === true) {
            res.json({
                id: result.data.nft_id,
                count: records.length
            });
            return;
        }
        res.json({
            error: "Failed mint NFT."
        });
        return;
    }
    res.json({
        error: "Invalid Parameter."
    });
});

api_app.post('/approve_record', async function (req, res) {
    let query = get_parameter(req, "address");
    if (query == undefined) {
        res.json("Parameter Failed");
        return;
    }

    if (query.address && query.record && query.yes_no) {
        let result = await vote_record(query.address, query.record, query.yes_no);
        res.json(result);
        return;
    }
    else {
        res.json("Parameter Failed");
        return;
    }
})

api_app.post('/delete_record', async function (req, res) {
    let query = get_parameter(req, "address");
    if (query == undefined) {
        res.json("Parameter Failed");
        return;
    }

    if (query.address && query.record) {
        let nftName = await mrc.call_getNFTName(TOKEN_URL, query.address, query.record);
        console.log('NFT Name=', nftName)
        if (nftName.status && nftName.result) {
            if (nftName.result == "") {
                res.json("You are not the NFT owner.");
                return;
            }
            let result = await delete_record(query.record);
            res.json(result);
            return;
        }
        res.json("You are not the NFT owner.");
        return;
    }
    else {
        res.json("Parameter Failed");
        return;
    }
})

api_app.post('/get_new_uri', async function(req, res) {
    let prefix = 'untitled';
    if (req.body && req.body.prefix) {
        prefix = req.body.prefix;
    }
    if (req.query && req.query.prefix) {
        prefix = req.query.prefix;
    }
    
    let folder = 'untitled';
    if (req.body && req.body.folder) {
        folder = req.body.folder;
    }
    if (req.query && req.query.folder) {
        folder = req.query.folder;
    }
    
    if (!prefix.endsWith('_')) prefix = prefix+'_';

    let id = await get_new_uri(folder, prefix)
    res.json(id);
});

async function postFormDataAsJson({ url, formData }) {
	const plainFormData = Object.fromEntries(formData.entries());
	const formDataJsonString = JSON.stringify(plainFormData);

	const fetchOptions = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: formDataJsonString,
	};

	const response = await fetch(url, fetchOptions);

	if (!response.ok) {
		const errorMessage = await response.text();
		throw new Error(errorMessage);
	}

	return response.json();
}

function convertToParamPerItem(data, item) {
    let d = data[item];
    if (!d) return '';
    if (!Array.isArray(d)) {
        d = [d]
    }
    let r = d.map(e=>{
        let t = e.split(' ');
        return `${item}=${t.join('+')}`
    })
    return r.join('&');
}

function convertToParam(data) {
    let params = [
        'tm_phrase',
        'tm_near',
        'tm_and', 
        'tm_not',
        'tm_or',
        'df'
    ];

    let dataList = [];
    for (i = 0 ; i < params.length; i++) {
        let p = params[i];
        if (data[p]) dataList.push(convertToParamPerItem(data,p))
    }
    return dataList;
}

api_app.post('/legal_db', async function (req, res) {
    let data = get_parameter(req, 'src')

    var headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0',
        'Accept': 'text/html, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.ato.gov.au/law/',
        'Origin': 'https://www.ato.gov.au',
        'Connection': 'keep-alive',
        'Cookie': 'EktGUID=46a57507-e1fb-4b16-92c9-44a546a42f90; atogovStyle=CSSFile; atogovauvisitor=E3149C11-C6EB-401D-B965-7AA8C1910AEB; ga_8EFJWSZJBF=GS1.1.1674222986.3.0.1674222986.60.0.0; ga=GA1.3.267716431.1668503627; atogovTextsize=2; ATO.LegalDatabase.SearchForm={value:{tm_phrase:[base year],arc:false,df:[],cat:[],tt:[],pageSize:10,src:hs,start:1,stype:find},timestamp:1674222998436}; ASP.NET_SessionId=1tmj2sc4fjczp1ack24g3fq0; ecm=S-jfaiPZj_KoWPEDvY5VGRd6TI1DHnVstBY3_j7AKaTrvSEslTmLGUS64Rw3olAg6FK_8v9wViGZX-QBvCnouhjzaXFRp-G6_to1XdoSF51s30n95568FmL4vGyHTv-GD-47bcu7wsyxtk2fCC6v6RkW_nUP2KVfjb8zCYGXgY_l9dtl4emOXf6n4BJYZBeKC49U7IVHO45layFla1kAnFzfOziHDPMaXRyE5XeSowl5z-DSgUMarvy5V6JQHmdShuh35GV1w9oH0PZ8jJebWJICf1b3TW3kzCErSWwg00gHMfshatdokkvJlNHcdBEtf9_Ms8baM1BW0VYD1InBfM1ziZ3RcqhEfbvNl7Fme5coWS4DFdXjk6Cz-5ayHlHhRK_cJqP3dqfWFJbQxKQTL32dqt0fLf1_GKUXVBbRl0ecT5IVnGqSKWtJ_N9HtxFzP8bDkEH5tIhE_a0tPzbaKtoxyWXgJcO7_6vX4dypwqk1; AtoIsfBrowserSessionId=db7oKo+1sL1BnmcTY1dGXYBO+6euw/81yLbXlR+hL9S6YHVhorfUDjGSNFaxcmoGf8l+06t0R5/Fc5AEsRD60DU8u2Pu+FptIO/JqumvXWU=; TS01222b95=01a45df5bb332e2d6c89d9ea4f64280178067c64ed8b8cbd18fa70a3f4e129f5d9fde3d19a59fb2acb84af3a7c52f999f1944e4595; ak_bmsc=1BAE04EEE3E795FD2BA154DB924680AC~000000000000000000000000000000~YAAQDQ8kFyiZOs6FAQAAGcdzzxKUvBVGTPL3jxRmE787xc/I5hJb7uTAC5OElSdmeToRn1I+mN1you++3TmocQIE//QUUBJuQCaxxb7xBDggf990ustZITqfxfY3qvWu2f0PmUbBjg6Sovei11dnpLqHMU1i1DxHV9ILsgL0IE+rUdQIILAkfKugCgJ07rkCEZNbWq15lHuY7NmHmofOU3oJ/blZNc2xNyfL9LPgbeisjNT0Mq5Stea+5AorybCcQLr8qGTmWY9IUtUPcwyFIlYD0+gE6qNaIPssUeE261Lu5SnHj6AoWe4rvizgiA91kwBLm7i9krH44RlV7RRqwnTA4HxlfMAU7SlocZtLcHNYv3aYO3OvcW+lMDZVGyYnsAzH72Qzyp7UOb1j; Nina-nina-block-session=%7B%22lcstat%22%3Afalse%7D; indexCookie=A; bm_mi=6DAEFDF7109885E245B9144FE5BA06DC~YAAQDQ8kF6qaOs6FAQAAgO9zzxLstzXxsbHdEa4M1rAg4UDWUsam6JCSHzghSiZkYTu56dL4LIgLXH4Od5JKcog15S3uUvbJgpllgWtUj8VXlLolTF614BfBm0je0eaSu4uy14obVwEpbhv++YMYSTFRxjPyByP9PTGNkQfc9e6S0Wwder7qk+1zp3aAVwjxHHJt5lmjrOvOLZVhH4ChfZKrQ8VJUsEVsYEO6FqWzbf6S4gNS4IYksUKOqQ34tUvpIrp7sD3QDmlDlJK12MMMWIY/H39YZsVGVDHhKPmYFCceJvTHMNhGtG4N/r2blO0ikMv8A5mdDbaj7gfBtULXPtmtaMw2IcR~1; bm_sv=F7FA4EBE0AFF02E943EFDDFCAD3C2BE8~YAAQDQ8kF/KaOs6FAQAAq/FzzxJp8/AjyX2+LMlkH+Ae17gHSZE8PS4NBIGr5ul8TkvubXxMbU4BmoStPgF2ve2vZe2/iw+yn99jAmFdn8/AWBj/UeH7vE+xl+BHM17LIh4MIQhOvTkDnIusdPDx+kBPlY3mL7pehvTkK9lYm8FW9ryijpsFIYSTG9M7k3BHRJNym60NVULvYa/XTHv5rhynlG5FuQSAvcceLDwP1E7SBNOHv7499uAhy27TechA~1; gid=GA1.3.846018036.1674222988; gat_UA-72006902-1=1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-origin',
        'TE': 'trailers',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
    };
    
    var dataList = convertToParam(data);
    
    var dataString = `arc=false&pageSize=10&src=hs&stype=find&${dataList.join('&')}`;

    if (data.start) {
        dataString += `&start=${data.start}`
    }
    console.log(dataString);
    var options = {
        url: 'https://www.ato.gov.au/API/v1/law/lawservices/result',
        method: 'POST',
        headers: headers,
        gzip: true,
        body: dataString
    };
    request(options, (error, response, body) => {
        console.log(body)
        res.json({'result': body})
    });
    return;
});

api_app.post('/nftinfo', async function(req, res) {
    let id = '';
    if (req.body && req.body.id) {
        id = req.body.id;
    }
    if (req.query && req.query.id) {
        id = req.query.id;
    }
    
    let records = await mrc.call_nftRecords(TOKEN_URL, id);
    console.log(records)
    let results = [];
    if (records.status === true) {
        records = records.data;
        for (var i = 0 ; i < records.length; i++) {
            let e = records[i];
            let info = await get_record_info(e);
            results.push(info);
        }
    }
    
    res.json(results);
});

/*
    [POST] Getting Address Entity from String
    @method
    @param {string} address - string of address
    @returns - {entity, detailed_address}    
*/

function get_parameter(req, param) {
    var body = undefined;
    console.log(`req.body=${req.body}`)
    console.log(`req.query=${req.query}`)
    if (req.body && req.body[param]) {
        body = req.body;
    }
    if (req.query && req.query[param]) {
        body = req.query;
    }
    return body;
}

api_app.post('/query_address', async function(req, res) {
    var body = get_parameter(req, 'address');
    if (body === undefined) {
        res.json({});
        return;
    }

    var query = body; // acn_id

    if (query.address) {
        var [entity, detailed_address] = await get_address_entity(query.address);
        res.json({
            entity: entity,
            detailed_address: detailed_address
        });
        return;
    }
    res.json({});
});

api_app.post('/get_rdf_properties', async function(req, res) {
    var body = get_parameter(req, 'uri');
    if (body === undefined) {
        res.json([]);
        return;
    }
    let result = await get_probable_properties(body.uri)
    res.json(result);
});

api_app.post('/chat_v2', async function (req, res) {
    var body = get_parameter(req, 'msg');
    if (body === undefined) {
        body = get_parameter(req, 'id');
    }
    if (body === undefined) {
        res.json({
            'error': "Invalid parameter"
        });
        return
    }
    let data = {
        api_key: TAX_GENII_API_KEY,
        id: body.id || "",
        msg: body.msg || "",
        context: body.context || ""
    }
    
    let result = await axios.post(TAX_GENII_URI + "chat_v2", data)
    res.json(result.data)
});

api_app.post('/relation_recognition', async function (req, res) {
    var body = get_parameter(req, 'text');
    
    if (body === undefined) {
        res.json({
            'msg': "Invalid parameter"
        });
        return
    }
    let data = {
        api_key: TAX_GENII_API_KEY,
        text: body.text || ""
    }
    
    let result = await axios.post(TAX_GENII_URI + "relation_recognition", data)
    res.json(result.data)
});

api_app.post('/search_rdf_uri_list', async function(req, res) {
    var body = get_parameter(req, 'query');
    if (body === undefined) {
        res.json([]);
        return;
    }
    let result = await get_uri_candidates(body.query)
    res.json(result);
});

//api1_app.listen(api1_port);

function isNumber(query) {
    for (var i = 0; i < query.length; i++) {
        if (query[i] <'0' || query[i] > '9') {
            return false;
        }
    }
    return true;
}

function get_identifier_type(query) {
    query = query.trim();
    if (isNumber(query)) {
        if (query.length == 11) {
            return 'abn';
        }
        if (query.length == 9) {
            return 'acn';
        }
    }
    return '';
}
const Koa = require('koa'),
      route = require('koa-route'),
      websockify = require('koa-websocket'),
      chat_app = websockify(new Koa(), {}, cert_options);


const { get_address_entity } = require("./manage/update_asx");
const { search_acn } = require("./api_acn");
const { legislation_query } = require("./api_qa");
const { default: axios } = require("axios");
const { chat } = require("./chat/chat");
const { TAX_GENII_URI, TAX_GENII_API_KEY } = require("./config");

const qaManagerDict = {};
var chat_api_port = 8018;

var client_id = 0;

chat_app.ws.use(route.all('/', ctx => {
    console.debug(`connected ${client_id}`);
    ctx['client_id'] = client_id;
    var qaInstance = new qamanager(ctx);
    qaManagerDict[client_id] = qaInstance;
    ctx.websocket.on('message', message => {
        console.log(`input message from ${ctx['client_id']}`)
        qaInstance.processQuestion(message);
    });
    ctx.websocket.on('close', event => {
        console.log(`unconnected: ${ctx.client_id}`);
        delete qaManagerDict[ctx.client_id];
        delete qaInstance;
    });
    client_id += 1;    
}));

chat_app.listen(chat_api_port, err => {
    if (err) throw err;
    console.log(`chat websocket started at port ${chat_api_port}.`);
});