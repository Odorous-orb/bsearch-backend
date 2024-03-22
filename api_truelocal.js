const request = require('request');
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
var csv = require("fast-csv");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {refine} = require('./common');

let tl_db;
let tl_collection;
const url = 'mongodb://localhost:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    tl_db = client.db("tldb");
    tl_collection = tl_db.collection('tl');

    console.log('TrueLocal database are ready.');
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
async function tl_search(name) {
    var data = await tl_collection.findOne({'key': refine(name)});
    if (data) {
        delete data['key'];
        var jsondata = data;
        //const data = await query.exec();
        filter_empty_fields(jsondata);
        return jsondata;
    }
    return data;
}

async function get_tl_info(name) {
    var res = await tl_search(name);
    return res;
}

module.exports = {
    get_tl_info
};