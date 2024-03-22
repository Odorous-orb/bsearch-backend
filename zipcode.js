var csv = require("fast-csv");

let postal_code_dict = {};

csv.fromPath("manage/data/postcode.csv", {headers: false, delimiter: ','})
 .on("data", function(data){
     let c = data[0];
     let l = data[1];
     let s = data[2];

     if (c in postal_code_dict){
         postal_code_dict[c]['locality'].push(l);
     }
     else {
         postal_code_dict[c] = {
            code: c,
            locality: [l],
            state: s
         };
     }
 })
 .on("end", function(){
	console.log("Code Initialization Done");
 });

function get_locality_from_zipcode(zipcode) {
    if (zipcode in postal_code_dict) 
        return postal_code_dict[zipcode].locality.join(';');
    return '';
}

module.exports = {get_locality_from_zipcode};
