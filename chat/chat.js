const { search_from_knowledge, chatgpt } = require("./query")
const {
  v4: uuidv4
} = require('uuid');

const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const mongo_url = 'mongodb://localhost:27017/';
var chat_db;
var chat_collection;

MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  chat_db = client.db('chatdb');
  chat_collection = chat_db.collection('records');
});

async function load_chat_id(id) {
  var record = await chat_collection.findOne({id: id})
  if (record == null) return []
  return record
}

async function save_chat_id(id, hist) {
  var record = await chat_collection.findOne({id: id})
  if (record) {
    await chat_collection.updateOne({id:id}, {$set: {record: record}})
  } else {
    await chat_collection.insertOne({
      id: id,
      record: record
    })
  }
}

function filter(t) {
  f = t.indexOf("\nTable of sections\n");
  if (f >= 0) {
      t = t.slice(0, f)
  }

  f = t.indexOf("\nTable of Subdivisions\n")
  if (f >= 0) {
      t = t.slice(0, f)
  }

  f = t.indexOf("\nItem\n")
  if (f >= 0) {
      t = t.slice(0, f)
  }

  return t
}

async function chat(query, id) {
  let record_hist = []
  if (id !== "") {
    //record_hist = await load_chat_id(id)
  } else {
    id = uuidv4()
  }
  result = await search_from_knowledge(query)
  let content_list = result.map(e=>filter(e.content))
  let context = content_list.join('\n')

  var new_hist = await chatgpt(context, query, record_hist);

  if (new_hist == null) {
    return {id:id, answer:''}
  }
  //await save_chat_id(id, new_hist)
  let last = new_hist[new_hist.length-1]
  return {id:id, answer:last.answer}
}

module.exports = {
  chat
}
