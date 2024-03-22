const request = require('request');
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
var csv = require("fast-csv");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {refine, mongo_search_by_name} = require('./common');
const { calc_jaccard_sim } = require('./jaccard');

let tpb_db;
let tpb_collection;
const url = 'mongodb://localhost:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    tpb_db = client.db("tpbdb");
    tpb_collection = tpb_db.collection('tpb');

    console.log('TPB database are ready.');
});

function filter_empty_fields(data) {
    if (!data) return;
    
    if (Array.isArray(data)) {
        data.forEach(item=>{
            filter_empty_fields(item);
        });

        return;
    }
    
    if (data.constructor == Object) {
        var key_list = Object.keys(data);
        key_list.forEach(key=>{
            if (!data[key]) {
                delete data[key];
                return;
            }
            if (data[key] == '') {
                delete data[key];
                return;
            }
            filter_empty_fields(data[key])
        });
    }
}
async function tpb_search(name) {
    name = refine(name);
    var data = await tpb_collection.findOne({'key': name});
    if (data == undefined) {
        var pos = name.indexOf(', ');
        if (pos > 0) {
            var ln = name.slice(0, pos);
            var fn = name.slice(pos + 2, name.length);
            var nn = fn + ' ' + ln;
            console.log('last_first=' + nn);
            data = await tpb_collection.findOne({'key': nn});
        }
    }
    //console.log(data);
    if (data) {
        delete data['key'];
        var jsondata = data;
        //const data = await query.exec();
        filter_empty_fields(jsondata);
        return jsondata;
    }
    return data;
}

async function get_tpb_info(name) {
    var res = await tpb_search(name);
    return res;
}

async function tpb_all_list(start=0, count=20) {
    var c_list = await new Promise(resolve=>{
        tpb_collection.find({}).sort({'PRACTICE_NAME':1}).skip(start).limit(count).toArray().then(ans=>{
            resolve(ans);
        });
    });
    var name_list = c_list.map(v=>v.PRACTICE_NAME);
    return name_list;
}

async function tpb_all_list_count() {
    var cnt = await tpb_collection.find().count();
    return cnt;
}

async function search_tpb(params) {
    let name = params.query;
    let res = await mongo_search_by_name(tpb_collection, name, ['PRACTICE_NAME', 'REG_NAME', 'COMPANY']);
    let result = res.map(item => {
        var comp_name = item.PRACTICE_NAME;
        var sim1 = calc_jaccard_sim(comp_name, name);
        var reg_name = item.REG_NAME
        if (reg_name) {
            var sim2 = calc_jaccard_sim(reg_name, name);
            if (sim2 > sim1) {
                sim1 = sim2;
                comp_name = reg_name;
            }
        }
        reg_name = item.COMPANY
        if (reg_name) {
            var sim2 = calc_jaccard_sim(reg_name, name);
            if (sim2 > sim1) {
                sim1 = sim2;
                comp_name = reg_name;
            }
        }
        var type = 'Entity Name';

        return [sim1, comp_name, '', type];
    })
    let sorted_result = result.sort((a,b)=>{return b[0] - a[0]})
    return sorted_result;
}

module.exports = {
    get_tpb_info,
    tpb_all_list_count,
    tpb_all_list,
    search_tpb
};