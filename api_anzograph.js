const {
    run_query,
    run_update
} = require("./azg");

function login() {
  return;
}

var prefix = `
    PREFIX azp: <http://www.accziom.com/ontology/ns/property/>
    PREFIX azc: <http://www.accziom.com/ontology/ns/class/>
    PREFIX azpr: <http://www.accziom.com/ontology/ns/recordproperty/>
    PREFIX azm: <http://www.accziom.com/ontology/ns/meta/>
    PREFIX abrt: <http://www.accziom.com/ontology/taxonomy/abr#>
    PREFIX anzic: <http://www.accziom.com/ontology/taxonomy/anzic#>
    PREFIX azbs: <http://www.accziom.com/ontology/entity/business/>
    PREFIX azadr: <http://www.accziom.com/ontology/entity/address/au/>
    PREFIX azps: <http://www.accziom.com/ontology/entity/person/>
    PREFIX azcr: <http://www.accziom.com/ontology/entity/unit/currency> 
    PREFIX azun: <http://www.accziom.com/ontology/entity/unit/general> 
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
`;

async function query(query_str, call_back) {
    query_str = [prefix, query_str].join('\n');

    var result = await run_query(query_str);
    
    var json_result = JSON.parse(result);
    if (json_result.hasOwnProperty("results")) {
        //console.log(json_result);
        call_back({"result": json_result.results.bindings, "success":true});
    }
    else {
        call_back({"success":false});
    }
}

async function ask(query_str, call_back) {
    query_str = [prefix, query_str].join('\n');

    var result = await run_query(query_str);
    var json_result = JSON.parse(result);
    if (json_result.hasOwnProperty("boolean")) {
        //console.log(json_result);
        call_back({"result": json_result, "success":true});
    }
    else {
        call_back({"success":false});
    }
}

async function update(query_str, call_back) {
    query_str = [prefix, query_str].join('\n');

    //console.log(query_str);
    var result = await run_update(query_str);
    if (result.startsWith("No ")) {
        call_back({"success":true});
        return;
    }
    if (result.startsWith('Update Successful')) {
        call_back({"success":true});
        return;
    }
    //console.log(result);

    var json_result;
    try {
        json_result  = JSON.parse(result);
    }
    catch(e) {
        console.log(`error= ${e} 
        result=${result}
        query = ${query_str}`);
        call_back({"success":true});
        return;
    }
    if (json_result.hasOwnProperty("results")) {
        var res = json_result.results.binings;
        call_back({"success":true});
    }
    else {
        call_back({"success":false});
    }
}

module.exports = {
  login, 
  update, 
  query,
  ask
};

