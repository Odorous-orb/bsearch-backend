const request = require('request');
const {
    get_similarity
} = require('./jaccard');

const {
    BING_API_KEY,
    CLIENT_ID_COOKIE,
    BING_NLP_API_KEY
} = require('./config');

function incorporate_bingres(info, sub_info_list) {
    let loc = [];
    let phone = [];
    let email = [];
    let url = [];
    let snippet = [];
    sub_info_list.forEach(tmp=>{
        if (('locality' in tmp) && (tmp['locality'].length > 0)) {
            tmp['locality'].forEach(item=>{
                if (is_in_set(item, loc)==false) {
                    loc.push(item);
                } 
            });
        }
        if (('phone' in tmp) && (tmp['phone'].length > 0)) {
            tmp['phone'].forEach(item=>{
                if (is_in_set(item, phone)==false) {
                    phone.push(item);
                } 
            });
        }
        if (('email' in tmp) && (tmp['email'].length > 0)) {
            tmp['email'].forEach(item=>{
                if (is_in_set(item, email)==false) {
                    email.push(item);
                } 
            });            
        }
        if (('url' in tmp) && (tmp['url'].length > 0)) {
            tmp['url'].forEach(item=>{
                if (is_in_set(item, url)==false) {
                    url.push(item);
                } 
            });

        }
        if (('snippet' in tmp) && (tmp['snippet'].length > 0)) {
            snippet.push(tmp['snippet']);
        }
    });

    //info['bing'] = {};
    //var info1 = info['bing'];
    if (loc.length>0) info['Locality'] = loc.join(';');
    if (phone.length>0) info['Phone'] = phone.join(';');
    if (email.length>0) info['Email'] = email.join(';');
    if (url.length>0) info['Url'] = url.join(';');
    if (snippet.length>0) info['Snippet'] = snippet.join('<br>');
}



async function searchBing(query, info, check_item, callback_fn) {
    keyword = query;
    // console.log(keyword)

    var options = [];
    options.push("mkt=en-AU");
    options.push("SafeSearch=strict");
    var what = ["webpages"];
    if (what.length) {
        options.push("promote=" + what.join(","));
        options.push("answerCount=9");
    }
    options.push("count=10");
    options.push("offset=0");
    options.push("textDecorations=true");
    options.push("textFormat=HTML");
    
    var option_str = options.join("&");

    var endpoint = "https://api.bing.microsoft.com/v7.0/search";
    var queryurl = endpoint + "?q=" + encodeURIComponent(query) + "&" + option_str;
    // console.debug(queryurl);
	request({uri: queryurl, method: 'GET', headers: {"Ocp-Apim-Subscription-Key": BING_API_KEY, "Accept": "application/json", "X-MSEdge-ClientID": CLIENT_ID_COOKIE}}, (err, ret, body)=> {
        // console.log("HERE", body)
        var jsobj = {};
        // Try to parse the JSON results.
        try {
            if (body.length) jsobj = JSON.parse(body);
        } catch(e) {
            //res.send("Invalid JSON response");
            info[check_item] += 1
            console.debug('Bing search: Invalid JSON response')
            return;
        }

        delete jsobj['_type'];
        delete jsobj['queryContext'];
        delete jsobj['relatedSearches'];
        delete jsobj['rankingResponse'];
        delete jsobj['videos'];
        delete jsobj['entities'];
		delete jsobj['images'];

        callback_fn(info, check_item, jsobj);
        /*
		
		var reqbody = {"documents" : []};

		jsobj.webPages.value.forEach(function(item, idx){
			var tmp = {};
			tmp.language = "en";
			tmp.id = idx + 1;
			tmp.text = item.name + " " + item.snippet;
			reqbody.documents.push(tmp);
			
		});

        var endpoint1 = "https://australiaeast.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases";
		
		request.post({uri: endpoint1, body: JSON.stringify(reqbody), headers: {"Ocp-Apim-Subscription-Key": BING_NLP_API_KEY, "Accept": "application/json", "X-MSEdge-ClientID": CLIENT_ID_COOKIE}}, (err1, ret1, body1)=> {
			try {
				if (body1.length) jsobj1 = JSON.parse(body1);
			} catch (e) {
				//res.send("Invalid JSON response");
				return;
			}

			try {
				jsobj.webPages.value.forEach(function(item, idx){
					item.keyPhrases = jsobj1.documents[idx].keyPhrases.join(', ');
					item.nscore = getNameScore(item.name, keyword);
					item.name = replaceWithHints(item.name, keyword);
					item.estimatedPhysicalAddresses = [];
	
					jsobj1.documents[idx].keyPhrases.forEach(item1 => {
	
						splits = item1.split(' ');
	
						for (var i = 0; i < splits.length; i++)
						{
							tmp = binarySearchByLocality(postal_codes_by_locality, splits[i].toUpperCase().trim());
	
							if (tmp != null)
							{
								item.estimatedPhysicalAddresses.push(tmp);
							}
						}
					});
				});
	
				for (i = 0; i < jsobj.webPages.value.length-1; i++)
				{
					for (j = i+1; j < jsobj.webPages.value.length; j++)
					{
						if (jsobj.webPages.value[i].nscore < jsobj.webPages.value[j].nscore)
						{
							tmp = jsobj.webPages.value[i];
							jsobj.webPages.value[i] = jsobj.webPages.value[j];
							jsobj.webPages.value[j] = tmp;
						}
					}
				}
                
				bingret.bing = jsobj;
			}
			catch (e) {
				
			}
		});
        */
	});
}

