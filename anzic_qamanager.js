const { 
    ANZIC_AI_URL,
    ANZIC_INFO_URL,
    ANZIC_START_MESSAGE,
    ANZIC_MAX_CANDIDATE_CNT
} = require('./config');

const { SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION } = require('constants');
const request = require('request');
var anzic_code;
var anzic_code_by_code;

function loadAnzicInfo() {
    request.get({uri:  ANZIC_INFO_URL + "/anzics" , headers: {"Accept": "application/json"}}, (err3, ret3, result)=> {
        result = JSON.parse(result);
        anzic_code = result.ac;
        anzic_code_by_code = result.acc;
        console.log('Initialized Anzic Info.');
    });
}

// loadAnzicInfo();

function refine_comma(txt) {
    var txt_list = txt.split(',');
    return txt_list.join(', ');
}

function refine_enter(txt) {
    var txt_list = txt.split('\n');
    return txt_list.join('<br>');
}

function isDigit(str)
{
    if (str[0] < '0' || str[0] > '9')
        return false;
    if (str[1] < '0' || str[1] > '9')
        return false;
    if (str[2] < '0' || str[2] > '9')
        return false;
    if (str[3] < '0' || str[3] > '9')
        return false;

    return true;
}

function isStopWord(word1)
{
    word = word1.toLowerCase();
    // word = word1;

    if (word == "and") return false;
    if (word == "in") return false;
    if (word == "n") return false;
    if (word == "e") return false;
    if (word == "c") return false;
    if (word == "as") return false;
    if (word == "the") return false;
    if (word == "generally") return false;
    if (word == "this") return false;
    if (word == "class") return false;
    if (word == "of") return false;
    if (word == "also") return false;
    if (word == "or") return false;
    if (word == "except") return false;
    if (word == "n") return false;
    if (word == "e") return false;
    if (word == "c") return false;
    if (word == "not") return false;
    if (word == "elsewhere") return false;
    if (word == "include") return false;
    if (word == "either") return false;
    if (word == "which") return false;
    if (word == "are") return false;
    if (word == "is") return false;
    if (word == "included") return false;
    if (word == "from") return false;
    if (word == "other") return false;
    if (word == "to") return false;
    if (isDigit(word) == true) return false;

    return true;
}
function splitByWords1(desc1)
{
    desc = desc1.substring(47);
    ret = [];
    word = "";

    for (i = 0; i < desc.length; i++)
    {
        c = desc[i];

        if (c == ' ' || c == ',' || c == '(' || c == ')' || c == '.' || c == '\r' || c == '\n' || c == '|' || c == '\\' || c == '/')
        {
            if (word.length > 0)
                if (isStopWord(word) == true && ret.indexOf(word) == -1) ret.push(word);
            
            word = "";
        }
        else
            word = word + c;
    }

    return JSON.stringify(ret);
}

function splitByWords(desc)
{
    var ret = {};
    ret.words = "";
    ret.primary_words = "";
    ret.exclusion_words = "";

    var desc_lower = desc.toLowerCase();
    idx = desc_lower.indexOf("primary activities");

    if (idx != -1)
    {
        tmp = desc.substring(0, idx);		
        ret.words = splitByWords1(tmp);

        idx1 = desc_lower.indexOf("exclusions/references");

        if (idx1 != -1)
        {
            tmp = desc.substring(idx + 19, idx1);
            ret.primary_words = splitByWords1(tmp);

            tmp = desc.substring(idx1 + 21);
            ret.exclusion_words = splitByWords1(tmp);
        }
        else
        {
            tmp = desc.substring(idx + 19);
            ret.primary_words = splitByWords1(tmp);
        }
    }
    else
    {
        ret.words = splitByWords1(desc);
    }

    return ret;
}

