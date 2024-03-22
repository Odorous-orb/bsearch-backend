const { default: axios } = require("axios");
var querystring = require('querystring');
function login() {
    return;
}

async function request_query(sparql_text) {
    let rdfox_server = "http://localhost:12110";
    endpoint_mpnet = rdfox_server + "/datastores/accziom/sparql"

    let response = await axios.get(endpoint_mpnet, {
        auth: {
            "username": "admin",
            "password": "Password12345"
        },
        params: {
            query: sparql_text
        },
        headers: {
            'Content-Type': 'application/sparql-results+json',
            Accept: 'application/sparql-results+json',
        },
    })
    return response.data
}

async function request_update(sparql_text) {
    let rdfox_server = "http://localhost:12110";
    endpoint_mpnet = rdfox_server + "/datastores/accziom/sparql"
    try {
        let response = await axios.get(endpoint_mpnet, {
            auth: {
                "username": "admin",
                "password": "Password12345"
            },
            params: {
                update: sparql_text
            },
            headers: {
                'Content-Type': 'application/sparql-results+json',
                Accept: 'application/sparql-results+json',
            },
        })
        console.log(response.data)
        if (response.data === "") {
            return true;
        }
        return false;
    } catch (e) {
        console.log(e.message);
        return false;
    }
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

    var json_result = await request_query(query_str);

    if (json_result.hasOwnProperty("results")) {
        //console.log(json_result);
        call_back({ "result": json_result.results.bindings, "success": true });
    }
    else {
        call_back({ "success": false });
    }
}

async function ask(query_str, call_back) {
    query_str = [prefix, query_str].join('\n');

    var json_result = await request_query(query_str);

    if (json_result.boolean === true) {
        //console.log(json_result);
        call_back({ "result": json_result, "success": true });
    }
    else {
        call_back({ "success": false });
    }
}

async function update(query_str, call_back) {

    query_str = [prefix, query_str].join('\n');
    var result = await request_update(query_str);
    if (result) {
        call_back({ "success": true });
        return;
    }
    call_back({ "success": false });
    return;
}

module.exports = {
    login,
    update,
    query,
    ask
};