function filter_bing_search(items, info) {
    let query_names = []
    let querys = info['querys'];

    querys.forEach(item=>{
        let nn = item.toLowerCase();
        let nn_list = nn.split(' ');
        nn_list.forEach((item,index)=>{
            nn_list[index] = item.replace(/[^a-z0-9]+/g,"");
        })
        query_names.push(nn_list.sort());
    });

    selected_items = []
    items.forEach(item => {
        let name = item['name'].toLowerCase();
        let pos = name.indexOf(' - ');
        const pos2 = name.indexOf('|');
        if (pos === -1) {
            pos = pos2;
        } else {
            if ((pos2 > -1) && (pos2 < pos)) pos = pos2
        }

        if (pos !== -1) {
            name = name.substring(0,pos);
        }
        
        let nl = name.split(' ');
        nl.forEach((item,index)=>{
            let item1 = item.replace(/[<][/a-z]+[>]/g,"");
            nl[index] = item1.replace(/[^a-z0-9]+/g,"");
        })
        let sim = get_similarity(nl.sort(), query_names);
        if (sim > 0.0) {
            item['score'] = sim;
            selected_items.push(item)
        }
    })

    return selected_items;
}

function search_phone(content) {
    let phoneRegEx1 = /\+\d{1,2}[-\s\.]\d{3,4}[-\s\.]\d{3,4}[-\s\.]\d{3,4}/;
    let phoneRegEx2 = /\(\d{2}\)[-\s\.]\d{3,4}[-\s\.]\d{3,4}/;
    let phoneRegEx3 = /\d{3,4}[-\s\.]\d{3,4}[-\s\.]\d{3,4}/;

    info = []
    var phoneMatches1 = phoneRegEx1.exec(content);
    var phoneMatches2 = phoneRegEx2.exec(content);
    var phoneMatches3 = phoneRegEx3.exec(content);
    
    if (phoneMatches1) {
        phoneMatches1.forEach(function (p) {
            info.push(p);
        });
    }
    if (phoneMatches2) {
        phoneMatches2.forEach(function (p) {
            info.push(p);
        });
    }
    if (phoneMatches3) {
        phoneMatches3.forEach(function (p) {
            info.push(p);
        });
    }
    return info;
}

