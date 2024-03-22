const soapClient = require('soap');
const date_calc = require('date-and-time');
const {xml2json} = require('xml-js');

const {
    ABN_GUID,
    urlABN,
    UPDATE_CYCLE
} = require('./config');

const { get_locality_from_zipcode } = require('./zipcode');


module.exports = {
    get_abn_info,
    searchName,
    searchABN,
    search_abn
};

const {
    local_abn_info_from_abn,
    local_abn_info_from_acn,
    local_abn_info_from_name,
    save_abn_to_mongodb,
    insert_rdf
} = require('./manage/update_abn');
const { calc_jaccard_sim } = require('./jaccard');
const { default: axios } = require('axios');

function JSONSimplify(data) {
    let x = data.elements
    if (!x) {
        console.log(data)
        return '';
    }
    if (x.length == 1 && x[0].type == "text") {
        return x[0].text;
    }
    let res = {};
    x.forEach(item=>{
        let type = item.type;
        if (type == "element") {
            let name = item.name;
            let val = JSONSimplify(item);
            if (res[name]) {
                if (Array.isArray(res[name])) {
                    res[name].push(val)
                } else {
                    res[name] = [res[name], val]
                }
            } else {
                res[name] = JSONSimplify(item);
            }
        }    
    })
    return res;    
}

function convertToJSON(xmldata) {
    console.log(xmldata);
    let x = xml2json(xmldata);
    x = JSON.parse(x);
    console.log(x);
    x = JSONSimplify(x);
    console.log(x);
    return x
}

function convert_array(data) {
    let array_field=[
        'entityStatus',
        'businessName',
        'mainTradingName',
        'otherTradingName',
        'ABN',
        'goodsAndServicesTax',
        'mainBusinessPhysicalAddress'
    ]
    array_field.forEach(item=>{
        if (data[item] && !Array.isArray(data[item])) {
            data[item] = [data[item]];
        }
    })
    
    return data
}

function searchABN(abn, callback_fn) {
	var args = {
		searchString: abn,
		includeHistoricalDetails: 'N',
		authenticationGuid: ABN_GUID
	};

	console.log("SEARCH ABN : " + abn);
    axios.get(urlABN, {
        params: args
    })
    .then(response=>{
        result = response.data;
        if (result === undefined) {
            console.log('searchABN failed.');
            let error_res = {};
            error_res['error'] = '[Error Code 2] Failed to connect to ABN server. Please try again later.';
            callback_fn(error_res);    
            return;
        }
        result = convertToJSON(result)
        console.log(result);
        if (result.hasOwnProperty('ABRPayloadSearchResults') == false) {
            console.log('searchABN failed.');
            let error_res = {};
            error_res['error'] = '[Error Code 3] Failed to connect to ABN server. Please try again later.';
            callback_fn(error_res);    
            return;
        }
        if ('businessEntity202001' in result.ABRPayloadSearchResults.response)
        {
            let response = result.ABRPayloadSearchResults.response.businessEntity202001;
            response = convert_array(response);
            callback_fn(response);
        }
        else
        {
            let error_res = {};
            error_res['error'] = 'No Search Result';
            callback_fn(error_res);
            return;
        }
    })
    return;
/*
    let res;
	soapClient.createClient(urlABN, function(err, client){
        if (err) {
            let error_res = {};
            error_res['error'] = 'ABR api error:' + JSON.stringify(err);
            callback_fn(error_res);
            return;
        }
        if (client.hasOwnProperty('SearchByABNv202001') == false) {
            console.log('searchABN failed.');
            let error_res = {};
            error_res['error'] = '[Error Code 1] Failed to connect to ABN server. Please try again later.';
            callback_fn(error_res);
            return;
        }
		client.SearchByABNv202001(args, function(err, result){
            if (result === undefined) {
                console.log('searchABN failed.');
                let error_res = {};
                error_res['error'] = '[Error Code 2] Failed to connect to ABN server. Please try again later.';
                callback_fn(error_res);    
                return;
            }
            if (result.hasOwnProperty('ABRPayloadSearchResults') == false) {
                console.log('searchABN failed.');
                let error_res = {};
                error_res['error'] = '[Error Code 3] Failed to connect to ABN server. Please try again later.';
                callback_fn(error_res);    
                return;
            }
            if ('businessEntity202001' in result.ABRPayloadSearchResults.response)
			{
				const response = result.ABRPayloadSearchResults.response.businessEntity202001;
                	callback_fn(response);
			}
			else
			{
				let error_res = {};
                error_res['error'] = 'No Search Result';
                callback_fn(error_res);
                return;
			}
		});
	});
    return res;
    */
}

