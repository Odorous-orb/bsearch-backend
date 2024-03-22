const fs = require("fs")
const request = require("request-promise-native")
const util = require("util")

let doc_file_name = "./doc/itaa1997240.txt"
const readFile = util.promisify(fs.readFile)

async function indexBook(fid, title, body) {
  let url = "http://localhost:9200/books/_doc/" + fid
  let payload = {
    url: url,
    body: {
      title: title,
      body: body.join("\n")
    },
    json: true
  }
  return request.put(payload)
}

function split_doc(txt, splitter) {
  var result = []
  while (true) {
    var ff = txt.search(splitter);
    if (ff < 0) {
      result.push(txt)
      break
    }
    if (ff > 0) {
      result.push(txt.slice(0, ff))
    }
    txt = txt.slice(ff + splitter.length, txt.length)
  }
  return result
}

(async _ => {
  let txt = await readFile(doc_file_name);
  txt = txt.toString()
  books = split_doc(txt, "\nINCOME TAX ASSESSMENT ACT 1997\n")

  for (var i = 0; i < books.length; i++) {
    var book = books[i]
    let [title, ...body] = book.toString().split("\n");
    let f = "INCOME TAX ASSESSMENT ACT 1997 " + title
    try {
      let result = await indexBook(f, title, body);
    } catch (err) {
      console.log("ERROR: ", err)
    }
  }
})();
