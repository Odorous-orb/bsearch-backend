const request = require('request');
const { 
    tpb_search_from_abn, 
    asx_search_by_name
} = require('./api_asx');

const { 
    acn_search_from_abn, 
    acn_search_from_acn, 
    acn_search_by_name,
} = require('./api_acn');

const {get_gics_name_to_data} = require('./gics');

const {
    get_bing_info
} = require('./api_bing')

const {
    get_abn_info,
    searchName
} = require('./api_abn');

const {
    get_anzic_code
} = require('./api_anziccode');

const {
    calc_jaccard_sim
} = require('./jaccard');


/*
    `entity name
    `legal name
    `trading name
    `entity type: Trust/ Sole trader/ Partnership/ Company
    note
    `website
    `primary/alternative email
    `Primary Phone
    `Mobile Phone
    `Fax
    DDI

    Physical Address
    `City
    `Region
    `Postal Code
    Country

    `ABN
    `ACN
*/

function get_query_names(info) {
    let query_names = [];
    if ('Entity Name' in info) {
        query_names.push(info['Entity Name']);
    }
    if ('Business Name' in info) {
        info['Business Name'].split(';').forEach(item=>{
            query_names.push(item);
        });
    }
    if ('Trading Name' in info) {
        info['Trading Name'].split(';').forEach(item=>{
            query_names.push(item)
        });
    }
    return query_names;
}

function refine_snippet(item){
    item = item.replace(/[<]b[>]/g, '');
    item = item.replace(/[<][/]b[>]/g, '');
    let split_symbol = ':;"/.,?<>[]{}()*&^%$#@!`~-+=_' + "'";
    for (var i = 0; i < split_symbol.length; i++) {
        var c = split_symbol.charAt(i);
        let word_list = item.split(c);
        item = word_list.join(' ');
    }
    return item;
}
function get_business_names(info, bing_res, asx_data) {
    let query_names = [];
    if (info.hasOwnProperty('Business Name')) {
        info['Business Name'].split(';').forEach(item=>{
            query_names.push(item);
        });
    }
    if (info.hasOwnProperty('Trading Name')) {
        info['Trading Name'].split(';').forEach(item=>{
            query_names.push(item)
        });
    }
    if (query_names.length == 0) {
        if (asx_data!=null) {
            try {
                var val = asx_data['GICs industry group'];
                var gics = get_gics_name_to_data();
                item = gics['2'][val];
                query_names.push(item.label);
                var children = item['child'];
                children.forEach( child=>{
                    var child_item = gics['3'][child];
                    query_names.push(child_item.label);
                    var gs = child_item['child'];
                    gs.forEach( gsi => {
                        var gs_item = gics['4'][gsi];
                        query_names.push(child_item.label);
                    })
                });
                return query_names;
                
            }
            catch(err) {}
            
        }
        bing_res.forEach(bingItem=>{
            if (bingItem['snippet']!=undefined) {
                snippet_list = bingItem['snippet'];
                snippet_list.forEach(item=>{
                    refined_item = refine_snippet(item);
                    query_names.push(refined_item);
                });
            }
        });
    }

    if (query_names.length == 0) {
        if (info.hasOwnProperty('Entity Name')) {
            query_names.push(info['Entity Name']);
        }
        if (info.hasOwnProperty('Company Name')) {
            query_names.push(info['Company Name']);
        }
    }
    return query_names;
}

function getEntityName(result) {
    if (result.hasOwnProperty('abn')) {
        var abn = result.abn;
        if (abn.hasOwnProperty('Entity Name')) {
            return abn['Entity Name'];
        }
    }

    if (result.hasOwnProperty('acn')) {
        var acn = result.acn;
        if (acn.hasOwnProperty('Company Name')) {
            return acn['Company Name'];
        }
    }

    return;
}

async function get_abn_profile(abn_id, callback_fn) {
    var abn_info = await get_abn_info(abn_id);
    callback_fn(abn_info);
}


async function get_profile_by_abn(abn_id, callback_fn) {
    var info = {};
    var abn_info = await get_abn_info(abn_id);
    if (abn_info.hasOwnProperty('error')) {
        callback_fn(abn_info);
        return;
    }
    info['abn'] = abn_info;
        
    let query_names = get_query_names(info['abn']);

    info['bing'] = await get_bing_info(query_names, info['abn']['Probable Locality']);

    let tpb_data = tpb_search_from_abn(abn_id);
    info['tpb'] = tpb_data;
    
    let acn_data = await acn_search_from_abn(abn_id);
    let acn_id = '';
    if (acn_data != null) {
        info['acn'] = acn_data;
        if (acn_data.hasOwnProperty('ACN')) acn_id = acn_data.ACN;
    }

    let name = getEntityName(info);
    let asx_data = await asx_search_by_name(name);
    if (asx_data != null) {
        delete asx_data['key'];
        info['asx'] = asx_data;
    }
    
    query_names = get_business_names(info['abn'], bing_res, asx_data);
    info['anzic'] = await get_anzic_code(query_names);
    
    //var verify_info = await get_verif_info(abn_id, acn_id);
    //info['verify'] = fillFromVerifyInfo(verify_info);

    callback_fn(info);
    //console.debug(`final info=${JSON.stringify(info)}`);
}

function get_query_names_from_acndata(acn_data){
    let query = [];
    const company_name = acn_data['Company Name'];
    if (company_name !== undefined) {
        query.push(company_name);
    }
    const current_name = acn_data['Current Name'];
    if (current_name !== undefined) {
        query.push(current_name);
    }
    return query;
}

async function get_profile_by_acn(acn_id, callback_fn) {
    let acn_data = await acn_search_from_acn(acn_id);
    if (acn_data === null) {
        ret = {}
        callback_fn(ret);
        return;
    }

    let abn_id = acn_data['ABN']
    if (abn_id !== undefined) {
        if (abn_id != '0') {
            get_profile_by_abn(abn_id, callback_fn)
            return;
        }
    }

    let info = {};
    info['acn'] = acn_data;

    let query_names = get_query_names_from_acndata(acn_data);
    info['bing'] = get_bing_info(query_names);

    let name = getEntityName(info);
    let asx_data = await asx_search_by_name(name);
    if (asx_data != null) {
        delete asx_data['key'];
        info['asx'] = asx_data;
    }
    
    query_names = get_business_names(info['acn'], bing_res, asx_data);
    info['anzic'] = await get_anzic_code(query_names);
    
    //let code_list = await search_anzic_code(query_names);
    //fillFromAnzicCode(info, code_list);
    
    //var verify_info = await get_verif_info(abn_id, acn_id);
    //info['verify'] = fillFromVerifyInfo(verify_info);
    callback_fn(info);
}

async function get_candidates(name, callback_fn) {

    searchName(name, 0, async function (abn_list) {
        // [s, query_name, abn_id, query_type]
        const res = await acn_search_by_name(name);
        //console.log(res);
        res.forEach(item => {
            var comp_name = item['Company Name'];
            var curr_name = item['Current Name'];
            //console.log(`comp_name=${comp_name}`)
            //console.log(`curr_name=${curr_name}`)
            var sim1 = calc_jaccard_sim(comp_name, name);
            var sim2 = calc_jaccard_sim(curr_name, name);
            var type = 'Company Name';
            if (sim2 > sim1) {
                comp_name = curr_name;
                sim1 = sim2;
                type = 'Current Name';
            }
            abn_list.push([sim1, comp_name, item['ACN'], type]);
        })
        callback_fn(abn_list);
    });
}

module.exports = { 
    get_profile_by_abn, 
    get_profile_by_acn, 
    get_candidates,
};