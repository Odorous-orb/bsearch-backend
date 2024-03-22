var request = require('request');

const {
  ANZOGRAPH_ENDPOINT
} = require('./config');

var headers = {
  'Accept': 'json',
  'Content-Type': 'application/x-www-form-urlencoded'
};

function run_query(query) {
  qd = {};
  //console.log(`run query = ${query}`);
  qd.query = query;
  var encode = encodeURIComponent(query);
  var dataString = `query=${encode}`;
  
  //headers['Content-Length']= dataString.length;
  //console.log(dataString);
  
  return new Promise((resolve,reject)=> {
    //var dataString = JSON.stringify({"query": query});
    
    var options = {
        url: ANZOGRAPH_ENDPOINT,
        method: 'POST',
        headers: headers,
        body: dataString,
        //formData: qd,
    };
    request(options, (err, resp, body) => {
      if (!err && resp.statusCode == 200) {
        //console.log(body);

        resolve(body);
      }
      else {
        console.log(resp.body);
        if (err) {
          //console.log(err);
          resolve("{}");
        }
        else {
          resolve(JSON.stringify({"results":{"bindings":[]}}));
        }
      }
    });
    
  });
}

function run_update(query) {
  qd = {};
  //console.log(`run update = ${query}`);
  qd.update = query;
  var encode = encodeURIComponent(query);
  var dataString = `update=${encode}`;
  
  //headers['Content-Length']= dataString.length;
  //console.log(dataString);
  
  return new Promise((resolve,reject)=> {
    //var dataString = JSON.stringify({"query": query});
    
    var options = {
        url: ANZOGRAPH_ENDPOINT,
        method: 'POST',
        headers: headers,
        body: dataString,
        //formData: qd,
    };
    request(options, (err, resp, body) => {
      if (!err && resp.statusCode == 200) {
        //console.log(body);
        resolve(body);
      }
      else {
        console.log(resp.body);
        if (err) {
          //console.log(err);
          resolve("{}");
        }
        else {
          resolve(JSON.stringify({"results":{"bindings":[]}}));
        }
      }
    });
    
  });
}

//  include the following for dfjs.DataFrame class
//  <script type="text/javascript" src="https://gmousse.github.io/dataframe-js/dist/dataframe.min.js"></script>

// Returns a Promise to execute a SPARQL query,
//   Resolves to SPARQL results as JS object as described at https://www.w3.org/TR/sparql11-results-json
/*
function run_query(qrystr) {
  return new Promise((resolve,reject)=> {
    // return True if its a valid object instance
    const isvalid = (o)=> { return (undefined !== o && null !== o); };
    // http connection
    if (!isvalid(qrystr) || '' == qrystr) reject('Empty query');
    let xh = new XMLHttpRequest();
    // encode 'query' string
    const reqdata = 'query=' + encodeURIComponent(qrystr);
    // Send request via Http POST
    xh.open('POST','http://admin:Passw0rd1@localhost/sparql');
    // request response in JSON format
    xh.setRequestHeader('Accept','json');
    xh.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    xh.send(reqdata);
    // response handler - return results when response comes back
    xh.onreadystatechange = ()=> {
      if (4 === xh.readyState) {  // response arrived completely
        console.log(xh.status);
        console.log(xh.response);
            
        if (200 === xh.status) {  // HTTP OK
          let ct = xh.getResponseHeader('content-type');
          if (!isvalid(ct)) ct = 'text/plain';
          if (ct.includes('application/sparql-results+json') || ct.includes('json')) {
            try { // parse the JSON response, and Resolve as js object
              resolve(JSON.parse(xh.response));
            }
            catch (err) {  // error parsing json, response from multiple stmts?
              reject('Invalid JSON:\n'+xh.response);
            }
          }
        }
        else { // Not OK, ==> Bad Request(parse errors, etc). or Auth failures etc.
          reject(xh.response);
        }
      }
    };
    // if error occured, display the error
    xh.onerror = (e)=> {
      console.log(e);
      reject('Error Status: '+e.target.status + ': ' + xh.status + ' - ' + e.error);
    };
  });
};
*/
// create dataframe object from JSON dict of SPARQL results
// may throw error if 'resp' is not in the right object
function create_dataframe_from_response(resp) {
  // covert row-wise data to columnar data
  const cols = resp.head.vars;
  let coldata = {};
  cols.forEach((col)=> {
    coldata[col] = [];
  });
  const isvalid = (o)=> { return (undefined !== o && null !== o); };
  resp.results.bindings.forEach((row)=> {
    cols.forEach((col)=> {
      const cell = row[col];
      let val = null;
      try {
        // create a proper instance of datum
        val = cell.value;
        let vtype = cell.type;
        let typeuri = cell.datatype;
        const langtag = cell['xml:lang'];
        if (isvalid(vtype) && vtype == 'bnode') {
          val = '_:'+val;
        }
        else if (isvalid(langtag)) {
          val = '"'+val+'"'+'@'+langtag;
        }
        else if (isvalid(typeuri)) {
          typeuri = typeuri.replace('http://www.w3.org/2001/XMLSchema#','');
          val = typed_value(typeuri,val);
        }
      }
      catch (e) {}  // unbound datum
      coldata[col].push(val);
    });
  });
  // create dfjs.DataFrame instance
  return new dfjs.DataFrame(coldata,cols);
};

// Returns a Promise to create a dfjs.DataFrame
//   Resolves to dfjs.DataFrame object as described at https://www.npmjs.com/package/dataframe-js
//      (script src="https://gmousse.github.io/dataframe-js/dist/dataframe.min.js")
function create_dataframe(qrystr) {
  return new Promise((resolve,reject)=> {
    // run query
    run_query(qrystr).then((r)=> {
      try {
        let df = azg.create_dataframe_from_response(r);
        // create dfjs.DataFrame instance
        resolve(df);
      } catch(e) { reject(e); };
    }).catch((e)=> { reject(e); });
  });
};

// create js value from str-value
function typed_value(typeuri,value) {
  switch (typeuri) {
  case 'boolean': return 'true' === value;
  case 'byte': case 'short': case 'integer':
  case 'int': case 'long': case 'nonNegativeInteger':
    return parseInt(value);
  case 'float': case 'double': case 'decimal':
    return parseFloat(value);
  case 'dateTime': case 'date': case 'time':
    return Date.parse(value);
  case 'duration':
  default: break;
  }
  return value;
};

module.exports = {
  run_query,
  run_update,
  create_dataframe_from_response,
  create_dataframe,
  typed_value
}