function get_code_string(item) {
    let code_str_list = [];
    if (item.division !== undefined) code_str_list.push(`<span style="color:darkred;">${item.division}</span>`);
    if (item.subdivision !== undefined) code_str_list.push(`<span style="color:darkyellow;">${item.subdivision}</span>`);
    if (item.group !== undefined) code_str_list.push(`<span style="color:darkblue;">${item.group}</span>`);
    if (item.class !== undefined) code_str_list.push(`<span style="color:#222222;">${item.class}</span>`);
    
    let code_str = code_str_list.join('>');
    return code_str;
}

function refine_query(item){
    item = item.replace(/[<]b[>]/, '');
    item = item.replace(/[<][/]b[>]/, '');
    let split_symbol = ':;"/.,?<>[]{}()*&^%$#@!`~-+=_' + "'";
    for (var i = 0; i < split_symbol.length; i++) {
        var c = split_symbol.charAt(i);
        let word_list = item.split(c);
        item = word_list.join(' ');
    }
    return item;
}

class qamanager
{
    constructor(ctx) {
        this.ctx = ctx;
        this.init();
    }

    init() {
        this.query_type = 0; // 0: keyword 1: choice
        this.candidate_list = [];
        this.yes_list = {};
        this.no_list = {};
        this.query_list = [];
    }

    getIntent(msg){
        if (msg.length == 1) {
            if (msg >= '0' && msg <= '9') {
                if (this.query_type == -1) {
                    return 1;
                }
                return this.query_type;
            }
            
            return 0;
        }

        if (msg.startsWith('#')) msg = msg.slice(1,msg.length);
        if (msg.startsWith('$')) msg = msg.slice(1,msg.length);

        if (msg.length == 3 || msg.length == 4) {
            var is_number = true;
            for (var i = 0; i < msg.length; i++) {
                var c = msg.charAt(i);
                if (c >= '0' && c <= '9') continue;
                is_number = false;
                break;
            }
            if (is_number) {
                return 6;
            }            
        }

        if (this.query_type == -1) {
            if (msg == 'restart'){
                return 3;
            }
            return 2;
        }

        if (msg == 'restart'){
            return 3;
        }
        return 0;
        
    }
    
    show_account_info(cls_name) {
        var query = this.query_list.join(' ');
        query += ' ' + cls_name;
        this.search_account_code(query, cand_list => {
            var res_list = [];
            for (var i = 0; i < cand_list.length; i++) {
                if (i == 5) break;
                var code = cand_list[i].code;
                var cat = cand_list[i].category;
                var cat_info = cat.split('>');
                //var class_name = cat_info[-1];
                
                var res_str = `${i+1}. ${code} (${cat_info.slice(2, cat_info.length).join('>')})`;
                res_list.push(res_str);
            }
            var msg = '<b>Accounts Code</b>:<br>' + res_list.join('<br>');
            this.ctx.websocket.send('#accounts#' + msg);

        });
    }

