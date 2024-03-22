const { default: axios } = require('axios');
const request = require('request');

async function test() {
    let rdfox_server = "http://localhost:12110";
    let sparql_text = "ask { <http://example.com/aaaa1> a <http://example.com/value11>. }"
    endpoint_mpnet = rdfox_server + "/datastores/accziom/sparql"

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
    //console.log(JSON.stringify(response.data.results.bindings))
    /*
    params = {
        query: sparql_text
    }
    headers = {
        'Content-Type': 'application/json'
    };
    options = {
        url: endpoint_mpnet,
        auth: {
          "user": "admin",
          "pass": "Password12345"
        },
        method: 'POST',
        headers: headers,
        params: params
    };
    request(options, function (err3, ret3, body3) {
        var result = body3;
        console.log(result);
    });
    //request.get({uri: endpoint_mpnet, headers: {"Accept": "application/json"}, params:{"query": sparql_text}}, (err3, ret3, body3)=> {
    //    console.log(body3);
    //});
    */    
}

test();