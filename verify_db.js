global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const csv = require('fast-csv');

let gbg_db;
let gbg_collection;

const url = 'mongodb://localhost:27017/';

const urldb = 'mongodb://localhost:27017/gbgdb';
MongoClient.connect(urldb, { useNewUrlParser: true }, (err, db) => {
    if (err) throw err;
    console.log('Database created.');
});

MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    gbg_db = client.db("gbgdb");
    gbg_collection = gbg_db.collection('gbg');
    console.log('GBG database are ready.');
});

async function gbg_search_from_acn(acn) {
    const data = await gbg_collection.findOne({'acn': acn});
    //const data = await query.exec();
    return data;
}

async function gbg_search_from_abn(abn) {
    const data = await gbg_collection.findOne({'abn': abn});
    //const data = await query.exec();
    return data;
}

async function gbg_search_from_name(name) {
    const data = await gbg_collection.findOne({'name': name});
    //const data = await query.exec();
    return data;
}

async function gbg_insert_data(abn, acn, name, json_data) {
    var myDate = new Date();
    var data = {};
    data['abn'] = abn;
    data['acn'] = acn;
    data['name'] = name;
    data['json'] = json_data;
    data['timestamp'] = myDate.toISOString();
    gbg_collection.insertOne(data, (err, res) => {
        if (err) {
            console.error(err);
        }
        else {
            //console.log(data);
            //console.log(res);
            console.log("verification data inserted.");
        }
    });
}

function update() {
    const url = 'mongodb://localhost:27017';
    MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
        if (err) throw err;
        const db = client.db("gbgdb");

        // drop existing collection
        db.collection("gbg").drop(function(err, delOK) {
            //if (err) throw err;
            if (delOK) console.log("Collection deleted");
            db.createCollection("gbg", function(err, res) {
                if (err) throw err;
                console.log("Collection created!");

                wait_list = []
                csv.fromPath("gbg.csv", {headers: true, delimiter: ','})
                   .on("data", function(data){
                        Object.keys(data).forEach(function(key){
                            data[key] = data[key].trim();
                        })
                        
                        let state = [0];
                        wait_list.push(state)
                        db.collection('gbg').insertOne(data, (err,res)=>{
                            if (err) throw err;
                            state[0] = 1;
                        });
                   })
                   .on("end", async function(){
                        while(true){
                            for(var i = 0 ; i < wait_list.length; i++){
                                if (wait_list[i][0] == 0) break;
                            }
                            if (i == wait_list.length) {
                                break;
                            }
                            await new Promise(resolve=>setTimeout(resolve, 3000));
                        }
                        console.log("GBG data updating finished.");
                        client.close();
                        process.exit();
                   });
            });
        });
    });
}

module.exports = {
    gbg_search_from_acn,
    gbg_search_from_abn,
    gbg_search_from_name,
    gbg_insert_data
}