const { 
    verification_by_id,
    verification_by_name, 
    get_verification_info 
} = require('./verify');

const {
    gbg_search_from_acn,
    gbg_search_from_abn,
    gbg_search_from_name,
    gbg_insert_data
} = require('./verify_db');

function fillFromVerifyInfo(result) {
    var res = {};
    var root_id = '';
    if (result.hasOwnProperty('rootBusiness')) {
        var root = result.rootBusiness;
        try{
            root_id = root.id;
            res['id'] = root.id;
            res['Entity Name'] = root.name;
            res['Entity Type'] = root.entityType;
        }
        catch(e) {}
        
        try{
            res['Business Status'] = root.businessStatus;
            res['Business Type'] = root.businessType;
            res['Business Subtype'] = root.businessSubtype;
        }
        catch(e) {}
        
        try {
            res['Registered'] = root.foundInRegister;
            res['Verified'] = root.existenceVerified;
        }
        catch(e) {}

        try {
            res['Country'] = root.addresses[0].countryName;
            res['Country Code'] = root.addresses[0].countryCode;
            var addr = root.addresses[0].fullAddress;
            var addr_split = addr.split(',');
            if (addr_split.length == 1) {
                addr_split = addr.split(' ');
            }
            var post = addr_split[addr_split.length - 2].trim();
            var state = addr_split[addr_split.length - 1].trim();
            if (isNumber(state) && !isNumber(post)) {
                var tmp = post;
                post = state;
                state = tmp;
            }
            res['Post Code'] = post;
            res['State'] = state;             
        }
        catch(e) {}

        try {
            var bns = root.businessNumbers;
            bns.forEach( item => {
                res[item.type] = item.number;
            })             
        }
        catch(e) {}
    }

    if (result.hasOwnProperty('relationships')) {
        var rel = result.relationships;
        Object.keys(rel).forEach( key => {
            var entity = rel[key];
            var role = getRole(entity);
            if (role != '') {
                var id = entity['relatedEntity'];
                var details = result.entities[id];
                if (details != null) {
                    var name = '';
                    var entityType = details['entityType'];
                    if (entityType == 'individual') {
                        if (details.hasOwnProperty('givenName')) name = details.givenName;
                        if (details.hasOwnProperty('middleNames')) name = name.trim() + ' ' + details.middleNames;
                        if (details.hasOwnProperty('surname')) name = name.trim() + ', ' + details.surname;
                    }
                    if (entityType == 'business') {
                        if (details.hasOwnProperty('name')) name = details.name;
                    }
                    name = name.trim();
                    if (res.hasOwnProperty(role)) {
                        res[role].push(name);
                    } else {
                        res[role] = [];
                        res[role].push(name);
                    }
                }
                
            }
        })
    }

    if (result.hasOwnProperty('timestamp')) {
        res['timestamp'] = result['timestamp'];
    }
    
    res['report'] = extractReportFromVerifyInfo(result);
    res['details'] = result;
    return res;
}

function number_format(number, decimals, dec_point, thousands_sep) {
    if(decimals){
      number = parseFloat(number).toFixed(decimals);   //转化为Float浮点型 并保留指定小数位
    }
    dec_point = dec_point ? dec_point : '.';
    thousands_sep = thousands_sep ? thousands_sep : ',';
    var source = String(number).split(".");
    source[0] = source[0].replace(new RegExp('(\\d)(?=(\\d{3})+$)','ig'),"$1"+thousands_sep);
    return source.join(dec_point);
}