    show_anzic_info(code, silence=false) {
        if (anzic_code_by_code[code] === undefined) {
            this.ctx.websocket.send(`Not founded the information of ${code}.`);
            return;
        }
        var code_meta = anzic_code_by_code[code];
        var div = code_meta.division;
        var subdiv = code_meta.subdivision;
        var grp = code_meta.group;
        var cls = code_meta.class;
        var desc = code_meta.description;
        var code = code_meta.code;

        this.show_account_info(cls);

        var cur_group = anzic_code[div][subdiv][grp];
        var code_info = cur_group[0];
        for (var i = 0; i < cur_group.length; i++) {
            if (cur_group[i].cls_name == cls) {
                code_info = cur_group[i];
                break;
            }
        }
        
        var tmp = [div, subdiv, cls, desc].join(',');
        var word_list = splitByWords(tmp);
        var words_desc = refine_comma(word_list.words);
        var words_activity = refine_comma(word_list.primary_words);
        var words_exclusion = refine_comma(word_list.exclusion_words);
        var phrases_desc = refine_comma(code_info.cls_phrases);
        var phrases_activity = refine_comma(code_info.cls_phrases_primary);
        var phrases_exclusion = refine_comma(code_info.cls_phrases_exclusion);

        var msg_list = [];
        msg_list.push(`<b>Code</b>: ${code}`);
        msg_list.push(`<b>Division</b>: ${div}`);
        msg_list.push(`<b>Subdivision</b>: ${subdiv}`);
        msg_list.push(`<b>Group</b>: ${grp}`);
        msg_list.push(`<b>Class</b>: ${cls}`);
        
        var msg = msg_list.join('<br>');
        this.ctx.websocket.send('#code#' + msg);
        
        msg = `<b>Description</b>:<br>` + refine_enter(desc);
        this.ctx.websocket.send('#desc#' + msg);
        
        msg_list = [];
        msg_list.push(`<b>Phrases</b>: ${phrases_desc}`);
        msg_list.push(`<b>Phrases of Activity</b>: ${phrases_activity}`);
        msg_list.push(`<b>Phrases of Exclusion</b>: ${phrases_exclusion}`);
        msg = msg_list.join('<br>');
        this.ctx.websocket.send('#phrase#' + msg);

        msg_list = [];
        msg_list.push(`<b>Words</b>: ${words_desc}`);
        msg_list.push(`<b>Words of Activity</b>: ${words_activity}`);
        msg_list.push(`<b>Words of Exclusion</b>: ${words_exclusion}`);
        msg = msg_list.join('<br>');
        this.ctx.websocket.send('#words#' + msg);

        if (silence) return;
        msg = `Please see the details for code ${code} in the right pane.`;
        this.ctx.websocket.send(msg);
    }


    register_no_class(){
        var cur_sel_list = this.cur_selected_list;
        if (cur_sel_list.length > ANZIC_MAX_CANDIDATE_CNT) {
            cur_sel_list = cur_sel_list.slice(0, ANZIC_MAX_CANDIDATE_CNT);
        }
        cur_sel_list.forEach( item => {
            var code = item.code;
            if (this.no_list[4] === undefined) {
                this.no_list[4] = {};
            }
            this.no_list[4][code] = 1;
        });
    }

    register_no_level(){
        var res_list = this.cur_selected_level;
        var cur_sel = this.cur_level;
        if (res_list.length > ANZIC_MAX_CANDIDATE_CNT) res_list = res_list.slice(0, ANZIC_MAX_CANDIDATE_CNT);
        res_list.forEach(item => {
            if (this.no_list[cur_sel] === undefined) {
                this.no_list[cur_sel] = {};
            }
            
            var key = '';
            if (cur_sel == 1) key = item.division;
            else if (cur_sel == 2) key = item.subdivision;
            else if (cur_sel == 3) key = item.group;

            this.no_list[cur_sel][key] = 1;
        });
    }

