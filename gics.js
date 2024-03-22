var csv = require("fast-csv");

var gics_name_to_data = {'1':{}, '2':{}, '3':{}, '4':{}};
var gics_code_to_data = {};

var p1 = null, p2=null, p3=null, p4=null;

csv.fromPath("manage/data/GICS.csv", {headers: false, delimiter: ','})
.on("data", function(data){
    const [c1, l1, c2, l2, c3, l3, c4, l4] = data;

    if (c1 != '') {
        var item = {'code': c1, 'label':l1, 'child':[]};
        gics_name_to_data['1'][l1] = item;
        gics_code_to_data[c1] = item;
        p1 = item;
    }

    if (c2!='') {
        var item = {'code': c2, 'label':l2, 'child':[], 'parent': p1['label']};
        gics_name_to_data['2'][l2] = item;
        gics_code_to_data[c2] = item;
        p1['child'].push(item);
        p2 = item;
    }

    if (c3!='') {
        var item = {'code': c3, 'label':l3, 'child':[], 'parent':p2['label']};
        gics_name_to_data['3'][l3] = item;
        gics_code_to_data[c3] = item;
        p2['child'].push(item);
        p3 = item;
    }

    if (c4!='') {
        var item = {'code': c4, 'label':l4, 'child':[], 'desc':'', 'parent':p3['label']};
        gics_name_to_data['4'][l4] = item;
        gics_code_to_data[c4] = item;
        p3['child'].push(item);
        p4 = item;
    }
    else if (l4 != '') {
        p4['desc'] = l4;
    }
})
.on("end", function(){
    console.log("GICS Initialization Finished.");
});

function get_gics_name_to_data(){
    return gics_name_to_data;
}

module.exports={get_gics_name_to_data};
