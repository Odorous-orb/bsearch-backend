const {
    EnapsoGraphDBClient
  } = require("@innotrade/enapso-graphdb-client");
  
  // connection data to the run GraphDB instance
const GRAPHDB_BASE_URL = "http://localhost:7200",
    GRAPHDB_REPOSITORY = "business",
    GRAPHDB_USERNAME = "test",
    GRAPHDB_PASSWORD = "test",
    GRAPHDB_CONTEXT_TEST = "http://www.ontotext.com/explicit";

const DEFAULT_PREFIXES = [
    EnapsoGraphDBClient.PREFIX_OWL,
    EnapsoGraphDBClient.PREFIX_RDF,
    EnapsoGraphDBClient.PREFIX_RDFS,
    EnapsoGraphDBClient.PREFIX_XSD,
    EnapsoGraphDBClient.PREFIX_PROTONS,
    {
        prefix: "bsa",
        iri: "http://www.bsearchau.accziom.com/ns#",
    },
    {
      prefix: "abrt",
      iri: "http://www.bsearchau.accziom.com/taxonomy/abr#",
    },
    {
        prefix: "sch",
        iri: "http://www.schema.org/",
    }
  ];
  
let graphDBEndpoint = new EnapsoGraphDBClient.Endpoint({
    baseURL: GRAPHDB_BASE_URL,
    repository: GRAPHDB_REPOSITORY,
    prefixes: DEFAULT_PREFIXES
  });
  
function login() {
  // connect and authenticate
  graphDBEndpoint.login(GRAPHDB_USERNAME,GRAPHDB_PASSWORD)
    .then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });
}

async function query(query_str, call_back) {
    graphDBEndpoint
    .query(query_str)
    .then((result) => {
        //console.log("Query result:\n" + JSON.stringify(result, null, 2));
        if (result.hasOwnProperty("results")) {
            call_back({"result": result.results.bindings, "success":true});
        }
        else {
            call_back({"success":false});
        }
            
    })
    .catch((err) => {
        console.log(err);
        call_back({"success":false});
    });
}

async function update(query_str, call_back) {
    graphDBEndpoint
    .update(query_str)
    .then((result) => {
      //console.log("inserted a data :\n" + JSON.stringify(result, null, 2));
      result["sucess"] = true;
      call_back(result);
    })
    .catch((err) => {
      //console.log(err);
      call_back(err);
    });
}

module.exports = {
  login, 
  update, 
  query,
};