function extractReportFromVerifyInfo(result) {
    var res = {};
    var currentOrganisationDetials = {};
    var currentAddressDetails = {};

    if (result.hasOwnProperty('rootBusiness')) {
        var root = result.rootBusiness;
        currentOrganisationDetials.Name = root.name;
        var bns = root.businessNumbers;
        bns.forEach( item => {
            currentOrganisationDetials[item.type] = number_format(item.number, 0, '.', ' ');
        })

        if (root.fields) {
            currentOrganisationDetials['Registered in'] = root.fields.organisationState;
            currentOrganisationDetials['Registration date'] = root.fields.registrationDate;
        }

        var entityNames = root.entityNames;
        if (entityNames) {
            for (var i = 0 ; i < entityNames.length; i++) {
                let name = entityNames[i].name;
                if (name == root.name) {
                    currentOrganisationDetials['Name start date'] = entityNames[i].startDate;
                    break;
                }
            }
        }

        currentOrganisationDetials.Status = root.businessStatus;
        currentOrganisationDetials['Company type'] = root.businessSubtype;

        if (root.fields) {
            currentOrganisationDetials.Class = root.fields.organisationClass;
            currentOrganisationDetials.Subclass = root.fields.organisationSubClass;
        }

        if (root.addresses) {
            currentAddressDetails = root.addresses.map(e=>{
                if (e.addressType == "REGISTERED_ADDRESS") {
                    return {
                        'Registered office address': e.fullAddress,
                        'Country': e.countryName
                    }
                } 
                else if (e.addressType == "PRINCIPAL_PLACE_OF_BUSINESS") {
                    return {
                        'Principal place of business': e.fullAddress,
                        'Country': e.countryName
                    }
                } else {
                    let r = {};
                    r[e.addressType] = e.fullAddress;
                    r['Country'] = e.countryName
                }
            })
        }
    }

    var officeholders = {}
    var shareInformation = []

    if (result.hasOwnProperty('relationships')) {
        var rel = result.relationships;
        Object.keys(rel).forEach( key => {
            var entity = rel[key];
            var role = getRole(entity);

            if (role != '' && role != 'Shareholder') {
                var id = entity['relatedEntity'];
                var details = result.entities[id];
                if (details != null) {
                    let detail_info = {};
                    let entityType = details['entityType'];
                    if (entityType == 'individual') {
                        let adr = '';
                        if (details.addresses && details.addresses.length > 0) {
                            adr = details.addresses[0].fullAddress + ', ' + details.addresses[0].countryCode
                        }
                        detail_info = {
                            GivenName: details.givenName,
                            MiddleNames: details.middleNames,
                            Surname: details.surname,
                            Address: adr,
                            Born: details.dob
                        }
                    }
                    if (entityType == 'business') {
                        if (details.hasOwnProperty('name')) {
                            detail_info.Name = details.name;
                        }
                        if (details.businessNumbers && details.businessNumbers.length > 0) {
                            details.businessNumbers.forEach( item => {
                                detail_info[item.type] = number_format(item.number, 0, '.', ' ');
                            })
                        }
                    }

                    if (officeholders[role]) {
                        officeholders[role].push(detail_info);
                    } else {
                        officeholders[role] = [detail_info];
                    }
                }
                
            }
            else if (role == "Shareholder") {
                var id = entity['relatedEntity'];
                var details = result.entities[id];
                if (details != null) {
                    let detail_info = {};
                    var name = '';
                    var entityType = details['entityType'];
                    if (entityType == 'individual') {
                        if (details.hasOwnProperty('givenName')) name = details.givenName;
                        if (details.hasOwnProperty('middleNames')) name = name.trim() + ' ' + details.middleNames;
                        if (details.hasOwnProperty('surname')) name = name.trim() + ', ' + details.surname;
                    }
                    if (entityType == 'business') {
                        if (details.hasOwnProperty('name')) name = details.name;
                    }
                    name = name.trim();
                    detail_info.Name = name;
                    if (entity.fields) {
                        entity.fields.forEach(item=>{
                            detail_info[item.name] = item.value;
                        })
                    }

                    shareInformation.push(detail_info);
                }

            }
        })
    }

    res['Organisation Details'] = {
        'Current Organisation Details': currentOrganisationDetials
    }

    res['Address Details'] = {
        'Current': currentAddressDetails
    }

    res['Officeholders and Other Roles'] = officeholders;

    res['Share Information'] = shareInformation;

    if (result.hasOwnProperty('timestamp')) {
        res['timestamp'] = result['timestamp'];
    }
    
    return res;
}

async function get_verif_from_abn(abn_id) {
    var res = await new Promise((resolve, reject) => {
        verification_by_id(abn_id, "ABN", (successResponse)=>{
            resolve(successResponse);
        })
    });
    
    if (res.hasOwnProperty('error')) {
        return {};
    }
    
    res_id = JSON.parse(res);
    return res_id;
}

async function get_verif_from_acn(acn_id) {
    var res = await new Promise((resolve, reject) => {
        verification_by_id(acn_id, "ACN", (successResponse)=>{
            resolve(successResponse);
        })
    });
    
    if (res.hasOwnProperty('error')) {
        return {};
    }
    
    res_id = JSON.parse(res);
    return res_id;
}

async function get_verif_from_name(name, type, subtype, id) {
    var bt = type;

    var res = await new Promise((resolve, reject) => {
        verification_by_name(name, bt, subtype, id, (successResponse)=>{
            resolve(successResponse);
        })
    });
    
    if (res.hasOwnProperty('error')) {
        return {};
    }
    
    res_id = JSON.parse(res);
    return res_id;    

}



function isNumber(query) {
    for (var i = 0; i < query.length; i++) {
        if (query[i] <'0' || query[i] > '9') {
            return false;
        }
    }
    return true;
}