function fillFromABNINfo(info, abn_info) {
    if (abn_info.hasOwnProperty('entityStatus')) {
        info['Entity Status Code'] = 'Inactive';
        if (Array.isArray(abn_info.entityStatus)) {
            abn_info.entityStatus.forEach(item => {
                if (item.entityStatusCode.localeCompare("Active")===0) {
                    info['Entity Status Code'] = 'Active';
                }
            })
        } else {
            if (abn_info.entityStatus.entityStatusCode.localeCompare("Active")===0) {
                info['Entity Status Code'] = 'Active';
            }
        }

    }
    if (abn_info.hasOwnProperty('ASICNumber')) {
        const asicNumber = abn_info.ASICNumber;
        if (asicNumber != '') {
            info['ASIC Number'] = asicNumber;
        }                    
    }
    if (abn_info.hasOwnProperty('entityType')) {
        info['Entity Type'] = abn_info.entityType.entityTypeCode;
        info['Entity Description'] = abn_info.entityType.entityDescription;
    }
    if (abn_info.hasOwnProperty('goodsAndServicesTax')){
        info['Goods And Services Tax'] = abn_info.goodsAndServicesTax[0].effectiveFrom;
    }

    if (abn_info.hasOwnProperty('mainBusinessPhysicalAddress')) {
        info['State'] = abn_info.mainBusinessPhysicalAddress[0].stateCode;
        const zipcode = abn_info.mainBusinessPhysicalAddress[0].postcode;
        info['Post Code'] = zipcode;
        let loc = get_locality_from_zipcode(zipcode);
        if (loc !== '') info['Probable Locality'] = loc;
    }
    
    if (abn_info.hasOwnProperty('mainName')) {
        info['Entity Name'] = abn_info.mainName.organisationName;
    }
    else if (abn_info.hasOwnProperty('legalName')) {
        let legalName = abn_info.legalName;
        info['Entity Name'] = legalName.familyName + ', ' + legalName.givenName;
        if (legalName.hasOwnProperty('otherGivenName')) {
            info['Entity Name'] += ' ' + legalName.otherGivenName;
        }
    }
    
    if (abn_info.hasOwnProperty('businessName')) {
        name_list = []
        if (!Array.isArray(abn_info.businessName)) {
            abn_info.businessName = [abn_info.businessName]
        }
        abn_info.businessName.forEach(item=>{
            name_list.push(item.organisationName);
        });
        info['Business Name'] = name_list.join(';');
    }
    if (abn_info.hasOwnProperty('mainTradingName')){
        name_list = []
        abn_info.mainTradingName.forEach(item=>{
            name_list.push(item.organisationName);
        });
        var total_name = name_list.join(';');
        info['Trading Name'] = total_name;

        if (abn_info.hasOwnProperty('otherTradingName')){
            name_list = [total_name];
            abn_info.mainTradingName.forEach(item=>{
                name_list.push(item.organisationName);
            });
            info['Trading Name'] = name_list.join(';');
        }
    }
}


/**
  Returns a list of pair of company name and its abn id to be similar to query. 
  If no founded, returns empty list.
  @method
  @param {name} string - The name of the company to search for. 
  @param {score} value - The threshold value of similarity between query and result.
  @returns {Array} Returns a list of pair of company name and its abn id to similar to query.
  @example searchName('999', score=100)
  @example returns: [["NINE 9 NINE PTY LTD","90621805132"], ["9NINE9 PTY LTD","32627140363"]]
*/
function searchName(name, score, callback_fn) {

    const query = queryRegularify(name);
    
    var args = {
		name: query,
        postcode: '',
        legalName: '',
        tradingName: '',
        businessName: '',
        activeABNsOnly: 'Y',
        NSW: 'Y',
        SA: 'Y',
        ACT: 'Y',
        VIC: 'Y',
        TAS: 'Y',
        QLD: 'Y',
        NT: 'Y',
        searchWidth:'',
        minimumScore: '',
        maxSearchResults: '',
        WA: 'Y',
		authenticationGuid: ABN_GUID
	};

    axios.get('https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByNameAdvancedSimpleProtocol2017', {
        params: args
    })
    .then(response=>{
        result = response.data;
        if (result === undefined) {
            console.log('ABN server connection failed.');
            callback_fn([]);
            return;
        }
        result = convertToJSON(result);
        if (result.hasOwnProperty('ABRPayloadSearchResults') == false) {
            console.log('ABN search failed 3.');
            callback_fn([]);
            return;
        }
        abn_list = [];

        if ('searchResultsList' in result.ABRPayloadSearchResults.response)
        {
            const response = result.ABRPayloadSearchResults.response.searchResultsList;
            let abn_id = -1;
            if (!Array.isArray(response.searchResultsRecord)) {
                response.searchResultsRecord = [response.searchResultsRecord];
            }
            response.searchResultsRecord.forEach(function(item){
                if (!Array.isArray(item.ABN)) {
                    item.ABN = [item.ABN]
                }
                item.ABN.forEach(function(abn){
                    if (abn.identifierStatus.localeCompare("Active")===0){
                        abn_id = abn.identifierValue;
                        //console.debug(`abn id=${abn_id}`)
                        
                    }
                })

                if (abn_id >= 0) {
                    let query_name = ''
                    console.debug(JSON.stringify(item));
                    let s = 0;
                    query_type = '';
                    var mainName = get_name(item, 'mainName', score);
                    if (mainName !== '') {
                        query_name = mainName;
                        query_type = 'Entity Name';
                        if (item.mainName.hasOwnProperty('score')) {
                            s = item.mainName.score;
                        }
                    }
                    if (mainName == '' && item.hasOwnProperty('legalName')) {
                        if (item.legalName.hasOwnProperty('fullName')){
                            mainName = item.legalName.fullName;
                            query_name = mainName;
                            query_type = 'Entity Name';
                            s = item.legalName.score;
                        }
                    }
                    //console.debug(`mainName=${mainName}`);
                    const businessName = get_name(item, 'businessName', score);
                    //console.debug(`businessName=${businessName}`);
                    const mainTradingName = get_name(item, 'mainTradingName', score);
                    //console.debug(`mainTradingName=${mainTradingName}`);
                    if (businessName !== '') {
                        if (item.businessName.hasOwnProperty('score')) {
                            if (item.businessName.score > s) {
                                s = item.businessName.score;
                                query_name = businessName;
                                query_type = 'Business Name';
                            }
                        }
                    }
                    if (mainTradingName !== '') {
                        if (item.mainTradingName.hasOwnProperty('score')){
                            if (item.mainTradingName.score > s) {
                                s = item.mainTradingName.score;
                                query_name = mainTradingName;
                                query_type = 'Trading Name';
                            }
                        }
                    }
                    if (query_name !== '') {
                        //console.debug(`added: name=${name} abn_id=${abn_id}`);
                        s = calc_jaccard_sim(query_name, query);
                        abn_list.push([s, query_name, abn_id, query_type]);
                        //if (is_in_set(abn_id, abn_list) == false) {
                            //abn_list.push(abn_id);
                        //}
                        //console.debug(`abn_list.length=${abn_list.length}`);
                    }
                }
            });
        }
        done = true;
        if (abn_list.length == 0) {
            console.log('not found.');
            callback_fn([]);
            return;
        }
        callback_fn(abn_list);
    });

    /*
    soapClient.createClient(urlABN, function(err, client){
        
        if (client === undefined) {
            console.log('ABN search failed 1 .')
            callback_fn([]);
            return;
        }

        if (client.hasOwnProperty('ABRSearchByNameAdvancedSimpleProtocol2017') == false) {
            console.log('ABN search failed 2.')
            callback_fn([]);
            return;
        }
        client.ABRSearchByNameAdvancedSimpleProtocol2017(args, function(err, result){
            
        });
    });
    */
}

