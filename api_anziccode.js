const {
    ANZIC_AI_URL
} = require('./config');

const request = require('request');

async function search_anzic_code(query_names){
    code_score = {};
    check_list = [];
    query_names.forEach(query=>{
        query = query.toLowerCase();
        console.debug(`anzic search query=${query}`)
        let ind = check_list.length;
        check_list.push(0);
        var endpoint_mpnet = `${ANZIC_AI_URL}/search/${query}`;
        request.get({uri: endpoint_mpnet, headers: {"Accept": "application/json"}}, (err3, ret3, body3)=> {
            try {
                //console.debug(`body=${body3}`)
                if (body3.length){
                    jsobj = eval(body3);
                    for (var j= 0; j<jsobj.length; j++) {
                        let jsitem = jsobj[j];
                        let code = jsitem.code;
                        let score = parseFloat(jsitem.score);
                        let class_name = jsitem.class;
						let group_name = jsitem.group;
						let subdiv_name = jsitem.subdivision;
						let div_name = jsitem.division;
                        let code_str = [div_name, subdiv_name, group_name, class_name].join('>');
                        if (code_score[code] === undefined) {
                            code_score[code] = [score, code_str];
                        }
                        else if (code_score[code] < score) {
                            code_score[code] = [score, code_str];
                        }
                    }
                }
                check_list[ind] = 1; 
            } catch (e){
                check_list[ind] = 1;
            }
        });
    });
    while(true){
        let search = true;
        check_list.forEach(item=>{
            if (item == 0) search = false;
        });

        if (search) break;
        await new Promise(resolve=>setTimeout(resolve, 1000));
        //console.debug('waiting for 1 seconds..')
    }
    
    code_score_list = [];
    for (key in code_score){
        //console.log(key);
        val = code_score[key];
        code_score_list.push([key, val[0], val[1]]);
    }
    code_score_list.sort(function compare(a,b){
        return b[1] - a[1];
    });
    var res = [];
    for (var i = 0 ; i < code_score_list.length; i++) {
        if (i == 5) break;
        res.push([code_score_list[i][0], code_score_list[i][2]]);
    }
    return res; 
}

function fillFromAnzicCode(res, code_list){
    if (code_list.length == 0) return;
    res[`anzicCode`] = `${code_list[0][0]}(${code_list[0][1]})`;
    for (var i = 1 ; i < code_list.length; i++) {
        res[`Candidate(${i})`] = `${code_list[i][0]}(${code_list[i][1]})`;
    }
}

async function get_anzic_code(query_names){
    var info = {};
    let code_list = await search_anzic_code(query_names);
    fillFromAnzicCode(info, code_list);
    return info;
}

module.exports = {
    get_anzic_code
};