function search_email(content){
    var regExp = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}}/;
    var emailMatches = regExp.exec(content);
    return emailMatches;
}

function analysis_bing(item, loc_info) {
    var res = {};
    res['url'] = [item['url']];

    var snippet = item['snippet'] + ' ';
    snippet = snippet.toLowerCase();
    res['snippet'] = [snippet];
    res['locality'] = [];
    loc_info.forEach(loc => {
        let pos = snippet.indexOf(loc.toLowerCase());
        if (pos >= 0) {
            //console.debug(snippet);
            //console.debug(snippet.charAt(pos-1))                
            if (pos == 0 || snippet.charAt(pos-1) == ' ') {
                let endchar = snippet.charAt(pos + loc.length);
                if (' ,;:'.indexOf(endchar) >= 0) {
                    res['locality'].push(loc);
                }
            }
        }
    })

    // search for phone, email, fax
    let phone = search_phone(snippet);
    if (phone.length > 0) {
        res['phone'] = phone;
    }

    let email = search_email(snippet);
    if (email) {
        res['email'] = email;
    }

    //let fax = search_fax(snippet);
    //if (fax != '') {
    //    res['fax'] = fax;
    //}
    //res['score'] = item['score'];
    return res;
}

function is_in_set(item, lst) {
    var search = false;
    for (var i=0; i < lst.length; i++) {
        if (item.localeCompare(lst[i])===0) {
            search = true
        }
    }
    return search;
}

function searchBingCallback(info, check_item, bingret) {
    //console.debug(JSON.stringify(bingret));
    if (bingret.hasOwnProperty('webPages')==false) {
        info[check_item] = 1;
        return;    
    }
    search_items = bingret.webPages.value;
    filtered_items = filter_bing_search(search_items, info)

    let tmp = {};
    tmp['locality'] = [];
    tmp['url'] = [];
    tmp['phone'] = [];
    tmp['email'] = [];
    tmp['snippet'] = [];
    
    let loc_info = []
    if (info['probable locality']!== undefined){
        loc_info = info['probable locality'].split(';');
    }

    filtered_items.forEach(item=>{
        res_info = analysis_bing(item, loc_info);
        Object.keys(res_info).forEach(key=>{
            let s = res_info[key];
            //console.debug(`s=${s}`);
            s.forEach(si=>{
                if (is_in_set(si, tmp[key])){
                    //console.debug(`ignored si=${si}`)
                }
                else {
                    tmp[key].push(si);
                }
            })
        })
    })

    if (tmp['snippet'].length > 0) {
        info['snippet'] = tmp['snippet'];
    }
    if (tmp['locality'].length > 0) {
        info['locality'] = tmp['locality'];
    }
    if (tmp['phone'].length > 0) {
        info['phone'] = tmp['phone'];
    }
    if (tmp['email'].length > 0) {
        info['email'] = tmp['email'];
    }
    if (tmp['url'].length > 0) {
        info['url'] = tmp['url'];
    }

    info[check_item] = 1;
    //console.log(info);
}

async function get_bing_info(query_names, locality_info=null) {
    bing_res = [];
    
    query_names.forEach(query_item=>{
        let tmp_info = {};
        tmp_info['done'] = 0;
        if (locality_info != null) {
            tmp_info['probable locality'] = locality_info;
        }
        tmp_info['querys'] = query_names;
        bing_res.push(tmp_info);
        searchBing(query_item, tmp_info, 'done', searchBingCallback);
        new Promise(resolve=>setTimeout(resolve, 300));
    })
    
    while(true){
        let search = true;
        bing_res.forEach(tmp_info=>{
            if (tmp_info['done'] == 0) search = false;
        });

        if (search) break;
        await new Promise(resolve=>setTimeout(resolve, 1000));
        //console.debug('waiting for 1 seconds..')
    }

    var info = {};
    incorporate_bingres(info, bing_res);
    return info;
}

module.exports = {
    get_bing_info
}