var gics_code;

function loadGICSInfo() {
    $('#gics_div').change(function() {
        var selitem = $("#gics_div option:selected").attr('val');
        fillGicsSubdiv(selitem);
    });
    
    $('#gics_subdiv').change(function() {
        var div = $("#gics_div option:selected").attr('val');
        var selitem = $("#gics_subdiv option:selected").attr('val');
        fillGicsGroup(div, selitem);
    });

    $('#gics_group').change(function() {
        var div = $("#gics_div option:selected").attr('val');
        var subdiv = $("#gics_subdiv option:selected").attr('val');
        var selitem = $("#gics_group option:selected").attr('val');
        fillGicsClass(div, subdiv, selitem);
    });
    
    $('#gics_class').change( function() {
        var cls = $("#gics_class option:selected").attr('val');
        var d = gics_code['4'][cls];
        document.getElementById('gics_desc').innerHTML = '<b>Description</b>: ' + d['desc'];
    });
    
    $.ajax({type: "GET", url: URL_GICS + "/gics", success: function(res){
        gics_code = res;
        fillGicsInfo();
    }});
}

function fillGicsInfo() {
    var keys = Object.keys(gics_code['1']);
    $('#gics_div').innerHTML="";
    keys.forEach(key => {
        var d = gics_code['1'][key];
        $('#gics_div').append(`<option val="${key}">[${d.code}] ${key}</option>`);
    });
    
    $('#gics_div').change();
}

function fillGicsSubdiv(div) {
    var keys = gics_code['1'][div]['child'];
    $('#gics_subdiv').find("option").remove();
    keys.forEach(item => {
        var key = item.label;
        var code = item.code;
        $('#gics_subdiv').append(`<option val="${key}">[${code}] ${key}</option>`);
    });
    
    $('#gics_subdiv').change();
}

function fillGicsGroup(div, subdiv) {
    var keys = gics_code['2'][subdiv]['child'];
    $('#gics_group').find("option").remove();
    keys.forEach(item => {
        var key = item.label;
        var code = item.code;
        $('#gics_group').append(`<option val="${key}">[${code}] ${key}</option>`);
    });
    
    $('#gics_group').change();
}

function fillGicsClass(div, subdiv, group) {
    var keys = gics_code['3'][group]['child'];
    $('#gics_class').find("option").remove();
    keys.forEach(item => {
        var key=item.label;
        var code = item.code;
        $('#gics_class').append(`<option val="${key}">[${code}] ${key}</option>`);
    });
    
    $('#gics_class').change();
}

function selectGICS(subdiv) {
    var subdiv_item = gics_code['2'][subdiv];
    if (subdiv_item == undefined) {
        return;
    }
    //alert(subdiv_item);
    var div = subdiv_item['parent'];
    var div_item = gics_code['1'][div];
    $('#gics_div').val(`[${div_item.code}] ${div_item.label}`);
    $('#gics_div').change();
    $('#gics_subdiv').val(`[${subdiv_item.code}] ${subdiv_item.label}`);
    $('#gics_subdiv').change();
}