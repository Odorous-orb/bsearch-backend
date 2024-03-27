const {
  v4: uuidv4
} = require('uuid');

const { default_graph } = require('./common');

const {
  login,
  query,
  update,
  ask
} = require('./api_rdfox');

var fs = require("fs");
const { isReadable } = require('stream');
const { calc_jaccard_sim } = require('./jaccard');

function sparql_login() {
  login();
}

function graph_query(graph) {
  var g = '';
  if (graph != '') {
    g = `from <${graph}>`;
  }
  return g;
}

async function sparql_query(query_str, call_back, graph = default_graph) {
  var qs = `
        select *
        ${graph_query(graph)} 
        where {
            ${query_str}
        }
    `;
  query(qs, call_back);
}

async function sparql_cmd(query_str, call_back) {
  query(query_str, call_back);
}

async function sparql_ask(query_str, call_back, graph = default_graph) {
  var g1 = '';
  var g2 = '';
  if (graph != '') {
    g1 = `graph <${graph}> {`;
    g2 = '}';
  }
  var qs = `
      ask
      {
        ${g1}
          ${query_str}
        ${g2}
      }
  `;
  ask(qs, call_back);
}

var ont_length = 0;
var ont_id = 0;

const BayesNet = require('bayesian-network');

init_ontology_history();

function init_ontology_history() {
  while (true) {
    var b = fs.existsSync(`./manage/data/ontology/cmd_history_{${ont_id}}.rq`);
    if (b) {
      ont_id += 1;
      continue;
    }
    break;
  }
}

async function sparql_insert(query_str, context, call_back, graph = default_graph) {
  var g1 = '';
  var g2 = '';
  if (graph != '') {
    g1 = `graph <${graph}> {`;
    g2 = '}';
  }
  var qs = ''
  if (context == '') {
    qs = 'insert data'
  } else {
    qs = 'insert'
  }

  qs += `
    {
      ${g1} 
        ${query_str}
      ${g2}
    }
  `;

  if (context != '') {
    var cont = `
      where {
        ${g1}
        ${context}
        ${g2}
      }
    `
    qs += cont;
  }
  let r = await update(qs, call_back);

  fs.writeFileSync(`./manage/data/ontology/cmd_history_{${ont_id}}.rq`, qs, { flag: 'a+' });
  ont_length += qs.length;
  if (ont_length > 500000000) {
    ont_id += 1;
    ont_length = 0;
  }
  return r
}

async function sparql_delete(query_str, context_str, call_back, graph = default_graph) {
  var g = '';
  var g1 = '';
  var g2 = '';
  if (graph != '') {
    g = `from <${graph}>`;
    g1 = `graph <${graph}> { `;
    g2 = '}';
  }

  var qs = `
      delete
      {
        ${g1}
        ${query_str}
        ${g2}
      }
      where {
        ${g1}
        ${query_str}
        ${g2}
      }
    `;

  if (context_str != '') {
    qs = `
        delete
        {
          ${g1}
          ${query_str}
          ${g2}
        }
        where {
          ${g1}
          ${context_str}
          ${g2}
        }
      `;
  }
  fs.writeFileSync(`./manage/data/ontology/cmd_history_{${ont_id}}.rq`, qs, { flag: 'a+' });
  ont_length += qs.length;
  if (ont_length > 500000000) {
    ont_id += 1;
    ont_length = 0;
  }

  return await update(qs, call_back);
}

async function sparql_update(qs, call_back, graph = default_graph) {
  fs.writeFileSync(`./manage/data/ontology/cmd_history_{${ont_id}}.rq`, qs, { flag: 'a+' });
  ont_length += qs.length;
  if (ont_length > 500000000) {
    ont_id += 1;
    ont_length = 0;
  }

  return await update(qs, call_back);
}

async function sync_sparql_cmd(query) {
  for (var i = 0; i < 5; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_cmd(query, (successResponse) => {
        resolve(successResponse);
      });
    });
    if (res.success) {
      return res.result;
    }
    console.log(`query failed. query = ${query}`);

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  //console.log(query);

  return [];
}

async function sync_sparql_ask(query, graph = default_graph) {
  for (var i = 0; i < 5; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_ask(query, (successResponse) => {
        resolve(successResponse);
      }, graph);
    });
    if (res.hasOwnProperty('result')) {
      return res.result;
    }
    //console.log(res);
    console.log(`query failed. query = ${query}`);

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  //console.log(query);

  return [];
}

async function sync_sparql_insert(new_query, context = '', graph = default_graph) {
  for (var i = 0; i < 5; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_insert(new_query, context, (successResponse) => {
        resolve(successResponse);
      }, graph);
    });
    if (res.success == true) {
      return res;
    }
    //console.log(`query failed. query = ${new_query}`);
    return res;
    //await new Promise(resolve=>setTimeout(resolve, 1500));
  }
  //console.log(new_query);
  return {};
}

async function sync_sparql_query(new_query, graph = default_graph) {
  for (var i = 0; i < 5; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_query(new_query, (successResponse) => {
        resolve(successResponse);
      }, graph);
    });
    if (res.success == true) {
      return res.result;
    }
    console.log(`query failed. query = ${new_query}`);

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  //console.log(new_query);

  return [];
}

async function sync_sparql_delete(del_query, context = '', graph = default_graph) {
  for (var i = 0; i < 5; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_delete(del_query, context, (successResponse) => {
        resolve(successResponse);
      }), graph;
    });
    if (res.success == true) {
      return res;
    }

    //console.log(new_query);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {};
}

