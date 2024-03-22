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

function clickVerify(){
    var btn = document.getElementById('verifySearch');
    btn.innerHTML = "Waiting...";
    var vt = $('#verifySelect').val();
    var query = $('#verifyInput').val();
    var type = $('#verifyType').val();
    var subtype = $('#verifySubType').val();
    var number = $('#verifyNumber').val();

    $.ajax({type:"POST", url: "https://" + URL + ":8007/verify", data:{'query':query, 'type':type, 'subtype':subtype, 'id':number}, 
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
    var total_table = [];
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

    $('#verify_table').append(total_table.join(' '));

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
    total_table = [];
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
        total_table.push(`<tr class="${cls_name}"><td>${key}</td><td>${value}</td></tr>`);
    });
    $('#verify_table').append(total_table.join(' '));
}