    register_yes_level(ind) {
        var res_list = this.cur_selected_level;
        var cur_sel = this.cur_level;

        var item = res_list[ind-1];
        if (this.yes_list[cur_sel] === undefined) {
            this.yes_list[cur_sel] = {};
        }
        
        var key = '';
        if (cur_sel == 1) key = item.division;
        else if (cur_sel == 2) key = item.subdivision;
        else if (cur_sel == 3) key = item.group;

        this.yes_list[cur_sel][key] = 1;
    }
    processQuestion(msg){
        if (msg.startsWith('%')) {
            msg = msg.slice(1,msg.length);
            var res = JSON.parse(msg);
            this.init();
            this.updateCandList(res);
            return;
        }
        msg = msg.trim();
        msg = msg.toLowerCase();
        var intend_type = this.getIntent(msg);

        if (intend_type == 0) {
            // search keyword
            this.query_list.push(msg);
            var query = this.query_list.join(' ');
            this.search_anzic_code(query, this.updateCandList.bind(this));
        }
        else if (intend_type == 1) {
            // select correct candidate
            var ind = parseInt(msg);
            if (ind == 0) {
                this.register_no_class();
                this.cur_selected_list = this.filterCandidates(this.candidate_list);
                var str_list = [];
                str_list.push('1. Division level');
                str_list.push('2. Subdivision level');
                str_list.push('3. Group level');
                str_list.push('');
                str_list.push('Please enter the number of the level you want to select. If you want to add keyword, enter several additional keywords.');
                var res_str = str_list.join('<br>');
                this.ctx.websocket.send(res_str);
                this.query_type = 4;
                return; 
            }

            var display_cnt = ANZIC_MAX_CANDIDATE_CNT;
            if (display_cnt > this.cur_selected_list.length)
                display_cnt = this.cur_selected_list.length;

            if (ind < 1 || ind > display_cnt) {
                var res_str = `Input Error. You should select the number between 0 and %{display_cnt}.`;
                this.ctx.websocket.send(res_str);
                return;
            }
            var cand = this.cur_selected_list[ind-1];
            var code_str = cand.code + '(' + get_code_string(cand) + ')';
            //var res = 'Congratulations!<br>Your answer is ' + code_str + '.' + '<br>If you want to try again, enter <b><i>restart</i></b>, please.';
            //this.ctx.websocket.send(res);
            this.show_anzic_info(cand.code);
            this.query_type = -1;
            return;
        }
        else if (intend_type == 2) {
            // after finished
            var res = 'If you want to try again, enter <b><i>restart</i></b>, please.';
            this.ctx.websocket.send(res);
            this.query_type = -1;
        }
        else if (intend_type == 3) {
            // restart
            this.ctx.websocket.send(ANZIC_START_MESSAGE);
            this.init();
        }
        else if (intend_type == 4) {
            var ind = parseInt(msg);
            if (ind < 1 || ind > 3) {
                var res_str = `Input Error. You should select the number between 1 and 3.`;
                this.ctx.websocket.send(res_str);
                return;
            }

            this.cur_level = ind;
            var res_list = this.filterLevel();
            this.cur_selected_level = res_list;
            if (res_list.length > ANZIC_MAX_CANDIDATE_CNT)
                res_list = res_list.slice(0,ANZIC_MAX_CANDIDATE_CNT);
            
            var msg_list = [];
            var i = 0;
            res_list.forEach(item => {
                var item_str = get_code_string(item);
                i+=1;
                msg_list.push(`${i}. ${item_str}`);
            });
            msg_list.push('');
            msg_list.push('Please select the number of correct super-class. If there is not correct item, please enter <b>0</b>.');
            var msg = msg_list.join('<br>');
            this.ctx.websocket.send(msg);
            this.query_type = 5;
        }
        else if (intend_type == 5) {
            var ind = parseInt(msg);
            if (ind == 0) {
                this.register_no_level();
            } else {
                var display_cnt = this.cur_selected_level.length;
                if (display_cnt > ANZIC_MAX_CANDIDATE_CNT) display_cnt = ANZIC_MAX_CANDIDATE_CNT;
                if (ind < 1 || ind > display_cnt) {
                    var res_str = `Input Error. You should select the number between 0 and %{display_cnt}.`;
                    this.ctx.websocket.send(res_str);
                    return;
                }
                this.register_yes_level(ind);
            }
            this.updateCandList(this.candidate_list);
        }
        else if (intend_type == 6) {
            if (msg.startsWith('#')) msg = msg.slice(1,msg.length);
            let silence = false;
            if (msg.startsWith('$')) {
                msg = msg.slice(1,msg.length);
                silence = true;
            }
            if (msg.length == 3) msg = '0' + msg;
            this.show_anzic_info(msg, silence);
            return;
        }
        else {
            var res_str = `I do not understand this command.`;
            this.ctx.websocket.send(res_str);
        }
    }

