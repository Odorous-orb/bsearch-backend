function elimWhitespace(str1)
{
     return str1.split(' ').join('');
}

function initRDF() {
    $('#accziom_table').remove();
    $('#accziom_result').append('<table id="accziom_table" class="table_profile"></table>');
    $('#accziom_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function initPane() {
    initRDF();
}

var pre_rdf_query='';
function refresh_result() {
    view_rdf(pre_rdf_query, true);
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
    res.push('<table style="width:100%; margin-left:0px;">');
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
    res.push('</table>');
    return res.join('');
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
    
    sorted_key_list.forEach(key=>{
        if (key=='##order##') return;
        if (key=='predicted_fee') return;
        row += 1;
        var cls_name = "table_body";
        if (row % 2 == 1) {
            cls_name = "table_body_odd";
        }
        var value = get_table_data(result[key],true, ord);
        if (value == ''){
            row-=1;
            return;
        }
        if (key=='Identifier') {
            if (value.ABN) {
                cur_ABN = value.ABN;
                if (cur_ACN == '') {
                    $('#verifySelect').val('abn');
                    changeVerifyType();
                }
            }
            if (value.ACN) {
                cur_ACN = value.ACN;
                if (cur_ACN == '0') cur_ACN = '';
                if (cur_ACN != '') {
                    $('#verifySelect').val('acn');
                    changeVerifyType();
                }
            }
        }
        if (key == 'Header') {
            if (value['Legal Name']) {
                cur_EntityName = value['Legal Name'].trim();
            }
        }
        $('#accziom_table').append(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });

    var fee = result.predicted_fee || 0;
    document.getElementById('pay_button').value = `Pay ${fee} MRC`;
}

var global_address = "";
var global_prvKey = "";

var global_fee = 0;

async function request(resolve) {
    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/request", 
        dataType: "json",
        data: {
            address: global_address,
            fee: global_fee
        },
        success: function(seed) {
            console.log(seed);
            resolve(seed);
        }
    });
}

async function view_rdf(query, pay=false) {
    pre_rdf_query = query;

    var free = "true";
    var params = {};
    params.query = query;
    if (pay && global_address != "") {
        free = "false";
        params.free = global_fee;
        params.address = global_address;
    }

    var wait_btn = document.getElementById('wait_rdf');
    wait_btn.style = "display:block";

    var seed = '';
    if (free != "true") {
        seed = await new Promise( resolve=> request(resolve));
        
        if (seed=='') {
            console.log('pay failed.');
            free = "true";
        }
        else {
            let sk = hex_sha1(global_prvKey);
            let seed1 = seed + sk;
            let vk = hex_sha1(seed1);
            params.verification = vk;
            params.seed = seed;
        }
    }
    
    $.ajax({
        type: "POST", 
        url: "https://" + URL + ":8007/uri_query", 
        dataType: "json",
        data: params,
        success: function(result){
        try {

            console.log(JSON.stringify(result));

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

    return false;
}