async function search_abn(params) {
    abn_list = await new Promise(resolve=>searchName(params.query, 0, result=>resolve(result)));
    return abn_list; 
}

async function get_abn_info(abn_id, type) {
    var curDate = new Date();
    
    var res;
    if (type == 'id') {
        res = await local_abn_info_from_abn(abn_id);
    }
    else {
        res = await local_abn_info_from_name(abn_id);
    }
    //console.log(res);
    if (res) {
        var lastDate = new Date(res.recordLastConfirmedDate);
        const value = date_calc.subtract(curDate, lastDate);
        //console.log(`past days=${value.toDays()}`);
        if (value.toDays() < UPDATE_CYCLE) {
            //console.log('find old version.');
            var abn_info;
            try {
                abn_info = JSON.parse(res.data);
                var info = {};
                info.ABN = res.abn;
                fillFromABNINfo(info, abn_info);
                info.recordLastConfirmedDate = lastDate;
                insert_rdf(info);
                return info;
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    res = await new Promise((resolve, reject) => {
        searchABN(abn_id, abn_info => {
            //console.log(abn_info);
            let info = {};
            if (abn_info.hasOwnProperty('error')) {
                info['error'] = abn_info.error;
                resolve(info);
                return;
            }
            info = {};
            info['ABN'] = abn_id;
        
            abn_info.recordLastConfirmedDate = curDate;
            fillFromABNINfo(info, abn_info);
            info.recordLastConfirmedDate = curDate;
            resolve(info);
            save_abn_to_mongodb(abn_info);
        });
    });
    return res;
}

function get_name(data, field, score=0) {
    const cmd_str = `data.hasOwnProperty('${field}') && data.${field}.hasOwnProperty('isCurrentIndicator') && (data.${field}.isCurrentIndicator=='Y')`;
    const exist = eval(cmd_str);
    if (exist) {
        //console.debug('found1.')
        if (score > 0)
        {
            const score_cond_str = `data.${field}.hasOwnProperty('score')`;
            const score_exist = eval(score_cond_str);
            if (!score_exist) {
                return '';
            }

            //console.debug('found2.');
            const s = eval(`data.${field}.score`);
            //console.debug(`score=${s}`);
            if (s < score)
                return '';
        }
        try {
            return eval(`data.${field}.organisationName`);
        }
        catch (err) {
            console.log(err);
            return '';
        }
    }
    
    return '';
}

function queryRegularify(query) {
	if (query.includes(" (Trading Name)"))
		query = query.substring(0, query.length - 15);
	
	if (query.includes(" (Other Name)"))
		query = query.substring(0, query.length - 13);

	if (query.includes(" (Business Name)"))
		query = query.substring(0, query.length - 16);

	if (query.includes(" (Entity Name)"))
		query = query.substring(0, query.length - 14);

	query = query.trim();
	return query;
}

