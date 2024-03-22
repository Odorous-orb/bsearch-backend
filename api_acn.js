
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
var csv = require("fast-csv");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {refine, mongo_search_by_name} = require('./common');
const { calc_jaccard_sim } = require("./jaccard");

let acn_db;
let acn_collection;

const url = 'mongodb://localhost:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    acn_db = client.db("acndb");
    acn_collection = acn_db.collection('acn');

    console.log('ACN database are ready.');
});


function filter_empty_fields(data) {
    if (!data) return;
    var key_list = Object.keys(data);
    key_list.forEach(key=>{
        if (key=='ABN' && data[key]=='0') delete data[key];
        if (data[key] == '') delete data[key];
    });
}

async function acn_search_from_abn(abn) {
    const data = await acn_collection.findOne({'ABN': abn});
    //const data = await query.exec();
    filter_empty_fields(data);
    return data;
}

async function acn_search_from_acn(acn) {
    const data = await acn_collection.findOne({'ACN': acn});
    //console.log(data);
    //const data = await query.exec();
    filter_empty_fields(data);
    return data;
}

async function acn_all_list(start=0, count=20) {
    var c_list = await new Promise(resolve=>{
        acn_collection.find({}).sort({'Company Name':1}).skip(start).limit(count).toArray().then(ans=>{
            resolve(ans);
        });
    });
    var name_list = c_list.map(v=>v['Company Name']);
    return name_list;
}

async function acn_all_list_count() {
    var cnt = await acn_collection.find().count();
    return cnt;
}

async function acn_search_by_name(name, limit_cnt = 20) {
    return await mongo_search_by_name(acn_collection, name, ['Company Name', 'Current Name'], limit_cnt);
}

async function search_acn(params, limit_cnt = 20) {
    let name = params.query;
    let res = await mongo_search_by_name(acn_collection, name, ['Company Name', 'Current Name'], limit_cnt);
    let result = res.map(item => {
        var comp_name = item['Company Name'];
        var curr_name = item['Current Name'];

        var sim1 = 0;
        var type = 'Company Name';
        if (comp_name) {
            sim1 = calc_jaccard_sim(comp_name, name);
        }
        
        if (curr_name) {
            var sim2 = calc_jaccard_sim(curr_name, name);
            if (sim2 > sim1) {
                comp_name = curr_name;
                sim1 = sim2;
                type = 'Current Name';
            }
        }

        return [sim1, comp_name, item['ACN'], type];
    })
    let sorted_result = result.sort((a,b)=>{return b[0] - a[0]})
    return sorted_result;
}

module.exports = {
    search_acn,
    acn_search_from_acn, 
    acn_search_from_abn, 
    acn_search_by_name,
    acn_all_list,
    acn_all_list_count,
}
