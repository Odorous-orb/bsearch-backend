global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const mongo = require('mongodb');
const {
    v4: uuidv4
} = require('uuid');
  
const MongoClient = mongo.MongoClient;

const urldb = 'mongodb://localhost:27017';
var profile_db;
var seed_collection;

init_db();

MongoClient.connect(urldb, { useNewUrlParser: true }, (err, client) => {
    if (err) throw err;
    profile_db = client.db('profile');
    seed_collection = profile_db.collection('seed');

    console.log('Profile Database created.');
});

function init_db() {
    const url = 'mongodb://localhost:27017';
    MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
      if (err) throw err;
      const db = client.db("profile");
  
      // drop existing user_info collection
      db.collection("seed").drop(function(err, delOK) {
        //if (err) throw err;
        if (delOK) log("Seed Collection deleted");
        db.createCollection("seed", function(err, res) {
          log("Seed Collection created");
          seed_collection = profile_db.collection('seed');
        });
      });
    });
}

async function getSeed(address, ip) {
    let time = new Date();
    let baseTime = new Date();
    baseTime.setTime(time.getTime() - 1000*3600*2); // expire time: 2 hours
    await seed_collection.deleteMany({
      time: {$lt: baseTime}
    });
    
    let record = await seed_collection.findOne({
        address: {$regex: address, $options:"i"},
        ip: ip
    });

    if (record) {
        return record.seed;
    }

    let seed = uuidv4();
    await seed_collection.insertOne({
        address: address,
        ip: ip,
        time: time,
        seed: seed
    })
    return seed;
}

module.exports = {
    getSeed
}