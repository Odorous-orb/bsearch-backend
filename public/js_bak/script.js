/*$(document).ready(function() {
    $('#term').on('input', function() {
        var val = this.value;
        searchCandidate($('#term').val());
    });
 });*/

var anzic_code;
var anzic_code_by_code;
var cur_ABN = 0;
var cur_ACN = 0;
var cur_EntityName = '';
var cur_EntityType = '';
var cur_EntityDesc = '';

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
    
    $.ajax({type: "GET", url: "http://" + ANZIC_INFO_URL + "/anzics", success: function(res){
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

function initVerifyPane() {
    $('#verify_table').remove();
    document.getElementById("register_mark").innerHTML = "";
    document.getElementById("verification_mark").innerHTML = "";
    $('#verify_result').append('<table id="verify_table" class="table_profile"></table>');
    $('#verify_table').append('<tr class="table_header"><td style="width:25%">Abstract</td></tr>');
    
    $('#verifyInput').val('');
    $('#verifyType').val('');
    $('#verifySubType').val('');
    $('#verifyNumber').val('');
}

function initPane() {
    cur_ABN = 0;
    cur_ACN = 0;
    cur_EntityName = '';
    cur_EntityType = '';
    cur_EntityDesc = '';

    $('#accziom_table').remove();
    $('#accziom_result').append('<table id="accziom_table" class="table_profile"></table>');
    $('#accziom_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');

    $('#abn_table').remove();
    $('#abn_result').append('<table id="abn_table" class="table_profile"></table>');
    $('#abn_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
    
    $('#acn_table').remove();
    $('#acn_result').append('<table id="acn_table" class="table_profile"></table>');
    $('#acn_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
    
    $('#bing_table').remove();
    $('#bing_result').append('<table id="bing_table" class="table_profile"></table>');
    $('#bing_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
    
    $('#tpb_table').remove();
    $('#tpb_result').append('<table id="tpb_table" class="table_profile"></table>');
    $('#tpb_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
    
    initVerifyPane();
    $('#asx_table').remove();
    $('#asx_result').append('<table id="asx_table" class="table_profile"></table>');
    $('#asx_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
    
    document.getElementById('map_result').innerHTML = "";
}

var pre_abn;
var pre_type;
function refresh_result() {
    searchABN(pre_abn, pre_type);
}

function searchABN(abnid, type = 'profile_by_abn') {
    pre_abn = abnid;
    pre_type = type;
    initPane();
    return _searchABN(abnid, type);
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
    $.ajax({type: "GET", url: "http://" + URL + ":5055/map/" + query, success: function(result){
        try {
            var input = result;
            
            if (input.hasOwnProperty('image')) {
                if (input.image.hasOwnProperty('err')){
                    document.getElementById('map_result').innerHTML = ''
                }
                else {
                    var xx = input.image.x;
                    var yy = input.image.y;
                    
                    document.getElementById('map_result').innerHTML = `<img style="width:80%" src="https://www.wolframcloud.com/obj/f0c13bbc-7cb8-4158-8112-41502c095272?x=${xx}&y=${yy}&name=${label}">`
                    showNav('map', true);
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
    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }

        var value = result[key];
        value = value.replace(/[;]/g,"<br>");

        $('#abn_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
    cur_ABN = 0;
    try {
        cur_ABN = result.ABN;
    }
    catch (e) {}
    try {
        cur_EntityName = result['Entity Name'];
    }
    catch (e) {}
    try {
        cur_EntityType = result['Entity Type'];
    }
    catch (e) {}
    try {
        cur_EntityDesc = result['Entity Description'];
    }
    catch (e) {}
}

function showAcnInfo(result) {    
    let row = 0;
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
    // result = [score, name, id, type]
    Object.keys(result).forEach(key=>{
        row += 1;
        cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        $('#asx_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${result[key]}</td></tr>`);
    });

    if (result.hasOwnProperty('GICs industry group')) {
        var subdiv = result['GICs industry group'];
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

function get_table_data(data, flag) {
    if (Array.isArray(data)) {
        var res = [];
        data.forEach(item=>{
            res.push(get_table_data(item, flag));
        });
        return res.join('<br>');
    }
    var keys;
    if (data.constructor == Object) {
        keys = Object.keys(data);
        if (keys.length == 0) {
            return '';
        }
    }
    else {
        return data;
    }

    //alert(keys.join(' '))
    var row = 0;
    var res = [];
    res.push('<table style="width:100%; margin-left:0px;">');
    var cls_name = '';
    keys.forEach(key => {
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
        var value = get_table_data(val, !flag);
        if (value == '') return;
        res.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    
    });
    res.push('</table>');
    return res.join('');
}

function clickInput(){
    var term = document.getElementById("term");
    term.focus();

    searchCandidate(term.value)
}

function clickVerify(){
    var btn = document.getElementById('verifySearch');
    btn.innerHTML = "Waiting...";
    var vt = $('#verifySelect').val();
    var query = $('#verifyInput').val();
    var type = $('#verifyType').val();
    var subtype = $('#verifySubType').val();
    var number = $('#verifyNumber').val();

    $.ajax({type:"POST", url: "http://" + URL + ":8007/verify", data:{'query':query, 'type':type, 'subtype':subtype, 'id':number}, 
    success: function(result, textStatus, jqXHR){
        initVerifyPane();
        var res = result;
        showVerifyInfo(res, vt);
        var btn = document.getElementById('verifySearch');
        btn.innerHTML = "Verify";
    }, error: function(jqXHR, textStatus, errorThrown){
        initVerifyPane();
        var btn = document.getElementById('verifySearch');
        btn.innerHTML = "Verify";
    }});
}

function showVerifyInfo(result, option) {    
    let row = 0;
    // result = [score, name, id, type]
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
        $('#verify_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });

    var reg_text = "Unregistered";
    var ver_text = "Unverified";
    var reg_image = "no.png";
    var ver_image = "no.png";

    if (result.hasOwnProperty('Registered')) {
        if (result.Registered) {
            reg_text = "Registered";
            reg_image = "yes.png"
        }
    }

    if (result.hasOwnProperty('Verified')) {
        if (result.Verified) {
            ver_text = "Verified";
            ver_image= "yes.png";
        }
    }

    document.getElementById("register_mark").innerHTML = `<image class="mark_image" src="${reg_image}"></image><span>${reg_text}</span>`;
    document.getElementById("verification_mark").innerHTML = `<image class="mark_image" src="${ver_image}"></image><span>${ver_text}</span>`;
    $('#verifySelect').val(option);
    changeVerifyType();

    if (!result.hasOwnProperty('details')) return;
    
    $('#verify_table').append(`<tr class="table_header"><td>Details</td></tr>`);
    row= 0;
    Object.keys(result.details).forEach(key=>{
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        var value = get_table_data(result.details[key],true);
        if (value == ''){
            row-=1;
            return;
        }
        $('#verify_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });


}

function showAccziomInfo(result, option) {    
    let row = 0;
    
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
        $('#accziom_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
}

function getAddress(result) {
    var state = '';
    var locality = '';
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

function _searchABN(abnid, type='profile_by_abn') {
    pre_abn = abnid;
    pre_type = type;
    var status_element = document.getElementById("status");
    status_element.textContent = `Processing...(${abnid})`;
    var btn_free = document.getElementById("free_version");
    if (btn_free.value != "Free Version") {
        type = type + "_pro";
    }
    $.ajax({type: "GET", url: "http://" + URL + ":8007/" + type + "/" + abnid, success: function(result){
        try {
            initPane();
            if (result.hasOwnProperty("error")) {
                status_element.textContent = result.error;
                return false;
            }
            status_element.textContent = 'Success';

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
            var postCode = getAddress(result);
            
            if (postCode != null) {
                var entityName = getEntityName(result);
                getMap(postCode, entityName);
            }

            return true;
        }
        catch (error) {
            status_element.textContent = 'Error : ' + error;
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
}

function searchCandidate(query) {
    query = query.trim();
    var options = {
        collapsed: false,
        withQuotes: false
      };

    var abn_acn_type = checkNumber(query);
    if (abn_acn_type == 1) {
        return searchABN(query);
    }
    if (abn_acn_type == 2) {
        return searchABN(query, 'profile_by_acn');
    }
    {
        $('#company-ul').remove();
        $('#company-list').append('<table id="company-ul"></table>')
        $('#company-ul').append('<tr class="table_header"><td style="width:25%">ABN</td><td>NAME</td><td style="width:25%">TYPE</td></tr>')
        var status_element = document.getElementById("status");
        status_element.textContent = 'Processing...';

        $.ajax({type: "GET", url: "http://" + URL + ":8007/namesearch/" + query, success: function(result){
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
                    $('#company-ul').append(`<tr style="cursor: pointer;" class="${cls_name}" onClick="searchABN('${item[2]}', 'profile_by_abn')"><td>${item[2]}</td><td>${item[1]}</td><td>${item[3]}</td></tr>`)
                } else {
                    $('#company-ul').append(`<tr style="cursor: pointer;" class="${cls_name}" onClick="searchABN('${item[2]}', 'profile_by_acn')"><td>${item[2]}</td><td>${item[1]}</td><td>${item[3]}</td></tr>`)
                }
                
                if (item[0] == 100) {
                    if (showed==false) {
                        if (item[2].length==11) {
                            _searchABN(item[2]);
                        } else {
                            _searchABN(item[2], 'profile_by_acn');
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