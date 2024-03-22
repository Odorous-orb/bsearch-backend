function refine(name) {
    var res = name.replace(/[.]/g, '');
    res = res.replace(/ and /g, ' & ');
    return res.toLowerCase();
}

function str_to_quoted_string(val) {
    var nn = val.replace(/[\\]/g, '\\\\');
    nn = nn.replace(/["]/g, '\\"');
    return nn;
}

function character(c){
    if (c >= 'A' && c <= 'Z') return true;
    if (c >= 'a' && c <= 'z') return true;
    if (c >= '0' && c <= '9') return true;
    if (c == '_') return true;
    return false;
}
    
function conv_to_uri(val){
    var vv = val.split('');
    for (var i = 0; i < vv.length; i++) {
        if (!character(vv[i])){
            vv[i] = '-';
        }
    }
    return vv.join('');
}

const default_graph = '';


let stopwords = [
    "co",
    "company",
    "corporation",
    "ltd",
    "pty",
    "limited"
];

function QueryVar(str, keyfields) {
    let q = str.replace( /\r\n/g, '').replace(/^\s+|\s+$/, '').replace(/[^a-z\s]+/gi, '').replace(/\s+$/, '');

    let parts = q.split(/\s/);
    let terms = [];
    parts.forEach(part => {
        if(stopwords.indexOf(part) === -1) {
            terms.push(part);
        }
    });
    
    if (terms.length === 0) {
        return '';
    }
    let query = {'$or': []};
    keyfields.forEach(key=>{
        let query1 = {'$and': []};
        terms.forEach(term => {
           let queryFrag = {};
           queryFrag[key] = {'$regex': term, '$options': 'i'};
           query1['$and'].push(queryFrag);
        });
        query['$or'].push(query1);
    })
    
    return query;
};

async function mongo_search_by_name(db_collection, name, keyfields, limit_cnt = 20) {
    let searchQuery = QueryVar(name, keyfields);
    if (searchQuery === '') return [];
    console.log(JSON.stringify(searchQuery))
    var cursor = await db_collection.find(searchQuery).limit(limit_cnt);

    items = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        items.push(doc);
    }
    console.log(JSON.stringify(items))
    return items;
}

module.exports = {
    refine,
    conv_to_uri,
    str_to_quoted_string,
    default_graph,
    mongo_search_by_name
}