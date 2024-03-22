const request = require('request');
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
var csv = require("fast-csv");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {refine, mongo_search_by_name} = require('./common');
const { calc_jaccard_sim } = require('./jaccard');

let lei_db;
let lei_collection;
const url = 'mongodb://localhost:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    lei_db = client.db("leidb");
    lei_collection = lei_db.collection('lei');

    console.log('GLEI database are ready.');
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
            if (key=='ABN' && data[key]=='0') {
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
async function lei_search(name) {
    var key = refine(name);
    const data = await lei_collection.findOne({'key': key});
    if (data) {
        var txt = data.data;
        var jsondata = JSON.parse(txt);
        //const data = await query.exec();
        filter_empty_fields(jsondata);
        return jsondata;
    }
    return data;
}

async function get_lei_info(name) {
    var res = await lei_search(name);
    return res;
}

async function lei_all_list(start=0, count=20) {
    var c_list = await new Promise(resolve=>{
        lei_collection.find({}).sort({'key':1}).skip(start).limit(count).toArray().then(ans=>{
            resolve(ans);
        });
    });
    var name_list = c_list.map(v=>v.attributes && v.attributes.entity && v.attributes.entity.legalName && v.attributes.entity.legalName.name ? v.attributes.entity.legalName.name:v.key);
    return name_list;
}

async function lei_all_list_count() {
    var cnt = await lei_collection.find().count();
    return cnt;
}

/*
async function lei_search_online(query) {
    var endpoint = `https://api.gleif.org/api/v1/lei-records?filter[entity.legalAddress.country]=AU&filter[entity.legalName]=${query}`;

}
*/

async function search_lei(params) {
    let name = params.query;
    let res = await mongo_search_by_name(lei_collection, name, ['key']);
    let result = res.map(item => {
        try{
            var json = JSON.parse(item.data);
            var comp_name = json.attributes.entity.legalName.name;
            var sim1 = calc_jaccard_sim(comp_name, name);
            var type = 'Entity Name';
            return [sim1, comp_name, '', type];
        }
        catch(err) {
            //console.log(err);
            return [-1, '', '', ''];
        }
    })
    result = result.filter(item=>item[0]>=0);
    let sorted_result = result.sort((a,b)=>{return b[0] - a[0]})
    return sorted_result;
}

module.exports = {
    get_lei_info,
    lei_all_list_count,
    lei_all_list,
    search_lei
};