function getRole(item) {
    if (item.hasOwnProperty('fields')) {
        var f = item.fields;

        for (var i = 0; i < f.length; i++) {
            var fi = f[i];
            if (fi['name'] == 'role') {
                return fi['value'];
            }
        }
    }

    if (item.hasOwnProperty('type')){
        if (item.type == 'Shareholder') {
            return item.type;
        }
    }
    return '';
}

function get_feature(data) {
    var abn = '';
    var acn = '';
    var name = '';
    if (!data.hasOwnProperty('rootBusiness')) return [abn, acn, name];
    var root = data.rootBusiness;
    if (root.hasOwnProperty('entityNames')) {
        name = root.entityNames[0].name;
    }
    if (root.hasOwnProperty('businessNumbers')) {
        var bn = root.businessNumbers;
        for (var i = 0; i < bn.length; i++) {
            var bi = bn[i];
            if (bi.type.toLowerCase() == 'acn') {
                acn = bi.number;
            }
            if (bi.type.toLowerCase() == 'abn') {
                abn = bi.number;
            }
        }
    }
    return [abn, acn, name];
}

/*
  [POST] Get GBG verification data
  @method
  @param {string} query - acn id, abn id or legal entity name
  @param {string} seed - data for verifying pay of account
  @param {string} verification - data for verifying pay of account
  @returns - data with dictionary format
*/
async function verify_query(req, res, free_mode=false) {
    //console.log(JSON.stringify(req.body))
    var query = req.query || '';
    var type = req.type || '';
    var subtype = req.subtype || '';
    var id = req.id || '';
    query = query.trim();
    var tt = "name";

    if (isNumber(query)){
        if (query.length==11) {
            tt = 'abn';
        }
        else if (query.length==9) {
            tt = 'acn';
        }
    }

    tt = tt.toLowerCase();
    var resid;

    // verify from our db
    if (req.test===true) {
        var mongo_res;
        if (tt == 'abn') {
            mongo_res = await gbg_search_from_abn(query);    
        }

        if (tt == 'acn') {
            console.log(query);
            mongo_res = await gbg_search_from_acn(query);
        }

        if (tt == 'name') {
            mongo_res = await gbg_search_from_name(query);
        }

        if (mongo_res) {
            var vinfo = mongo_res['json'];
            var result = JSON.parse(vinfo);
            result['timestamp'] = mongo_res['timestamp'];
            res.json(fillFromVerifyInfo(result));    
            return;
        }
    }
    
    
    // verify from gbg server
    if (tt == 'abn') {
        //console.log('abn=', query);
        resid = await get_verif_from_abn(query);
    }
    else if (tt == 'acn') {
        //console.log('acn=', query);
        resid = await get_verif_from_acn(query);
        console.log(resid);
    }
    else {
        //console.log('name=', query);
        resid = await get_verif_from_name(query, type, subtype, id);
    }

    if (resid.hasOwnProperty('error')) {
        res.json(resid);
        return;
    }

    var res_id = resid;
    
    if (!res_id.hasOwnProperty('verificationId')) {
        res.json({});
        return;
    }

    var vid = res_id['verificationId'];
    var vinfo = await new Promise((resolve, reject) => {
        get_verification_info(vid, (successResponse)=>{
            resolve(successResponse);
        });
    });

    console.log(vinfo);
    var result = JSON.parse(vinfo);
    var res_dict = fillFromVerifyInfo(result);
    var abn = res_dict['ABN'];
    var acn = res_dict['ACN'];
    var name = res_dict['Entity Name'];
    gbg_insert_data(abn, acn, name, vinfo);
    
    res.json(res_dict);
}

async function get_verif_info(abn_id, acn_id) {
    var res = {}
    if (acn_id != '') {
        res = await new Promise((resolve, reject) => {
            verification_by_id(acn_id, "ACN", (successResponse)=>{
                resolve(successResponse);
            })
        });
    }
    
    if (res.hasOwnProperty('error') || Object.keys(res).length == 0) {
        if (abn_id == '') {
            verify_suc = 1;
            return {};
        }

        var res = await new Promise((resolve, reject) => {
            verification_by_id(abn_id, "ABN", (successResponse)=>{
                resolve(successResponse);
            });
        });
        
        if (res.hasOwnProperty('error')) {
            return {};
        }
    }
    
    res_id = JSON.parse(res);
    
    if (!res_id.hasOwnProperty('verificationId')) {
        return {};
    }

    var vid = res_id['verificationId'];
    var vinfo = await new Promise((resolve, reject) => {
        get_verification_info(vid, (successResponse)=>{
            resolve(successResponse);
        });
    });
    
    return JSON.parse(vinfo);
}

module.exports = {verify_query};