var anzic_code;
var anzic_code_by_code;
var cur_ABN = '';
var cur_ACN = '';
var cur_EntityName = '';
var cur_EntityType = '';
var cur_EntityDesc = '';
var cur_KeyList = [];

var global_info = {};
var tab_hist = {};

function refine(name) {
    var res = name.replace(/[.]/g, '');
    res = res.replace(/ and /g, ' & ');
    //return res;
    return res.toLowerCase();
}

function loadAnzicInfo() {
    $('#anzic_div').change(function() {
        var selitem = $("#anzic_div option:selected").attr('val');
        fillAnzicSubdiv(selitem);
    });
    
    $('#anzic_subdiv').change(function() {
        var div = $("#anzic_div option:selected").attr('val');
        var selitem = $("#anzic_subdiv option:selected").val();
        fillAnzicGroup(div, selitem);
    });

    $('#anzic_group').change(function() {
        var div = $("#anzic_div option:selected").attr('val');
        var subdiv = $("#anzic_subdiv option:selected").val();
        var selitem = $("#anzic_group option:selected").val();
        fillAnzicClass(div, subdiv, selitem);
    });
    
    $('#anzic_class').change( function() {
        var code = $("#anzic_class option:selected").attr('code');
        document.getElementById('anzic_code').innerHTML = `<b>${code}</b>`;
        show_anzic_details(code);
    });
    
    $.ajax({type: "GET", url: ANZIC_INFO_URL + "/anzics", success: function(res){
        var result = res;
        anzic_code = result.ac;
        anzic_code_by_code = result.acc;
        fillAnzicInfo();
        document.getElementById('status').innerHTML = "Ready";
    }});
}

function elimWhitespace(str1)
{
     return str1.split(' ').join('');
}
  
function isABN(input) {
    return !isNaN(input);
}