async function sync_sparql_update(query, graph = default_graph) {
  for (var i = 0; i < 3; i++) {
    var res = await new Promise((resolve, reject) => {
      sparql_update(query, (successResponse) => {
        resolve(successResponse);
      }, graph);
    });
    if (res.success == true) {
      return res;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  //console.log(new_query);

  return {};
}

function make_sparql_fuzzy_sql(name) {
  name = name.replace(/[^a-zA-Z0-9', ]/g, ' ');
  words = name.split(' ');
  wps = [];
  words.forEach(wi => {
    if (wi == '') return;

    wps.push(wi.split('').join('[ ]?'));
  })
  return '.*' + wps.join('.*') + '.*';
}

function make_sparql_binding_sql(name) {
  var name = name.replace(/[^a-zA-Z0-9', ]/g, ' ');
  var words = name.split(' ');
  var wps = [];
  var vn = 0;
  words.forEach(wi => {
    if (wi == '') return;

    var cs = wi.split('');
    vn += cs.length - 1;
    wps.push(cs.join('([ ]?)'));
  })
  var r2 = '';
  for (var i = 0; i < vn; i++) {
    r2 += `$${i + 1}`;
  }
  var r1 = '.*' + wps.join('.*') + '.*'
  return [r1, r2];
}

async function search_name(name, graph = default_graph) {
  var regexp = make_sparql_fuzzy_sql(name);
  var [rep_str1, rep_str2] = make_sparql_binding_sql(name);
  var legal_sql = `
    select *
    ${graph_query(graph)}
    where { 
      ?s azp:legalName [azp:value ?o ] .
      optional {?s azp:ABN [azp:value ?abn]} .
      optional {?s azp:ACN [azp:value ?acn]} .
      ?s rdf:type azc:Business .
      filter regex(str(?o), "${regexp}", "i")
      bind(strlen(str(?o)) as ?l)    
    } order by ?l limit 100 
  `;

  if (rep_str2 != '') {
    legal_sql = `
    select * 
    ${graph_query(graph)}
    where { 
      ?s azp:legalName [azp:value ?o ].
      optional {?s azp:ABN [azp:value ?abn]} .
      optional {?s azp:ACN [azp:value ?acn]} .
      ?s rdf:type azc:Business .
      filter regex(str(?o), "${regexp}", "i")
      bind(strlen(str(?o)) as ?l)
      bind(replace(str(?o), "${rep_str1}", "${rep_str2}", "i") as ?l1)    
      bind(strlen(?l1)*10 + ?l as ?l2)
    } order by (?l2) limit 100 
  `;
  }
  var business_sql = `
    select * 
    ${graph_query(graph)}
    where { 
      ?s azp:hasBusiness [azp:value ?o ] .
      optional {?s azp:ABN [azp:value ?abn]} .
      optional {?s azp:ACN [azp:value ?acn]} .
      ?s rdf:type azc:Business .
      filter regex(str(?o), "${regexp}", "i")
      bind(strlen(str(?o)) as ?l)    
    } order by ?l limit 100 
  `;
  if (rep_str2 != '') {
    business_sql = `
    select * 
    ${graph_query(graph)}
    where { 
      ?s azp:hasBusiness [azp:value ?o ].
      optional {?s azp:ABN [azp:value ?abn]} .
      optional {?s azp:ACN [azp:value ?acn]} .
      ?s rdf:type azc:Business .
      filter regex(str(?o), "${regexp}", "i")
      bind(strlen(str(?o)) as ?l)    
      bind(replace(str(?o), "${rep_str1}", "${rep_str2}", "i") as ?l1)
      bind(strlen(?l1)*10 + ?l as ?l2)
    } order by (?l2) limit 100 
  `;
  }
  var legal_result = await sync_sparql_cmd(legal_sql);
  var business_result = await sync_sparql_cmd(business_sql);
  if (legal_result.hasOwnProperty("result")) {
    legal_result = legal_result.result;

  }
  if (business_result.hasOwnProperty("result")) {
    business_result = business_result.result;
  }

  var result = [];
  legal_result.forEach(ri => {
    if (!ri.hasOwnProperty("abn")) {
      ri.abn = "";
    }
    if (!ri.hasOwnProperty("acn")) {
      ri.acn = "";
    }
    result.push({
      "id": ri.s.value,
      "value": ri.o.value,
      "abn": ri.abn.value,
      "acn": ri.acn.value,
      "type": "Entity Name"
    });
  });

  business_result.forEach(ri => {
    if (!ri.hasOwnProperty("abn")) {
      ri.abn = "";
    }
    if (!ri.hasOwnProperty("acn")) {
      ri.acn = "";
    }
    result.push({
      "id": ri.s.value,
      "value": ri.o.value,
      "abn": ri.abn.value,
      "acn": ri.acn.value,
      "type": "Business Name"
    });
  });

  return result;
}

async function search_rdf(params, graph = default_graph) {
  let name = params.query;
  var rdf_res = await search_name(name, graph);
  var dict = {};
  var result = [];
  rdf_res.forEach(ri => {
    var id = "";
    if (ri.acn != undefined) {
      id = ri.acn;
      if (dict.hasOwnProperty(ri.acn)) return;
      dict[ri.acn] = 1;
    }
    if (ri.abn != undefined) {
      id = ri.abn;
      if (dict.hasOwnProperty(ri.abn)) return;
      dict[ri.abn] = 1;
    }
    let sim = calc_jaccard_sim(ri.value, id);
    result.push([sim, ri.value, id, ri.type]);
  });
  return result;
}

function get_name_from_uri(val) {
  var p = val.lastIndexOf('#');
  var p1 = val.lastIndexOf('/');
  if (p1 > p) p = p1;
  return val.slice(p + 1, val.length);
}

/*
async function search_entity_by_query(query, free) {
  var res = await sync_sparql_query(query);

  var result = {};
  var stack = {};

  for (var i = 0; i < res.length; i++) {
    var ri = res[i];
    try{
      result["uri"] = ri.s.value;
      stack[ri.s.value] = true;
    }
    catch(e) {

    }
    var key = ri.p.value;
    var val = ri.o.value;
    var type = ri.o.type;
    
    if (type == "uri") {
      var ent = val;
      var label = '';
      if (ri.lb) {
        label = ri.lb.value;
      }

      if (label && label != '') {
        val = {"uri": ent, "label": label};
      }
      else if (!stack.hasOwnProperty(ent)) {
        val = await search_entity(ent, free, stack);
        if (!val.hasOwnProperty("uri")) continue;
      }
        
    }
    key = get_name_from_uri(key);
    if (result.hasOwnProperty(key)) {
      var preval = result[key];
      if (Array.isArray(preval)) {
        result[key].push(val);
      } else {
        result[key] = [preval, val];
      }
    }
    else {
      result[key] = val;
    }
  }
  return result;
}
*/
async function search_by_abn(abn, free = true, graph = default_graph) {
  var sql = `
    ?s azp:ABN [azp:value "${abn}"] .
    ?s rdf:type azc:Business .
  `;
  var res = await sync_sparql_query(sql, graph);
  console.log("res :: " + JSON.stringify(res));
  if (res.length > 0) {
    var entity = res[0].s.value;
    var res = await get_2nd_property(entity, free);
    return res;
  }
  return {};
}

async function search_entity(entity, graph = default_graph) {
  var sql = `
    ${entity} ?p1 ?o1 .
    ?o1 ?p2 ?v .
    filter isBlank(?o1)
  `
  var r = await sync_sparql_query(sql)
  console.log(r);
}
/*
async function search_entity(entity, free = true, stack={}) {
  if (stack.hasOwnProperty(entity)) {
    return {};
  }
  var pro = "bsa:property";
  if (free) {
    pro = "bsa:freeproperty";
  }
  stack[entity] = true;

  var query = `
      ${'<' + entity + '>'} ?p ?o .
      optional {?o rdfs:label ?lb} .
      ?p rdf:type* ${pro} . 
  `;
  var res = await sync_sparql_query(query);
  var result = {"uri": entity};

  for (var i = 0; i <res.length; i++) {
    var ri = res[i];
    var key = ri.p.value;
    var val = ri.o.value;
    var type = ri.o.type;
    
    if (type == "uri"){
      var label = '';
      if (ri.lb) {
        label = ri.lb.value;
      }
      
      var ent = val;
      if (label && label!='') {
        val = {"uri":ent, "label":label};
      }
      else if (!stack.hasOwnProperty(ent)) {
        val = await search_entity(ent, free, stack);
        if (!val.hasOwnProperty("uri")) continue;
      }
    }
    key = get_name_from_uri(key);
    if (result.hasOwnProperty(key)) {
      var pre = result[key];
      if (Array.isArray(pre)) {
        result[key].push(val);
      }
      else {
        result[key] = [pre, val];
      }
    } 
    else {
      result[key] = val;
    }
  }
  return result;

}
*/
async function search_by_acn(acn, free = true, graph = default_graph) {
  var sql = `
      ?s azp:ACN [azp:value "${acn}" ].
      ?s rdf:type azc:Business .
  `;

  var res = await sync_sparql_query(sql, graph);
  if (res.length > 0) {
    var entity = res[0].s.value;
    var res = await get_2nd_property(entity, free, graph);
    return res;
  }
  return {};
}

async function search_by_name(name, free = true, graph = default_graph) {
  var sql = `
      ?s azp:legalName [ azp:value "${name}" ].
      ?s rdf:type azc:Business .
  `;
  var res = await sync_sparql_query(sql, graph);
  if (res.length > 0) {
    var entity = res[0].s.value;
    var res = await get_2nd_property(entity, free, graph);
    return res;
  }
  return {};
}

async function get_1st_property(uri, graph = default_graph) {
  var sql = `
      <${uri}> ?p ?o .
      optional {?p azm:label ?plb}
      optional {?p azm:group ?pgp}
      optional {?p azm:order ?pord}
      optional { ?o azp:label ?olb} .
  `;
  var res = await sync_sparql_query(sql, graph);
  var result = { "uri": uri };
  var ord_dict = {};
  var oo = 50;

  for (var i = 0; i < res.length; i++) {
    var ri = res[i];
    var key = ri.p.value;
    var val = ri.o.value;
    var type = ri.o.type;
    if (!isProperty(key, "azp")) {
      continue;
    }
    if (type == "uri") {
      var ent = val;
      var val = {};
      val.uri = ent;

      if (ri.olb) {
        val.label = ri.olb.value;
      }
    }

    var parent = result;
    if (ri.pgp == undefined) {
      ri.pgp = { 'value': 'Content' };
    }
    if (ri.pgp) {
      if (result[ri.pgp.value] == undefined) {
        result[ri.pgp.value] = {};
      }
      parent = result[ri.pgp.value]
    }

    if (ri.plb) {
      key = ri.plb.value;
    } else {
      key = get_name_from_uri(key);
    }

    if (ri.pord) {
      ord_dict[key] = ri.pord.value;
      if (ri.pgp) {
        if (ord_dict[ri.pgp.value] == undefined || ord_dict[ri.pgp.value] > ri.pord.value) {
          ord_dict[ri.pgp.value] = ri.pord.value
        }
      }
    } else {
      ord_dict[key] = oo;
      if (ri.pgp) {
        if (ord_dict[ri.pgp.value] == undefined || ord_dict[ri.pgp.value] > oo) {
          ord_dict[ri.pgp.value] = oo
        }
      }
      oo += 1;
    }

    if (parent.hasOwnProperty(key)) {
      var pre = parent[key];
      if (Array.isArray(pre)) {
        parent[key].push(val);
      }
      else {
        parent[key] = [pre, val];
      }
    }
    else {
      parent[key] = val;
    }
  }
  result['##order##'] = ord_dict;
  return result;
}

prop_prefix_dict = {
  'azp': 'http://www.accziom.com/ontology/ns/property/',
  'azpr': 'http://www.accziom.com/ontology/ns/recordproperty/',
  'azm': 'http://www.accziom.com/ontology/ns/meta/'
};

function get_abbr_prop_name(prop) {
  Object.keys(prop_prefix_dict).forEach(key => {
    prop = prop.replace(prop_prefix_dict[key], `${key}:`);
  });
  return prop;
}

function isProperty(uri, prop_kind) {
  if (uri.startsWith(prop_prefix_dict[prop_kind])) return true;
  return false;
}

function isVoteProperty(uri) {
  if (
    uri.startsWith(prop_prefix_dict['azpr']) &&
    (uri.endsWith('/yes') ||
      uri.endsWith('/no'))
  ) {
    return true;
  }
  return false;
}

var network = new BayesNet();

function createBayesianNetwork(variables, dependencies) {
  
  const nodes = {}; // To store references to nodes

    // Create nodes (variables) in the Bayesian network
    // variables.forEach(variable => {
    //     const nodeO1 = new bayes.Node('o1', []);  
    //     nodes[variable] = g.addNode(variable, variable);
    // });

    // Define CPTs for each node based on dependencies
    dependencies.forEach(dependency => {
        const { from, to, predicate } = dependency;
        const parentNode = new bayes.Node(from, []);
        const childNode = new bayes.Node(to, [from]);
        network.addNode(parentNode);
        network.addNode(childNode);
        childNode.setCpt([
          [0.4,0.6],
          [0.5,0.5],
          [0.2,0.8]
        ]);
    });

    // Return an array of nodes
    return Object.values(nodes);
}

async function get_2nd_property(uri, free, graph = default_graph) {
  var free_condition = '';
  //  if (free) {
  //    free_condition = '?o1 azpr:public "Y".';
  //  }

  sql = `
    <${uri}> ?p ?o1 .
    ?o1 ?p1 ?o .
    ${free_condition}
    optional {?p azm:label ?plb}
    optional {?p azm:group ?pgp}
    optional {?p azm:order ?pord}
    optional {?p1 azm:label ?p1lb}
    optional {?p1 azm:order ?p1ord}
    optional {?o1 azpr:public ?pub}
    filter isBlank(?o1)
    optional { ?o azp:label ?olb} .
  `;

  //console.log(sql);
  var res = await sync_sparql_query(sql, graph);
  console.log("f_res :: " + JSON.stringify(res));
  const variables = new Set();
  const dependencies = [];

  // Process each RDF triple
  // res.forEach(entry => {
  //   const subject = entry.p.value;
  //   const object = entry.p1.value;
  //   const predicate = entry.o1.value;

  //   // Add subject and object as variables
  //   network.addNode(subject);
  //   network.addNode(object);
  //   // variables.add(subject);
  //   // variables.add(object);
  //   network.addEdge(subject, object);
  //   const cpt = {};
  //   // Example: Define probabilities for 'true' state of 'o' given 'true' state of 'o1'
  //   cpt[subject] = { true: { true: 0.7, false: 0.3 } }; // You need to specify the actual probabilities
  //   network.setCpt(object, cpt);
  //   // Add dependency between subject and object based on predicate
  //   // dependencies.push({ from: subject, to: object, predicate });
  // });

  // // const bayesianNetwork = createBayesianNetwork(variables, dependencies);
  // const evidence = { o1: true }; // Example evidence
  // const probability = network.calculateProbability('o', evidence);
  // console.log('Probability of o being true:', probability);
  var result = { "uri": uri };

  var blank_dict = {};
  var ord_dict = {};
  var oo = 50;
  var pay_record_list = {};

  for (var i = 0; i < res.length; i++) {
    var ri = res[i];
    var key = ri.p.value;
    var key1 = ri.p1.value;
    var val = ri.o.value;
    var type = ri.o.type;
    var bn = ri.o1.value; // blank node
    var pub_kind = ri.pub ? ri.pub.value : 'Y';
    
    if (pub_kind == 'D') continue;
    if (pub_kind == 'N') {
      if (free) {
        val = '(Payment is required to access the data)'
        if (ri.olb) { ri.olb.value = val; }
      }
      pay_record_list[bn] = 1;
    }

    if (!isProperty(key, "azp")) {
      continue;
    }
    if (!isProperty(key1, "azp")) {
      if (!isVoteProperty(key1)) {
        continue
      }
    }
    if (ri.plb) {
      key = ri.plb.value;
    } else {
      key = get_name_from_uri(key);
    }

    if (ri.p1lb) {
      key1 = ri.p1lb.value;
    } else {
      if (isVoteProperty(key1)) {
        key1 = '__' + get_name_from_uri(key1);
      } else {
        key1 = get_name_from_uri(key1);
      }
    }
    if (type == "uri") {
      var ent = val;
      var val = {};
      val.uri = ent;

      if (ri.olb) {
        val.label = ri.olb.value;
      }
    }

    var parent = result;
    if (ri.pgp == undefined) {
      ri.pgp = { 'value': 'Content' };
    }

    if (ri.pgp) {
      if (result[ri.pgp.value] == undefined) {
        result[ri.pgp.value] = {};
      }
      parent = result[ri.pgp.value]
    }

    if (ri.pord) {
      ord_dict[key] = ri.pord.value;
      if (ri.pgp) {
        if (ord_dict[ri.pgp.value] == undefined || ord_dict[ri.pgp.value] > ri.pord.value) {
          ord_dict[ri.pgp.value] = ri.pord.value
        }
      }
    } else {
      if (ri.pgp) {
        if (ord_dict[ri.pgp.value] == undefined || ord_dict[ri.pgp.value] > oo) {
          ord_dict[ri.pgp.value] = oo
        }
      }
      ord_dict[key] = oo;
      oo += 1;
    }

    if (ri.p1ord) {
      ord_dict[key1] = ri.p1ord.value;
    } else {
      ord_dict[key1] = oo;
      oo += 1;
    }

    if (blank_dict[bn] == undefined) {
      blank_dict[bn] = { '__id': bn };
      if (parent.hasOwnProperty(key)) {
        var pre = parent[key];
        if (Array.isArray(pre)) {
          parent[key].push(blank_dict[bn]);
        }
        else {
          parent[key] = [pre, blank_dict[bn]];
        }
      }
      else {
        parent[key] = blank_dict[bn];
      }
    }

    var bd = blank_dict[bn];
    if (key1 === '__yes' || key1 === '__no') {
      if (bd[key1]) {
        bd[key1] += 1
      } else {
        bd[key1] = 1
      }
    }
    else if (bd.hasOwnProperty(key1)) {
      var pre = bd[key1];
      if (Array.isArray(pre)) {
        bd[key1].push(val);
      }
      else {
        bd[key1] = [pre, val];
      }
    }
    else {
      bd[key1] = val;
    }

  }
  console.log("result :: " + JSON.stringify(result));
  // var temp = {};
  // temp = result;
  result['##order##'] = ord_dict;
  Object.keys(result).forEach(key => {
    var subdict = result[key];
    Object.keys(subdict).forEach(k => {
      var value = subdict[k];
      if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          var vi = value[i];
          if (vi.constructor == Object) {
            if (Object.keys(vi).length == 1 && vi.value != undefined) {
              value[i] = vi.value;
            }
          }
        }
      }
      else if (value.constructor == Object) {
        if (Object.keys(value).length == 1 && value.value != undefined) {
          subdict[k] = value.value;
        }
      }
    })
  });

  Object.keys(result).forEach(key => {
    var subdict = result[key];
    Object.keys(subdict).forEach(k => {
      var value = subdict[k];
      if (Array.isArray(value)) {
        var vi_first = value.length > 0 ? value[0] : {};
        for (var i = 0; i < value.length; i++) {
          var vi = value[i];
          if(vi_first.value != undefined && vi_first.value.label == undefined) {
            var count = 1;
            for (var j = 0; j < value.length; j++) {
              var sub_vi = value[j];
              if(i != j 
                  && vi.value != undefined 
                  && sub_vi.value != undefined 
                  && vi.value == sub_vi.value) {
                count ++;
              }
            }
            result[key][k][i]['__count'] = count;
          }
          if(vi_first.value != undefined && vi_first.value.label != undefined) {
            var count = 1;
            for (var j = 0; j < value.length; j++) {
              var sub_vi = value[j];
              if(i != j 
                  && vi.value != undefined 
                  && sub_vi.value != undefined 
                  && vi.value.label != undefined 
                  && sub_vi.value.label != undefined 
                  && vi.value.label == sub_vi.value.label) {
                count ++;
              }
            }
            result[key][k][i]['__count'] = count;
          }
        }
      }
      else if (value.constructor == Object) {
        if(value.value != undefined) {
          result[key][k]['__count'] = 1;
        }
      }
    })
  });
  
  result.record_list = Object.keys(pay_record_list);

  return result;
}

async function get_inverse_property(uri, free = true, graph = default_graph) {
  var free_condition = '';
  if (free) {
    free_condition = `azpr:public "Y";`;
  }

  var sql = `
    select distinct ?p ?rlb ?rord
    ${graph_query(graph)}
    where {
      { ?s ?p <${uri}> . }
      UNION
      { 
        ?s ?p [ ?p1 <${uri}> ; ${free_condition}] .
        ?p1 azm:header 1 .
      }
      optional { ?p azm:rlabel ?rlb } .
      optional { ?p azm:order ?rord } .
      filter (!isBlank(?s)) 
    }
  `;

  var order_dict = {};
  var result = {};
  var props = await sync_sparql_cmd(sql);
  for (var i = 0; i < props.length; i++) {
    var p = props[i].p.value;

    sql = `
      select *
      ${graph_query(graph)}
      where {
        { ?s <${p}> <${uri}> . }
        UNION
        { 
          ?s <${p}> [ ?p1 <${uri}> ; ${free_condition}] .
          ?p1 azm:header 1 .
        }
        optional {
          ?s azp:label ?lb
        }
      } limit 10
    `;
    var r = await sync_sparql_cmd(sql);
    var key = `is ${get_name_from_uri(p)} of`;
    if (props[i].rlb) {
      key = props[i].rlb.value;
    }

    if (props[i].rord) {
      order_dict[key] = props[i].rord.value + 100;
    } else {
      order_dict[key] = 100;
    }

    var val = [];
    for (var j = 0; j < r.length; j++) {
      var vj = r[j];
      var ss = vj.s.value;
      if (vj.lb) {
        val.push({
          "uri": ss,
          "label": vj.lb.value
        });
      }
      else {
        val.push(ss);
      }
    }
    if (val.length == 10) {
      val.push('...');
    }
    result[key] = val;
  }
  result['##order##'] = order_dict;
  return result;
}

async function get_similar_property(uri, free = true, graph = default_graph) {

  var sql = `
    select ?s
    ${graph_query(graph)}
    where {
      <${uri}> rdf:type ?cls .
      <${uri}> azp:label ?lb .
      ?s rdf:type ?cls .
      ?s azp:label ?lb .
      filter strstarts(str(?cls), str(azc:))
      filter (?s != <${uri}>)
    } LIMIT 10
  `;

  //console.log(sql);

  var result = [];
  var props = await sync_sparql_cmd(sql);
  //console.log(props);
  var pay_record_list = [];

  for (var i = 0; i < props.length; i++) {
    var val = props[i].s.value;

    var res = await get_1st_property(val, graph);
    var res1 = await get_2nd_property(val, free, graph);
    pay_record_list = pay_record_list.concat(res1.record_list);
    delete res1.record_list;
    var res2 = await get_inverse_property(val, free, graph);
    res = merge_dict(res, res1);
    res = merge_dict(res, res2);
    delete res['##order##'];
    result.push(res);
  }
  if (result.length > 0) {
    return {
      "Similar": result,
      "record_list": pay_record_list
    };
  }
  else {
    return {};
  }

}

function merge_dict(res, res1) {
  Object.keys(res1).forEach(key => {
    if (key == '##order##') {
      var sec_order_dict = res1[key];
      if (res[key] == undefined) {
        res[key] = res1[key];
      }
      else {
        Object.keys(sec_order_dict).forEach(key1 => {
          res[key][key1] = res1[key][key1];
        })
      }
    } else {
      res[key] = res1[key];
    }
  });
  return res;
}

async function search_uri(uri, free = true, graph = default_graph) {

  var res = await get_1st_property(uri, graph);
  var res1 = await get_2nd_property(uri, free, graph);
  var res2 = await get_inverse_property(uri, free, graph);
  var res3 = await get_similar_property(uri, free, graph);
  //console.log(res3);
  let record_list = res1.record_list;
  delete res1['record_list'];
  if (res2.record_list) {
    record_list = record_list.concat(res2.record_list);
    delete res2.record_list;
  }
  if (res3.record_list) {
    record_list = record_list.concat(res3.record_list);
    delete res3.record_list;
  }
  res = merge_dict(res, res1);
  res = merge_dict(res, res2);
  res = merge_dict(res, res3);
  res.record_list = record_list;
  return res;
}

async function search_locality_address(locality, state, country = "AU") {
  var query;
  if (state == "") {
    query = `
      ?s azp:country "${country}" .
      ?s azp:locality "${locality}". 
      `;

  }
  else {
    query = `
      ?s azp:country "${country}" .
      ?s azp:locality "${locality}". 
      ?s azp:region "${state}" .
      `;
  }

  var result = await sync_sparql_query(query);
  return result;
}

async function delete_all_entity(entity) {
  var sql = `
    ${entity} ?p ?o .
    ?o ?pr ?v .
  `
  var context = `
    ${entity} ?p ?o .
    OPTIONAL {
      ?o  ?pr  ?v  .
      FILTER isBlank(?o)
    }
  `;
  return await sync_sparql_delete(sql, context);
}

async function delete_entity_from_resource(entity, resource, graph = default_graph) {
  var old_query = `
    ${entity} ?p ?o .
    ?o ?pr ?v .
  `;
  var context = `
    ?o azpr:resource "${resource}" .
  `;
  return await sync_sparql_delete(old_query, context, graph);
}

async function vote_record(address, record, yes_no = "yes", graph = default_graph) {
  if (yes_no !== "yes" && yes_no !== "no") {
    return false;
  }
  let no_yes = yes_no === "yes" ? "no" : "yes";

  let curDate = new Date();
  curDate = curDate.toISOString();

  try {
    // delete old data which the user(address) added before.
    await sync_sparql_delete(
      `?s azpr:${yes_no} ?o1 . ?o1 ?p ?v .`,
      `
        ?s azpr:${yes_no} ?o1 .
        FILTER (?s = _:${record}) 
        ?o1 azpr:user "${address}" . 
      `,
      graph
    );


    // delete disapproved data if user approve it and vice versa.
    await sync_sparql_delete(
      `?s azpr:${no_yes} ?o1 . ?o1 ?p ?v .`,
      `
        ?s azpr:${no_yes} ?o1 .
        FILTER (?s = _:${record}) 
        ?o1 azpr:user "${address}" . 
      `,
      graph
    );


    var query = `
      ?s azpr:${yes_no} [
        azpr:user "${address}" ;
        azpr:timestamp "${curDate}" 
      ] . 
    `
    var context = `
      ?ss ?pp ?s
      FILTER (?s = _:${record})  
    `
    await sync_sparql_insert(query, context, graph);
  }
  catch (err) {
    console.log(err);
    return false;
  }
  return true;
}

async function check_error(graph = default_graph) {
  let a = await sync_sparql_query(`
    ?s ?p ?o.
    ?o ?p1 ?v1 .
    ?o ?p1 ?v2 .
    filter (?v1 != ?v2)
    filter isBlank(?o)
  `)
  let d = {}
  for (var i = 0; i < a.length; i++) {
    let b = a[i]
    let s = b.s.value
    if (d[s] == undefined) {
      d[s] = 1
    }
  }
  console.log(Object.keys(d))
}

async function delete_record_from_resource(resource, graph = default_graph) {
  let a = await sync_sparql_query(`
      ?s ?p ?o1 .
      ?o1 ?p1 ?o2 .
      ?o1 azpr:resource "${resource}" .
  `, graph)
  console.log(a);
  /*
  let b = await sync_sparql_delete(
    `
      ?s ?p ?o1 .
      ?o1 ?p1 ?o2 .
    `,
    `
      ?s ?p ?o1 .
      ?o1 azpr:resource ?v .
      filter strstarts(str(?v),"${resource}")
    `,
    graph
  );
  console.log(b)*/
}

async function delete_record(record, graph = default_graph) {
  try {
    await sync_sparql_delete(
      `?s azpr:public ?o1`,
      `
        ?s azpr:public ?o1 .
        FILTER (?s = _:${record}) 
      `,
      graph
    );

    var query = `
    ?s azpr:public 'D' . 
    `
    var context = `
      ?ss ?pp ?s
      FILTER (?s = _:${record})  
    `
    await sync_sparql_insert(query, context, graph);
  } catch (err) {
    console.log(err);
    return false;
  }

  return true;
}

async function delete_reputation(graph = default_graph) {
  var del_query = `
    ?s ?p ?o .
    ?o ?op ?ov .
  `
  var context = `
    ?s ?p [ 
      azp:value ?v1 ;
      azpr:resource ?id1;
    ] ;
  
    azp:personalTimestamp [
      azp:value ?t1;
      azpr:resource ?id1;
    ] .
  
    ?s ?p ?o . 
    ?o ?op ?ov .
    ?o azp:value ?v1 ;
       azpr:resource ?id2;
    .
  
    ?s azp:personalTimestamp [
      azp:value ?t2;
      azpr:resource ?id2;
    ] .
  
    filter isBlank(?o)
    filter (?id1 != ?id2)
    filter (?t1 < ?t2)
  `
  var res = await sync_sparql_delete(del_query, context, graph)
  return res
}

async function insert_rdf_record(record, id, timestamp, graph = default_graph) {
  var res = await sync_sparql_insert(record, '', graph);
  if (res.success != true) {
    return [];
  }
  await delete_reputation();

  console.log(`successfully inserted data = ${record}`);
  var query = `
    ?s ?p ?o .
    ?o azpr:resource "${id}" .
    ?o azpr:public "N" .
    ?s azp:personalTimestamp ?o1 .
    ?o1 azp:value "${timestamp}" .
    ?o1 azpr:resource "${id}" .
  `;
  var result = await sync_sparql_query(query);
  console.log(result);
  var records = result.map(e => {
    return e.o.value
  });
  console.log(`records=${records}`);
  return records;
}

async function get_geolocation_1st(entity, graph = default_graph) {
  var query = `
    select ?lat ?lng
    ${graph_query(graph)}
    {
      <${entity}> azp:geoLocation ?o .
      ?o azp:latitude ?lat .
      ?o azp:longitude ?lng .
    } LIMIT 1
  `;
  var result = await sync_sparql_cmd(query);
  return result;
}

async function get_geolocation_2nd(entity, graph = default_graph) {
  var query = `
    select ?lat ?lng
    ${graph_query(graph)}
    {
      <${entity}> azp:locateAt / azp:value / azp:includes / azp:geoLocation ?o .
      ?o azp:latitude ?lat .
      ?o azp:longitude ?lng .
    } LIMIT 1
  `;
  var result = await sync_sparql_cmd(query);
  return result;
}

async function get_geolocation_3rd(entity, graph = default_graph) {
  var query = `
    select ?lat ?lng
    ${graph_query(graph)}
    {
      <${entity}> azp:locateAt / azp:value / ^ azp:includes / azp:geoLocation ?o .
      ?o azp:latitude ?lat .
      ?o azp:longitude ?lng .
    } LIMIT 1
  `;
  result = await sync_sparql_cmd(query);
  return result;
}

async function get_all_blank_node(record_id, graph = default_graph) {
  if (!record_id.startsWith('_:')) {
    record_id = '_:' + record_id
  }
  let sql = `
    ?s ?p ?o1 .
    ?o1 ?p1 ?o .
    FILTER (?o1 = ${record_id})
  `;
  var res = await sync_sparql_query(sql, graph);
  return res;
}

async function get_record_info(record_id, graph = default_graph) {
  console.log('record_id:', record_id)
  if (!record_id.startsWith('_:')) {
    record_id = '_:' + record_id
  }
  let sql = `
    ?s ?p ?o1 .
    ?o1 ?p1 ?o .
    FILTER (?o1 = ${record_id})
    optional {?p azm:label ?plb}
    optional {?p1 azm:label ?p1lb}
    optional {?o1 azpr:public ?pub}
    optional { ?o azp:label ?olb} .
  `;

  //console.log(sql);
  var res = await sync_sparql_query(sql, graph);
  var result = {};
  if (res.length === 0) {
    return result;
  }

  var ri = res[0]
  var uri = ri.s.value;
  var key = ri.plb ? ri.plb.value : get_name_from_uri(ri.p.value);
  result.uri = { uri: uri, label: uri };
  var value = {};

  for (var i = 0; i < res.length; i++) {
    ri = res[i];
    var key1 = ri.p1.value;
    if (!isProperty(key1, "azp")) {
      continue;
    }
    var val = ri.o.value;
    var type = ri.o.type;
    var pub_kind = ri.pub ? ri.pub.value : 'Y';

    if (ri.p1lb) {
      key1 = ri.p1lb.value;
    } else {
      key1 = get_name_from_uri(key1);
    }

    if (type == "uri") {
      var ent = val;
      var val = {};
      val.uri = ent;

      if (ri.olb) {
        val.label = ri.olb.value;
      }
    }

    value[key1] = val;
  }

  result[key] = value;
  return result;
}

async function get_probable_properties(entity, graph = default_graph) {
  if (!entity.startsWith("<")) {
    entity = '<' + entity + '>'
  }

  var query = `
    select distinct ?p ?lb
    ${graph_query(graph)}
    where
    {
      ${entity} rdf:type ?type, owl:NamedIndividual .
      ?s1 rdf:type ?type, owl:NamedIndividual .
      ?s1 ?p ?o
      filter strstarts(str(?type), str(azc:))
      optional { ?p azm:label ?lb } .
      filter strstarts(str(?p), str(azp:))
    }
  `
  console.log(query);
  var result1 = await sync_sparql_cmd(query);

  var query_inv = `
    select distinct ?p ?rlb
    ${graph_query(graph)}
    where
    {
      ${entity} rdf:type ?type, owl:NamedIndividual .
      ?s1 rdf:type ?type, owl:NamedIndividual .
      ?s2 ?p [azp:value ?s1]
      filter strstarts(str(?type), str(azc:))
      optional { ?p azm:label ?rlb } .
      filter strstarts(str(?p), str(azp:))
    }
  `
  var result2 = await sync_sparql_cmd(query_inv);

  var result = result1.concat(result2);
  return result;
}

async function get_uri_candidates(query, graph = default_graph) {
  if (Array.isArray(query)) {
    let item_query = query.map((e, index) => {
      let pn = `p${index}`
      let on = `o${index}`
      let lbn = `l${index}`
      let iq = '';
      if (Array.isArray(e)) {

      } else {
        e = [e]
      }

      iq = `
        ?s ?${pn} [azp:value ?${on}] . 
        filter (!regex(str(?${pn}), "date", "i"))
        optional {?${pn} azm:label ?${lbn}}
      `;

      for (var i = 0; i < e.length; i++) {
        iq += `
          filter regex(str(?${on}), "${e[i]}", "i")
        `
      }
      return iq;
    })
    let cond_query = item_query.join(' ')

    let sparql_query = `
      select *
      ${graph_query(graph)}
      where {
        ${cond_query}
      } limit 20`;
    var result = await sync_sparql_cmd(sparql_query);

    result = result.map(e => {
      let u = e.s.value;
      let matches = []
      for (var i = 0; i < query.length; i++) {
        let pn = `p${i}`;
        let on = `o${i}`;
        let lbn = `l${i}`;
        let p = '';
        if (e[lbn]) {
          p = e[lbn].value;
        } else {
          p = get_abbr_prop_name(e[pn].value);
        }
        v = e[on].value;
        matches.push(`${p}=${v}`)
      }
      let m = matches.join(' ');
      return {
        uri: u,
        match: m
      }
    })
    return result;
  }
  return []
}

async function get_geolocation_4th(entity, graph = default_graph) {
  var query = `
    select ?lat ?lng
    ${graph_query(graph)}
    {
      <${entity}> azp:locateAt / azp:value / azp:geoLocation ?o .
      ?o azp:latitude ?lat .
      ?o azp:longitude ?lng .
    } LIMIT 1
  `;
  result = await sync_sparql_cmd(query);
  return result;
}

async function get_geolocation(entity, graph = default_graph) {
  var result = await get_geolocation_1st(entity, graph);

  if (result.length == 0) {
    result = await get_geolocation_2nd(entity, graph);
  }

  if (result.length == 0) {
    result = await get_geolocation_3rd(entity, graph);
  }

  if (result.length == 0) {
    result = await get_geolocation_4th(entity, graph);
    if (result.length == 0) return [];
  }

  var records = result.map(e => {
    return {
      lat: e.lat.value,
      lng: e.lng.value
    }
  });
  return records;
}

async function rdf_all_list(start = 0, count = 20, graph = default_graph) {
  var query = `
    select ?name
    ${graph_query(graph)}
    {
      ?s azp:legalName [ azp:value ?name ].
      ?s rdf:type azc:Business .
    } ORDER BY ?name OFFSET ${start} LIMIT ${count}
  `;
  result = await sync_sparql_cmd(query);
  var name_list = result.map(v => v.name.value);
  return name_list;
}

async function rdf_all_list_count(graph = default_graph) {
  var query = `
    select (COUNT(*) AS ?count)
    ${graph_query(graph)}
    {
      ?s azp:legalName [ azp:value ?name ].
      ?s rdf:type azc:Business .
    }
  `;
  result = await sync_sparql_cmd(query);
  return parseInt(result[0].count.value);
}

async function get_new_uri(folder, prefix, graph = default_graph) {
  while (true) {
    let id = `<http://www.accziom.com/ontology/entity/${folder}/${prefix}${uuidv4()}>`;
    var query = `
      select ?p ?o
      ${graph_query(graph)}
      where
      {
        ${id} ?p ?o.
      } LIMIT 1
    `;
    result = await sync_sparql_cmd(query);
    if (result.length === 0) return id;
  }
}

module.exports = {
  sparql_login,
  sync_sparql_insert,
  sync_sparql_update,
  sync_sparql_delete,
  sync_sparql_query,
  sync_sparql_cmd,
  sync_sparql_ask,
  search_name,
  search_by_abn,
  search_by_acn,
  search_by_name,
  search_uri,
  search_locality_address,
  delete_all_entity,
  delete_entity_from_resource,
  insert_rdf_record,
  get_geolocation,
  rdf_all_list,
  rdf_all_list_count,
  search_rdf,
  get_new_uri,
  get_record_info,
  get_probable_properties,
  get_uri_candidates,
  vote_record,
  delete_record,
  get_all_blank_node,
  delete_record_from_resource,
  search_entity,
  check_error
};