    search_anzic_code(query, callback) {
        query = query.toLowerCase();
        query = refine_query(query);
        
        var endpoint_mpnet = `${ANZIC_AI_URL}/search/${query}`;
        request.get({uri: endpoint_mpnet, headers: {"Accept": "application/json"}}, (err3, ret3, result)=> {
            try {
                if (result.length){
                    let jsobj = eval(result);
                    callback(jsobj);
                }            
            } catch (e){
                callback([]);
            }
        });
    }

    search_account_code(query, callback) {
        query = query.toLowerCase();
        query = refine_query(query);
        
        var endpoint_mpnet = `${ANZIC_AI_URL}/search_account/${query}`;
        request.get({uri: endpoint_mpnet, headers: {"Accept": "application/json"}}, (err3, ret3, result)=> {
            try {
                if (result.length){
                    let jsobj = eval(result);
                    callback(jsobj);
                }            
            } catch (e){
                callback([]);
            }
        });
    }
    filterCandidates(){
        var res_list = [];
        var cand_list = this.candidate_list;
        cand_list.forEach( item => {
            var div = item.division;
            var sdiv = item.subdivision;
            var grp = item.group;
            var code = item.code;
            if (this.yes_list[1] != undefined) {
                if (this.yes_list[1][div] === undefined) return;
            }
            if (this.yes_list[2] != undefined) {
                if (this.yes_list[2][sdiv] === undefined) return;
            }
            if (this.yes_list[3] != undefined) {
                if (this.yes_list[3][grp] === undefined) return;
            }
            if (this.no_list[1] != undefined) {
                if (this.no_list[1][div] == 1) return;
            }
            if (this.no_list[2] != undefined) {
                if (this.no_list[2][sdiv] == 1) return;
            }
            if (this.no_list[3] != undefined) {
                if (this.no_list[3][div] == 1) return;
            }
            if (this.no_list[4] != undefined) {
                if (this.no_list[4][code] == 1) return;
            }
            res_list.push(item);
        });
        return res_list;

    }

    filterLevel(){
        var cur_level = this.cur_level;
        var res_list = [];
        var cand_list = this.cur_selected_list;
        var rep_dict = {};
        cand_list.forEach( item => {
            var new_item = {};
            var div = item.division;
            var sdiv = item.subdivision;
            var grp = item.group;
            if (cur_level >= 1) new_item.division = div;
            if (cur_level >= 2) new_item.subdivision = sdiv;
            if (cur_level >= 3) new_item.group = grp;
            let item_str = get_code_string(new_item);
            if (rep_dict[item_str] === undefined) {
                res_list.push(new_item);
                rep_dict[item_str] = 1;
            }
        });
        return res_list;

    }

    request_keyword(){
        this.ctx.websocket.send('There is not enough keyword.<br>Please add the keyword to help classifying ANZIC code.')
        this.query_type = 0; // set to query mode
    }

    updateCandList(cand_list) {
        this.candidate_list = cand_list;
        var res = this.filterCandidates(cand_list);
        this.cur_selected_list = res;
        
        if (res.length > ANZIC_MAX_CANDIDATE_CNT)
            res = res.slice(0,ANZIC_MAX_CANDIDATE_CNT);

        if (res.length == 0) {
            this.request_keyword();
        }
        else {
            let msg_list = [];
            let i = 0;
            res.forEach(item=>{
                let code_str = get_code_string(item);
                i+=1;
                let msg = `<span style="cursor:pointer;" onclick="getCode('${item.code}')">${i}. <span style="color:#cb7200"><b><u>${item.code}</u></b></span> (${code_str})</span>`;
                msg_list.push(msg);
            });
            msg_list.push('');
            msg_list.push('Please input the number of correct candidate. If you can not find the answer and want to select high-level class, please input <b>0</b>. If you want to add keyword, enter several additional keywords.');

            let msg = msg_list.join('<br>');
            this.ctx.websocket.send(msg);
            this.query_type = 1; // alter to choice mode. 
        }
    }
}

module.exports = qamanager;