function initRDF() {
    $('#accziom_table').remove();
    $('#accziom_result').append('<table id="accziom_table" class="table_profile"></table>');
    $('#accziom_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initABN() {
    $('#abn_table').remove();
    $('#abn_result').append('<table id="abn_table" class="table_profile"></table>');
    $('#abn_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initACN() {
    $('#acn_table').remove();
    $('#acn_result').append('<table id="acn_table" class="table_profile"></table>');
    $('#acn_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initBing() {
    $('#bing_table').remove();
    $('#bing_result').append('<table id="bing_table" class="table_profile"></table>');
    $('#bing_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initTPB() {
    $('#tpb_table').remove();
    $('#tpb_result').append('<table id="tpb_table" class="table_profile"></table>');
    $('#tpb_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initTL() {
    $('#tl_table').remove();
    $('#tl_result').append('<table id="tl_table" class="table_profile"></table>');
    $('#tl_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initLei() {
    $('#lei_table').remove();
    $('#lei_result').append('<table id="lei_table" class="table_profile"></table>');
    $('#lei_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initASX() {
    $('#asx_table').remove();
    $('#asx_result').append('<table id="asx_table" class="table_profile"></table>');
    $('#asx_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initMap() {
    document.getElementById('map').style.display = "none";
}

function initPane() {
    cur_ABN = '';
    cur_ACN = '';
    cur_EntityName = '';
    cur_EntityType = '';
    cur_EntityDesc = '';
    cur_KeyList = [];
    tab_hist = {};

    global_info = {};

    initRDF();
    initABN();
    initACN();
    initBing();    
    initTPB();
    initTL();
    initLei();
    initVerifyPane();
    initASX();
    initMap();
}

var pre_rdf_query='';
function refresh_result() {
    try {
        delete tab_hist["rdf"];
    } catch (e) {

    }
    view_rdf(pre_rdf_query, true);
}

function searchABN(query, type = 'profile_by_abn', entityName='') {
    initPane();
    if (type == 'profile_by_abn') {
        cur_ABN = query;
    } else if (type == 'profile_by_acn') {
        cur_ACN = query;
    } else {
        cur_EntityName = query;
        if (entityName != '') {
            cur_EntityName = entityName;
        }
    }
    return _searchABN(query, type, entityName);
}

cur_tab = '';

function showNav(tab, show) {
    var cont = document.getElementById('nav_' + tab);
    cont.style.display = 'none';
    if (show) {
        cont.style.display = 'block';  
    }
}
function getMap(query, label) {
    $.ajax({type: "GET", url: "https://" + URL + ":5055/map/" + query, success: function(result){
        try {
            var input = result;
            
            if (input.hasOwnProperty('image')) {
                if (input.image.hasOwnProperty('err')){
                    document.getElementById('map_result').innerHTML = 'No map information.'
                }
                else {
                    var xx = input.image.x;
                    var yy = input.image.y;
                    
                    document.getElementById('map_result').innerHTML = `<img style="width:80%" src="https://www.wolframcloud.com/obj/f0c13bbc-7cb8-4158-8112-41502c095272?x=${xx}&y=${yy}&name=${label}">`
                    showNav('map', true);
                    tab_hist["map"] = 1;

                }
            }
        }
        catch (error) {
            console.log('Error : ' + error);
        }
    }});
}

function showAbnInfo(result) {    
    let row = 0;
    // result = [score, name, id, type]
    var total_table = [];
    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }

        var value = result[key];
        value = value.replace(/[;]/g,"<br>");

        total_table.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
    $('#abn_table').append(total_table.join(' '));

    if (result.hasOwnProperty('ABN')){
        cur_ABN = result.ABN;
        if (cur_ACN == '') {
            $('#verifySelect').val('abn');
            changeVerifyType();
        }
    }
    if (result.hasOwnProperty('ASIC Number')) {
        if (cur_ACN == '') {
            cur_ACN = result['ASIC Number'];
            if (cur_ACN && cur_ACN == '0') cur_ACN = '';
        }
        if (cur_ACN != '') {
            $('#verifySelect').val('acn');
            changeVerifyType();
        }
    }
    if (result.hasOwnProperty('Entity Name')) {
        cur_EntityName = result['Entity Name'];
    }
    if (result.hasOwnProperty('Entity Type')) {
        cur_EntityType = result['Entity Type'];
    }
    if (result.hasOwnProperty('Entity Description')) {
        cur_EntityDesc = result['Entity Description'];
    }
}

function showAcnInfo(result) {    
    let row = 0;
    if (!result) return;
    // result = [score, name, id, type]

    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        $('#acn_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${result[key]}</td></tr>`);
    });
    cur_ACN = 0;
    try {
        cur_ACN = result.ACN;
        if (cur_ACN == '0') cur_ACN = '';
        if (cur_ACN != '') {
            $('#verifySelect').val('acn');
            changeVerifyType();
        }
    }
    catch (e) {}
}

function showBingInfo(result) {    
    let row = 0;
    // result = [score, name, id, type]
    Object.keys(result).forEach(key=>{
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }

        var value = result[key];
        if (key != "Snippet") value = value.replace(/[;]/g,"<br>");

        $('#bing_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
}

function showAsxInfo(result) {    
    let row = 0;
    var total_table = [];
    Object.keys(result).forEach(key=>{
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        var value = get_table_data(result[key],true);
        if (value == ''){
            row-=1;
            return;
        }
        total_table.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
    $('#asx_table').append(total_table.join(' '));
    // result = [score, name, id, type]
    /*Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        $('#asx_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${result[key]}</td></tr>`);
    });*/

    if (result.hasOwnProperty('industry')) {
        var subdiv = result['industry'];
        selectGICS(subdiv);
    }
}

function showTpbInfo(result) {    
    let row = 0;
    // result = [score, name, id, type]
    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        $('#tpb_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${result[key]}</td></tr>`);
    });
}

g_asx_list = [];
function loadAsxList() {
    $.ajax({
        type: "GET", 
        url: "https://" + URL + ":8007/asx_list", 
        dataType: "json",
        success: function(result){
        try {
            g_asx_list = result;
            //alert(result.length);
            var asx_cnt = document.getElementById("asx-company-list");
            $('#asx-company-ul').remove();
            $('#asx-company-list').append('<table id="asx-company-ul"></table>')
            $('#asx-company-ul').append('<tr class="table_header"><td>NAME</td></tr>')
        
			let row = 0;
            result.forEach(function(item) {
                row += 1;
                cls_name = "table_body";
                if (row % 2 == 0) {
                    cls_name = "table_body_odd";
                }
                $('#asx-company-ul').append(`<tr id="asx-row-${row}" style="cursor: pointer;" class="${cls_name}" onClick="sel_item($(this)); initPane(); cur_EntityName='${item}'; showTab('accziom')"><td>${item}</td></tr>`)
            });
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

}
function showTlInfo(result) {    
    let row = 0;
    // result = [score, name, id, type]
    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        $('#tl_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${result[key]}</td></tr>`);
    });
}

function showLeiInfo(result) {    
    let row = 0;
    // result = [score, name, id, type]
    total_table = [];
    Object.keys(result).forEach(key=>{
        if (key=="details") return;
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        var value = get_table_data(result[key],true);
        if (value == ''){
            row-=1;
            return;
        }
        total_table.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
    $('#lei_table').append(total_table.join(' '));

}

function get_table_data(data, flag, ord=undefined) {
    if (Array.isArray(data)) {
        var res = [];
        data.forEach(item=>{
            res.push(get_table_data(item, flag, ord));
        });
        return res.join('<br>');
    }

    var keys;
    if (data.constructor == Object) {
        keys = Object.keys(data);
        if (keys.length == 0) {
            return '';
        }
        if (keys.length == 2) {
            var uri = data.uri;
            var lb = data.label;
            if (uri && lb) {
                var res = `<a class="my_href" href='details.html?uri=${uri}&title=${lb}&address=${global_address}&privatekey=${global_prvKey}' target="_blank">${lb}</a>`;
                return res;
            }
        }
    }
    else {
        return data;
    }

    //alert(keys.join(' '))
    var row = 0;
    var res = [];
    res.push('<table style="width:100%; margin-left:0px;"><tbody>');
    var cls_name = '';

    var sorted_key_list = keys;
    if (ord) {
        sorted_key_list = keys.sort((a,b)=>{
            var aa = parseInt(ord[a]);
            var bb = parseInt(ord[b]);
            return aa-bb;
        })
    }
    sorted_key_list.forEach(key => {
        var val = data[key];
        row += 1;
        if (flag) {
            cls_name = "table_body_1";
        }
        else {
            cls_name = "table_body";
        }
        if (row % 2 == 1) {
            if (flag) {
                cls_name = "table_body_odd_1";
            } 
            else {
                cls_name = "table_body_odd";
            }
            
        }
        var value = get_table_data(val, !flag, ord);
        if (value == '') return;
        res.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    
    });
    res.push('</tbody></table>');
    return res.join('');
}

function clickInput(){
    var term = document.getElementById("term");
    term.focus();

    searchCandidate(term.value)
}



function showAccziomInfo(result, option) {

    let row = 0;
    
    var ord = result['##order##'];
    var key_list = Object.keys(result);

    var sorted_key_list = key_list;
    if (ord) {
        sorted_key_list = key_list.sort((a,b) => {
            var aa = parseInt(ord[a]);
            var bb = parseInt(ord[b]);
            return aa-bb;
        });
    } 
    
    var table_str = '';
    sorted_key_list.forEach(key=>{
        if (key=='##order##') return;
        if (key=='predicted_fee') return;
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        var vv = result[key];
        var value = get_table_data(result[key],true, ord);
        //alert(value);
        if (value == ''){
            row-=1;
            return;
        }
        if (key=='Identifier') {
            var abn = vv.ABN;
            
            if (abn) {
                
                if (Array.isArray(abn)) { abn = abn[0];}
                
                cur_ABN = abn;
                if (cur_ACN == '') {
                    $('#verifySelect').val('abn');
                    changeVerifyType();
                }
            }

            var acn = vv.ACN;
            if (acn) {
                if (Array.isArray(acn)) {acn = acn[0];}

                cur_ACN = acn;
                if (cur_ACN == '0') cur_ACN = '';
                if (cur_ACN != '') {
                    $('#verifySelect').val('acn');
                    changeVerifyType();
                }
            }
        }
        if (key == 'Header') {
            if (vv['Legal Name']) {
                var ln = vv['Legal Name'];
                if (Array.isArray(ln)) {
                    cur_EntityName = ln[0];
                } else {
                    cur_EntityName = vv['Legal Name'].trim();
                }
                
            }
        }
        table_str +=`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`;
    });
    $('#accziom_table').append(table_str);
    var fee = result.predicted_fee || 0;
    document.getElementById('pay_button').value = `Pay ${fee} MRC`;
}

async function getGeoLocation(uri) {
    var result = await httprequest("https://" + URL + ":8007" + "/geolocation", {
        entity: uri
    });
    console.log(result);
    if (result.length == 0) return {};
    return result[0];
}

function getAddress(result) {
    var state = '';
    var locality = '';
    if (result.hasOwnProperty('rdf')) {
        var rdf = result.rdf;
        if (rdf.hasOwnProperty("locateAt")) {
            var loc = rdf.locateAt;
            if (Array.isArray(loc)) {
                loc = loc[0];
            }
            if (loc.hasOwnProperty("postalCode")) {
                var post = loc.postalCode;
                if (Array.isArray(post)) { post = post[0];}
                return post;
            }
            if (loc.hasOwnProperty("locateAt")) {
                loc = loc.locateAt;
                if (loc.hasOwnProperty("postalCode")) {
                    var post = loc.postalCode;
                    if (Array.isArray(post)) { post = post[0];}
                    return post;
                }
                if (loc.hasOwnProperty("addressLocality")) {
                    locality = loc.addressLocality;
                }
                if (loc.hasOwnProperty("addressRegion")) {
                    state = loc.addressRegion;
                }
            }
        }
    }
    if (result.hasOwnProperty('abn')) {
        var abn = result.abn;
        if (abn.hasOwnProperty('Post Code')) {
            return abn['Post Code'];
        }
        if (abn.hasOwnProperty('State')) {
            state = abn.State;
        }
        if (abn.hasOwnProperty('Probable Locality')) {
            locality = abn['Probable Locality'];
            var sp = locality.split(';');
            locality = sp[0];
        }
    }

    if (result.hasOwnProperty('verify')) {
        var verify = result.verify;
        if (verify.hasOwnProperty('Post Code')) {
            return verify['Post Code'];
        }
    }

    if (result.hasOwnProperty('bing')) {
        var bing = result.bing;
        if (bing.hasOwnProperty('Locality')) {
            locality = bing.Locality;
        }
    }

    if (state == '') {
        return locality;
    }
    return locality + ',' + state;
}

function get_bing_queries(info) {
    var res = {};
    if (cur_EntityName != '') {
        res[cur_EntityName] = 1;
    }
    
    if (info.hasOwnProperty('rdf')) {
        var rdf = info.rdf;
        if (rdf.hasOwnProperty('legalName')) {
            res[rdf.legalName]=1;
        }
        if (rdf.hasOwnProperty('hasBusiness')) {
            var bn = rdf.hasBusiness;
            if (Array.isArray(bn)) {
                bn.forEach(item=>{
                    res[item] = 1;
                });
            } else {
                res[bn] = 1;
            }
        }
    }

    if (info.hasOwnProperty('abn')) {
        var abn = info.abn;
        if ('Entity Name' in abn) {
            res[abn['Entity Name']] = 1;
        }
        if ('Business Name' in abn) {
            abn['Business Name'].split(';').forEach(item=>{
                res[item] = 1;
            });
        }
    }
    
    if (info.hasOwnProperty('acn')) {
        var acn = info.acn;
        if (acn.hasOwnProperty('Current Name')) {
            res[acn['Current Name']] = 1;
        }
        if (acn.hasOwnProperty('Company Name')) {
            res[acn['Company Name']] = 1;
        }
    }

    if ($.isEmptyObject(res)) {
        return [];
    }
    return Object.keys(res);
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

function get_anzic_key_list(info) {
    var res = {};
    if (info.hasOwnProperty('rdf')) {
        var rdf = info.rdf;
        if (rdf.hasOwnProperty('Content')) {
            var cont = rdf.Content;
            if (cont.hasOwnProperty('Business')) {
                var bn = cont.Business;
                if (Array.isArray(bn)) {
                    bn.forEach(item => {
                        res[item] = 1;
                    });
                } else {
                    res[bn] = 1;
                }
            }
        }
        
        if (rdf.hasOwnProperty('Header')) {
            var cont = rdf.Header;
            if (cont.hasOwnProperty('Description')) {
                var desc = cont.Description;
                if (Array.isArray(desc)) {
                    desc.forEach( item => {
                        item = refine_snippet(item);
                        res[item] = 1;
                    });
                } else {
                    desc = refine_snippet(desc);
                    res[desc] = 1;
                }
            }
        }
    }

    if (info.hasOwnProperty('abn')) {
        var abn = info.abn;
        if (abn.hasOwnProperty('Business Name')) {
            abn['Business Name'].split(';').forEach(item=>{
                res[item] = 1;
                //alert(item);
            });
        }
    }

    if (info.hasOwnProperty('bing')) {
        var bing = info.bing;
        if (bing.hasOwnProperty('snippet')) {
            var snippet = bing.snippet;
            snippet = snippet.split('<br>');
            snippet.forEach(item=>{
                refined_item = refine_snippet(item);
                res[refined_item]=1;
            });
        }
        
    }

    if ($.isEmptyObject(res)) {
        var s = getEntityName(info);
        if (s == '') return [];
        return [s];
    }

    return Object.keys(res);
}

function getEntityName(result) {
    if (result.hasOwnProperty("rdf") && result.rdf) {
        var rdf = result.rdf;
        if (rdf.Header) {
            if (rdf.Header["Legal Name"]) {
                var ln = rdf.Header["Legal Name"];
                if (Array.isArray(ln)) {ln = ln[0];}
                return ln;
            }
        }
    }

    if (result.hasOwnProperty('abn') && result.abn) {
        var abn = result.abn;
        if (abn.hasOwnProperty('Entity Name')) {
            return abn['Entity Name'];
        }
    }

    if (result.hasOwnProperty('acn') && result.acn) {
        var acn = result.acn;
        if (acn.hasOwnProperty('Current Name')) {
            return acn['Current Name'];
        }
        if (acn.hasOwnProperty('Company Name')) {
            return acn['Company Name'];
        }
    }

    return cur_EntityName;
}

function _searchABN(query, type='profile_by_abn', entityName = '', auto=false) {
    if (type == 'profile_by_abn') {
        cur_ABN = query;
    } else if (type == 'profile_by_acn') {
        cur_ACN = query;
    } else {
        cur_EntityName = query;
    }
    
    if (entityName != '') {
        cur_EntityName = entityName;
    }

    if (!auto) {
        showTab("accziom", true);
        return;
    }
    var status_element = document.getElementById("status");
    status_element.textContent = `Processing...`;
    var btn_free = document.getElementById("pay_button");
    //alert(btn_free.value);
    if (!btn_free.value.startsWith("Free")) {
        type = type + "_pro";
    }
    pre_rdf_query = query;
    $.ajax({type: "GET", url: "https://" + URL + ":8007/" + type + "/" + query, success: function(result){
        try {
            initPane();
            
            if (result.hasOwnProperty("error")) {
                status_element.textContent = result.error;
                return false;
            }
            status_element.textContent = 'Success';

            global_info = result;
            tab_hist.rdf = 1;
            tab_hist.abn = 1;
            tab_hist.acn = 1;
            tab_hist.bing = 1;
            tab_hist.anzic = 1;
            tab_hist.tpb = 1;
            tab_hist.tl = 1;
            tab_hist.lei = 1;
            tab_hist.asx = 1;
            tab_hist.map = 1;

            var keys = Object.keys(result);
            //alert(keys.join('\n'));
            keys.forEach(item=>{
                if (result[item] == null) {
                    delete result[item];
                    return;
                }
                if (Object.keys(result[item]).length == 0) {
                    //alert(item);
                    delete result[item];
                    return;
                }
                if (result[item].hasOwnProperty('error')){
                    //alert(item)
                    delete result[item];
                }
            });

            var tabList = {};
            var b = result.hasOwnProperty("rdf")
            if (b) {
                showAccziomInfo(result.rdf);
                tabList['accziom'] = 1;
            }
            showNav('accziom', b);

            var b = result.hasOwnProperty("abn")
            if (b) {
                showAbnInfo(result.abn);
                tabList['abn'] = 1;
                $('#verifySelect').val('abn');
                changeVerifyType();
            }
            showNav('abn', b);

            b = result.hasOwnProperty("acn");
            if (b) {
                showAcnInfo(result.acn);
                tabList['acn'] = 1;
                $('#verifySelect').val('acn');
                changeVerifyType();
            }
            showNav('acn', b);

            b = result.hasOwnProperty("bing")
            if (b) {
                showBingInfo(result.bing);
                tabList['bing'] = 1;
            }
            showNav('bing', b);

            b = result.hasOwnProperty("tpb");
            if (b) {
                showTpbInfo(result.tpb);
                tabList['tpb'] = 1;
            }
            showNav('tpb', b);

            b = result.hasOwnProperty("tl");
            if (b) {
                showTlInfo(result.tl);
                tabList['tl'] = 1;
            }
            showNav('tl', b);

            b = result.hasOwnProperty("lei");
            if (b) {
                showLeiInfo(result.lei);
                tabList['lei'] = 1;
            }
            showNav('lei', b);

            b = result.hasOwnProperty("asx");
            if (b) {
                showAsxInfo(result.asx);
                tabList['asx'] = 1;
            }
            showNav('asx', b);

            b = result.hasOwnProperty("verify")
            if (b) {
                if (result.verify.hasOwnProperty('ACN')) {
                    showVerifyInfo(result.verify, "acn");    
                }
                else {
                    showVerifyInfo(result.verify, "abn");
                }
            }
            tabList['verify'] = 1;
            showNav('verify', true);

            b = result.hasOwnProperty("anzic")
            if (b) {
                showAnzicInfo(result.anzic);
            }
            tabList['anzic'] = 1;
            showNav('anzic', true);

            if (tabList[cur_tab] != 1) {
                var keys = Object.keys(tabList);
                showTab(keys[0]);
            }
            showNav('map', false);
            view_map(result);
            
            return true;
        }
        catch (error) {
            status_element.textContent = 'Error : ' + error;
        } 
    }});

    return false;
}

var global_fee = 0;

async function request(resolve, reason) {
    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/request", 
        dataType: "json",
        data: {
            address: global_address,
            fee: global_fee,
            reason: reason,
        },
        success: function(seed) {
            console.log(seed);
            resolve(seed);
        }
    });
}

async function view_rdf(query, pay=false) {
    if (tab_hist.hasOwnProperty("rdf")) return;
    tab_hist["rdf"] = 1;
    delete tab_hist["anzic"];
    delete tab_hist["bing"];
    
    global_info['rdf'] = {};
    pre_rdf_query = query;
    reason = `query=${query}`;
    document.getElementById('pay_button').value = "Pay";

    var params = {"query": query};
    
    var free = "true";
    if (pay && global_address != "") {
        free = "false";
        params.free = free;
        params.address = global_address;
    }

    var wait_btn = document.getElementById('wait_rdf');
    wait_btn.style = "display:block";

    var seed = '';
    if (free != "true") {
        seed = await new Promise( resolve=> request(resolve, reason));
        
        if (seed=='') {
            console.log('pay failed.');
            free = "true";
        }
        else {
            let vk = await personal_sign(seed);
            params.verification = vk;
            params.seed = seed;
        }
    }
    
    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/rdf_query", 
        dataType: "json",
        data: params,
        success: function(result){
        try {

            console.log(JSON.stringify(result));
            if (result && !$.isEmptyObject(result))
                global_info.rdf = result;
            initRDF();
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in ACCZIOM database."};
            }

            if (result.hasOwnProperty("error")) {
                status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style = "display:none";
                return false;
            }

            global_fee = result.predicted_fee || 0;
            showAccziomInfo(result);
            wait_btn.style = "display:none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    //show_balance();
    return false;
}

function view_abn(query) {
    if (tab_hist.hasOwnProperty("abn")) return;
    //alert('abn: ' + query);
    delete tab_hist["anzic"];
    delete tab_hist["bing"];
    
    global_info['abn'] = {};
    var wait_btn = document.getElementById('wait_abn');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/abn_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.abn = result;
            initABN();

            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in ABN database."};
            }

            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }

            if (!result.hasOwnProperty("Warning")) {
                tab_hist["abn"] = 1;
            }
            
            if (result.hasOwnProperty("recordLastConfirmedDate")) {
                var curDate = new Date();
                var recDate = new Date(result.recordLastConfirmedDate);
                var secs = curDate.getTime() - recDate.getTime();
                if (secs < 3600 * 24 * 1000) {
                    //alert(secs);
                    delete tab_hist['rdf'];
                }
            }
            showAbnInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_acn(query) {
    if (tab_hist.hasOwnProperty("acn")) return;
    
    global_info['acn'] = {};
    var wait_btn = document.getElementById('wait_acn');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/acn_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            //alert(JSON.stringify(result));
            if (result && !$.isEmptyObject(result))
                global_info.acn = result;
            initACN();

            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in our copy of the ACN database."};
            }

            if (result.hasOwnProperty("error")) {
                status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            if (!result.hasOwnProperty("Warning")) {
                tab_hist["acn"] = 1;
            }
            
            showAcnInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_bing(query, locality=null) {
    if (tab_hist.hasOwnProperty("bing")) return;
    
    global_info['bing'] = {};
    var wait_btn = document.getElementById('wait_bing');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/bing_query", 
        dataType: "json",
        data: {"query": query, "locality": locality},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.bing = result;
            initBing();

            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "Not found in Bing search."};
            }

            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["bing"] = 1;
    
            showBingInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_lei(query) {
    if (tab_hist.hasOwnProperty("lei")) return;
    tab_hist["lei"] = 1;
    var wait_btn = document.getElementById('wait_lei');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/lei_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.lei = result;
            initLei();
            
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in our copy of LEI database."};
            }

            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["lei"] = 1;
    
            showLeiInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;

}
function view_tpb(query) {
    if (tab_hist.hasOwnProperty("tpb")) return;
    
    global_info['tpb'] = {};
    var wait_btn = document.getElementById('wait_tpb');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/tpb_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.tpb = result;
            initTPB();
            
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in our copy of TPB database."};
            }

            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["tpb"] = 1;
    
            showTpbInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_tl(query) {
    if (tab_hist.hasOwnProperty("tl")) return;
    
    global_info['tl'] = {};
    var wait_btn = document.getElementById('wait_tl');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/tl_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.tl = result;
            initTL();
            
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in our copy of True Local database."};
            }

            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["tl"] = 1;
    
            showTlInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_asx(query) {
    if (tab_hist.hasOwnProperty("asx")) return;
    
    global_info['asx'] = {};
    var wait_btn = document.getElementById('wait_asx');
    wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/asx_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.asx = result;
            initASX();
            
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in our copy of ASX database."};
            }
            
            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["asx"] = 1;
    
            showAsxInfo(result);
            wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function view_anzic(query) {

    if (tab_hist.hasOwnProperty("anzic")) return;
    restart_websocket();
    
    global_info['anzic'] = {};
    //var wait_btn = document.getElementById('wait_anzic');
    //wait_btn.style.display = "block";

    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/anzic_query", 
        dataType: "json",
        data: {"query": query},
        success: function(result){
        try {
            if (result && !$.isEmptyObject(result))
                global_info.anzic = result;
            
            if (!result || $.isEmptyObject(result)) {
                result = {'Warning': "The data does not exist in ANZIC database."};
            }
            
            if (result.hasOwnProperty("error")) {
                //status_element.textContent = result.error;
                alert(result.error);
                //wait_btn.style.display = "none";
                return false;
            }
            
            tab_hist["anzic"] = 1;
    
            showAnzicInfo(result);
            //wait_btn.style.display = "none";
            
            return true;
        }
        catch (error) {
            alert(error);
            return false;
        } 
    }});

    return false;
}

function checkNumber(query) {
    var a = parseInt(query, 10);
    if (a == query) {
        if (query.length == 11) return 1;
        if (query.length == 9) return 2;
    }
    
    return 0;
}

function showTab(tab_name) {
    cur_tab = tab_name
    document.getElementById('nav_' + tab_name).onclick();
    return;
}

function setCurTab(tab_name) {
    cur_tab = tab_name;
    var query = '';
    if (cur_ABN != '') {
        query = cur_ABN;
    } else if (cur_ACN != '') {
        query = cur_ACN;
    } else {
        query = cur_EntityName;
    }

    if (tab_name == 'accziom') {
        view_rdf(query);
    } else if (tab_name == 'abn') {
        if (cur_ABN != '') {
            view_abn(cur_ABN);
        }
        else {
            view_abn(refine(cur_EntityName));
        }
        
    } else if (tab_name == 'acn') {
        if (cur_ACN != '') {
            query = cur_ACN;
        }
        else {
            query = refine(cur_EntityName);
        }
        view_acn(query);
    } else if (tab_name == 'tpb') {
        view_tpb(cur_EntityName);
    }  else if (tab_name == 'tl') {
        view_tl(cur_EntityName);
    } else if (tab_name == 'asx') {
        if (cur_EntityName == '') {
            cur_EntityName = getEntityName(global_info);
            if (cur_EntityName == '') {
                alert("Please check Accziom, ABN or ACN information before ASX.");
                return;
            }
            
        }
        view_asx(cur_EntityName);
    } else if (tab_name == 'lei') {
        if (cur_EntityName == '') {
            cur_EntityName = getEntityName(global_info);
            if (cur_EntityName == '') {
                alert("Please check Accziom, ABN or ACN information before LEI.");
                return;
            }
        }
        view_lei(cur_EntityName);
    } else if (tab_name == "bing") {
        var bingQueries = get_bing_queries(global_info);
        if ($.isEmptyObject(bingQueries)) {
            alert("Please check Accziom, ABN or ACN information before Bing.");
            return;
        }
        var local = null;
        if (global_info.hasOwnProperty('abn'))
        {
            local = global_info.abn['Probable Locality'];
        }
        view_bing(bingQueries);
    } else if (tab_name == "anzic") {
        var keyList = get_anzic_key_list(global_info);
        if ($.isEmptyObject(keyList)) {
            alert("Please check Accziom, ABN or ACN information before Anzic.");
            return;
        }
        console.log(keyList);
        view_anzic(keyList);
    } else if (tab_name == 'map') {
        if ($.isEmptyObject(global_info)) {
            alert("Please check Accziom, ABN or ACN information before Map.");
            return;
        }
        view_map(global_info);
    }
}

var selected_item = undefined;
function sel_item(elmnt) {
    if (selected_item) {
        selected_item.removeClass("selected");
    }
    elmnt.addClass("selected");
    selected_item = elmnt;
}

function qsearch(query, s_list, b, e) {
    if (b>=e-1) return b;
    var p = Math.floor((b+e) / 2);
    var r = query.localeCompare(s_list[p]);
    if (r == 0) {
        return p;
    }
    if (r < 0) {
        return qsearch(query, s_list, b, p);
    }
    return qsearch(query, s_list, p+1, e);
}

function searchAsxList(query, click=true) {
    query = query.toUpperCase();
    var pos = qsearch(query, g_asx_list, 0, g_asx_list.length);
    var row = document.getElementById(`asx-row-${pos+1}`);
    row.scrollIntoView();
    if (click == true) {
        row.click();
    }
}

function searchCandidate(query) {
    var pane_name = $('#search-list-type').val();
    if (pane_name == "asx") {
        searchAsxList(query);
        return;
    }

    query = query.trim();
    var options = {
        collapsed: false,
        withQuotes: false
      };

    var abn_acn_type = checkNumber(query);
    if (abn_acn_type == 1) {
        return searchABN(query, 'profile_by_abn');
    } else if (abn_acn_type == 2) {
        return searchABN(query, 'profile_by_acn');
    }

    {
        $('#company-ul').remove();
        $('#company-list').append('<table id="company-ul"></table>')
        $('#company-ul').append('<tr class="table_header"><td style="width:25%">ABN</td><td>NAME</td><td style="width:25%">TYPE</td></tr>')
        var status_element = document.getElementById("status");
        status_element.textContent = 'Processing...';

        $.ajax({type: "GET", url: "https://" + URL + ":8007/namesearch/" + query, success: function(result){
        try {
            // result = [score, name, id, type]
            status_element.textContent = "Success";
            var input = eval('(' + JSON.stringify(result) + ')');
            showStatus = false;

            initPane();
            let row = 0;
            let showed = false;
            input.forEach(function(item) {
                row += 1;
                cls_name = "table_body";
                if (row % 2 == 0) {
                    cls_name = "table_body_odd";
                }
                var txt = `[${item[0]}] ${item[1]} (abn=${item[2]}, type=${item[3]})`;
                if (item[2].length == 11) {
                    $('#company-ul').append(`<tr style="cursor: pointer;" class="${cls_name}" onClick="sel_item($(this)); searchABN('${item[2]}', 'profile_by_abn', '${item[1]}')"><td>${item[2]}</td><td>${item[1]}</td><td>${item[3]}</td></tr>`)
                } else if (item[2].length == 9) {
                    $('#company-ul').append(`<tr style="cursor: pointer;" class="${cls_name}" onClick="sel_item($(this)); searchABN('${item[2]}', 'profile_by_acn', '${item[1]}')"><td>${item[2]}</td><td>${item[1]}</td><td>${item[3]}</td></tr>`)
                } else {
                    $('#company-ul').append(`<tr style="cursor: pointer;" class="${cls_name}" onClick="sel_item($(this)); searchABN('${item[1]}', 'profile_by_name', '${item[1]}')"><td>${item[2]}</td><td>${item[1]}</td><td>${item[3]}</td></tr>`)
                }
                
                if (item[0] > 10) {
                    if (showed==false) {
                        if (item[2].length==11) {
                            _searchABN(item[2], 'profile_by_abn', item[1]);
                        } else if (item[2].length==9) {
                            _searchABN(item[2], 'profile_by_acn', item[1]);
                        } else {
                            _searchABN(item[1], 'profile_by_name', item[1]);
                        }
                    }
                    showed = true;
                }
            });
            return true;
        }
        catch (error) {
            status_element.textContent = 'Error : ' + error;
        } }});
    }
    
    return false;
}

function changeVerifyType(){
    var vt = $("#verifySelect option:selected").attr('value');
    var input = document.getElementById('verifyInput');
    var div = document.getElementById('verifyOther');
    reg_type = {
        'company': 'company',
        'trust': 'trust',
        'partnership': 'partnership',
        'trader': 'sole trader'
    }
    if (vt == 'abn') {
        input.value = cur_ABN;
        div.style.display = 'none';

    }
    if (vt == 'acn') {
        input.value = cur_ACN;
        div.style.display = 'none';
    }
    if (vt == 'name') {
        div.style.display = 'block';
        input.value = cur_EntityName;
        var type = document.getElementById('verifyType');
        var subtype = document.getElementById('verifySubType');
        var number = document.getElementById('verifyNumber');
        var t;
        if (cur_EntityType == 'SMF') {
            t = 'trust';
        }
        else {
            var ds = cur_EntityDesc.split(' ');
            var lastTerm = ds[ds.length - 1].toLowerCase();
            if (reg_type.hasOwnProperty(lastTerm)) {
                t = reg_type[lastTerm];
            }
            else{
                t = 'other';
            }

        }
        type.value = t;
        subtype.value = cur_EntityDesc;
        if (cur_ABN != 0) {
            number.value = cur_ABN;
        }
        else if (cur_ACN != 0) {
            number.innerHTML = cur_ACN;
        }
        else {
            number.innerHTML = '';
        }
    }    
}

async function print_div(div_id) {
    var btn = document.getElementById('print_btn');
    btn.value = "printing...";
    var target = document.getElementById(div_id);
    var pdf = new jsPDF('p', 'px', 'a4');
    var currentPosition = target.scrollTop;
    var w = 595;
    var h = 841.89;
    //document.getElementById("content").style.height="auto";	
    var originWidth = target.style.width;
    var originHeight = target.style.height;
    //target.style.width = "595px";
    target.style.height = "auto";
    var ww = target.offsetWidth;
    var hh = target.offsetHeight;
    var r = w / ww;
    h = 841.89 / r;
    
    pdf.setFont('Verdana', 'normal');
    pdf.setFont('sans-serif', 'normal');
    pdf.setFont('Lucida Sans', 'normal');

    pdf.html(target, {
        html2canvas: {
            scale: r/1.5,
            //windowHeight: div.scrollHeight+20,
            //600 is the width of a4 page. 'a4': [595.28, 841.89]
        },
        callback: function () {
            let data = pdf.output();

            var saveByteArray = (function () {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                //window.URL.createObjectURL = jest.fn();
                return function (data, name) {
                    var blob = new Blob(data, {type: "octet/stream"});
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        // compatible to IE/Edge
                        window.navigator.msSaveOrOpenBlob(blob, "content.pdf")
                    } else {
                        var tmpobj = window.URL && window.URL.createObjectURL ? window.URL : webkitURL;
                        var url = tmpobj.createObjectURL(blob)
                        var a = document.createElement('a');
                        a.href = url;
                        a.style.display = 'download';
                        a.setAttribute('download', "content.pdf")
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        tmpobj.revokeObjectURL(url) 
                    }
                };
            }());

            saveByteArray([data], "content.pdf");
            btn.value= "Print";
            target.style.height = originHeight;
            //alert(data);
            //window.open(data);
        }
    });

    /*
    var cloneDom = $('#' + div_id).clone(true); 
    cloneDom.css({ 
        "background-color": "white", 
        "position": "absolute", 
        "top": "0px", 
        "z-index": "-1", 
        "height": hh 
    });
    
    $("body").append(cloneDom); 
    
    html2canvas(cloneDom.get(0), { 
        //Whether to allow cross-origin images to taint the canvas 
        allowTaint: true, 
        //Whether to test each image if it taints the canvas before drawing them 
        taintTest: false, 
        onrendered: function(canvas) { 
        } 
    }).then(canvas => {
        var contentWidth = canvas.width; 
        var contentHeight = canvas.height; 
        var pageHeight = 841.89 * contentWidth / 592.28; 
        var leftHeight = contentHeight; 
        var position = 0; 
        var imgWidth = 595.28; 
        var imgHeight = 592.28 / contentWidth * contentHeight; 
        var pageData = canvas.toDataURL('image/jpeg', 1.0); 
        if(leftHeight < pageHeight) { 
            pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth,imgHeight); 
        } else { 
            while(leftHeight > 0) { 
                pdf.addImage(pageData, 'JPEG', 0, position,imgWidth, imgHeight) 
                leftHeight -= pageHeight; 
                position -= 841.89;  
                if(leftHeight > 0) { 
                    pdf.addPage(); 
                } 
                break;
            } 
        } 
        let data = pdf.output();
        var saveByteArray = (function () {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            //window.URL.createObjectURL = jest.fn();
            return function (data, name) {
                var blob = new Blob([data], {type: "octet/stream"});
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    // compatible to IE/Edge
                    window.navigator.msSaveOrOpenBlob(blob, "content.pdf")
                } else {
                    var tmpobj = window.URL && window.URL.createObjectURL ? window.URL : webkitURL;
                    var url = tmpobj.createObjectURL(blob)
                    var a = document.createElement('a');
                    a.href = url;
                    a.style.display = 'download';
                    a.setAttribute('download', "content.pdf")
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    tmpobj.revokeObjectURL(url) 
                }
            };
        }());

        saveByteArray(data, "content.pdf");
    }); 
    */
    /*
    var currentPosition = target.scrollTop;
    var w = 595.0;
    var h = 841;
    //document.getElementById("content").style.height="auto";	
    var originWidth = target.style.width;
    var originHeight = target.style.height;
    //target.style.width = "595px";
    target.style.height = "auto";
    var ww = target.offsetWidth;
    var hh = target.offsetHeight;
    var r = w / ww;
    h = 841 / r;
    target.style.height = `${h}px`;
    //target.style.width = w;
    var doc = new jsPDF('p', 'px', 'a4');
    var imgurl;
    for (var yy = 0; yy < hh ; yy+=h) {
        target.scrollTop = yy;
    
        var img = await new Promise((resolve, reject) => {
            html2canvas(target, {

                dpi: 300, // Set to 300 DPI
                scale: w/ww, // Adjusts your resolution
                onrendered: function(canvas) {
                    alert("onrendered")	
                }
            }).then(canvas => {
                var imgg = canvas.toDataURL();//("image/png", 1.0);
                return resolve(imgg);
            });
        });

        //var logo = new Image();
        //logo.src = img;
        doc.plugin.addImage(img, 'JPEG', 0, 0, 595, 841);
        var prps = doc.getImageProperties(img);
        alert(JSON.stringify(prps));
        //doc.save("content.pdf");
        doc.addPage();		
        imgurl = img;	
        break;

    }
    
    let data = doc.output();
    var saveByteArray = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        //window.URL.createObjectURL = jest.fn();
        return function (data, name) {
            var blob = new Blob([data], {type: "octet/stream"});
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                // compatible to IE/Edge
                window.navigator.msSaveOrOpenBlob(blob, "content.pdf")
            } else {
                var tmpobj = window.URL && window.URL.createObjectURL ? window.URL : webkitURL;
                var url = tmpobj.createObjectURL(blob)
                var a = document.createElement('a');
                a.href = url;
                a.style.display = 'download';
                a.setAttribute('download', "content.pdf")
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                tmpobj.revokeObjectURL(url) 
            }
        };
    }());

    saveByteArray(data, "content.pdf");
    //document.getElementById("content").style.height="100px";
    target.style.width = originWidth;
    target.style.height = originHeight;

    target.scrollTop = currentPosition;
    */
    
    /*
    window.html2canvas = html2canvas;
    var pdf = new jsPDF('p', 'pt', 'a4');
    var div = document.getElementById(div_id);
    let srcwidth = div.scrollWidth;

    /*
    var specialElementHandlers = {
        '#bypassme': function(element, renderer) {
            return true
        },
        '#changeme': function (element, renderer) {
            return '<h2>different text</h2>';
        }
    };
    pdf.fromHTML(div.innerHTML, 15, 15, {
        "width":170,
        "elementHandlers": specialElementHandlers
    });

    pdf.save("File.pdf");
    */
    /*
    html2canvas(div, {
        
        dpi: 300, // Set to 300 DPI
        scale: 3, // Adjusts your resolution
        onrendered: function(canvas) {
            var img = canvas.toDataURL("image/jpeg", 1);
            var doc = new jsPDF('L', 'px', [w, h]);
            pdf.addImage(img, 'JPEG', 0, 0, w, h);
            pdf.addPage();
            //doc.save('sample-file.pdf');
            let data = pdf.output();

            var saveByteArray = (function () {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                //window.URL.createObjectURL = jest.fn();
                return function (data, name) {
                    var blob = new Blob(data, {type: "octet/stream"});
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        // compatible to IE/Edge
                        window.navigator.msSaveOrOpenBlob(blob, "content.pdf")
                    } else {
                        var tmpobj = window.URL && window.URL.createObjectURL ? window.URL : webkitURL;
                        var url = tmpobj.createObjectURL(blob)
                        var a = document.createElement('a');
                        a.href = url;
                        a.style.display = 'download';
                        a.setAttribute('download', "content.pdf")
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        tmpobj.revokeObjectURL(url) 
                    }
                };
            }());

            saveByteArray([data], "content.pdf");
        }
    });*/
    /*
    pdf.html(div, {
        html2canvas: {
            scale: 600 / srcwidth,
            scrollY: 100,
            //windowHeight: div.scrollHeight+20,
            //600 is the width of a4 page. 'a4': [595.28, 841.89]
        },
        callback: function () {
            let data = pdf.output();

            var saveByteArray = (function () {
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                //window.URL.createObjectURL = jest.fn();
                return function (data, name) {
                    var blob = new Blob(data, {type: "octet/stream"});
                    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                        // compatible to IE/Edge
                        window.navigator.msSaveOrOpenBlob(blob, "content.pdf")
                    } else {
                        var tmpobj = window.URL && window.URL.createObjectURL ? window.URL : webkitURL;
                        var url = tmpobj.createObjectURL(blob)
                        var a = document.createElement('a');
                        a.href = url;
                        a.style.display = 'download';
                        a.setAttribute('download', "content.pdf")
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        tmpobj.revokeObjectURL(url) 
                    }
                };
            }());

            saveByteArray([data], "content.pdf");

            //alert(data);
            //window.open(data);
        }
    });
    
    /*
    var options = {
    };
    pdf.addHTML($("#"+div_id), 500, 500, options, function() {
    pdf.save('pageContent.pdf');
    });*/
/*
    var divContents = document.getElementById(div_id).innerHTML;
    var a = window.open('', '', 'height=500, width=500');
    a.document.write('<html> <head><link rel="stylesheet" type="text/css" href="style.css"></head>');
    a.document.write('<body >');
    a.document.write(divContents);
    a.document.write('</body></html>');
    a.document.close();
    a.print();
    window.close();
    */
}

function print() {
    if (cur_tab == 'verify') {
        print_div('verify_result');
    }
    else if (cur_tab == 'accziom') {
        print_div('accziom_result');
    }
    else if (cur_tab == 'abn') {
        print_div('abn_result');
    }
    else if (cur_tab == 'acn') {
        print_div('acn_result');
    }
    else if (cur_tab == 'lei') {
        print_div('lei_result');
    }
    else if (cur_tab == 'bing') {
        print_div('bing_result');
    }
    else if (cur_tab == 'tpb') {
        print_div('tpb_result');
    }
    else if (cur_tab == 'tl') {
        print_div('tl_result');
    }
    else if (cur_tab == 'asx') {
        print_div('asx_result');
    }
}