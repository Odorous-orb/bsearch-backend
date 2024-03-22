global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
var csv = require("fast-csv");
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {refine, mongo_search_by_name} = require('./common');
const { calc_jaccard_sim } = require("./jaccard");

let abn_to_data = {};
/*
csv
 .fromPath("manage/data/truelocal.csv", {headers: true, delimiter: ','})
 .on("data", function(data){
     if (data.hasOwnProperty('abn')){
         let abn = data['abn'];
         if (abn != '') {
             abn_to_data[abn] = data;
         }
     }
 })
 .on("end", function(){
	console.log("TPB Initialization Done");
 });
*/
 
 function tpb_search_from_abn(abn) {
    if (abn in abn_to_data) 
        return abn_to_data[abn];
    return null;
}


let asx_db;
let asx_collection;
const url = 'mongodb://localhost:27017';
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;

    asx_db = client.db("asxdb");
    asx_collection = asx_db.collection('asx');

    //acn_collection.createIndex({'Company Name': "text"});
    //acn_collection.createIndex({'Current Name': "text"});
    console.log('ASX database are ready.');
});

async function asx_search_by_name(name) {
    var key = refine(name);
    const data = await asx_collection.findOne({'key': key});
    //const data = await query.exec();
    return data;
}

async function asx_all_list(start=0, count=20) {
    var c_list = await new Promise(resolve=>{
        asx_collection.find({}).sort({'displayName':1}).skip(start).limit(count).toArray().then(ans=>{
            resolve(ans);
        });
    });
    var name_list = c_list.map(v=>v.displayName);
    return name_list;
}

async function asx_all_list_count() {
    var cnt = await asx_collection.find().count();
    return cnt;
}

async function search_asx(params) {
    let name = params.query;
    let res = await mongo_search_by_name(asx_collection, name, ['displayName']);
    let result = res.map(item => {
        var comp_name = item.displayName;
        
        var sim1 = calc_jaccard_sim(comp_name, name);
        var type = 'Entity Name';

        return [sim1, comp_name, '', type];
    })
    let sorted_result = result.sort((a,b)=>{return b[0] - a[0]})
    return sorted_result;
}

module.exports = { 
    tpb_search_from_abn, 

    asx_search_by_name,
    asx_all_list,
    asx_all_list_count,
    
    mongo_search_by_name,
    search_asx
};
