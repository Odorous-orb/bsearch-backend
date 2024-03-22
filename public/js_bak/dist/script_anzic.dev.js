"use strict";

var exclude_code = {};
var key_list = [];
var cur_code_list = [];

function initAnzic() {
  exclude_code = {};
  key_list = [];
  cur_code_list = []; //var view = document.getElementById("key_view");
  //var input = document.getElementById("key_input");
  //input.value = '';
  //view.innerHTML = "";

  $('#ulView').find('li').remove(); //$('#anzic_table').remove();
  //$('#anzic_result').append('<table id="anzic_table" class="table_profile"></table>');
  //$('#anzic_table').append('<tr class="table_header"><td style="width:25%">FIELD</td><td>VALUE</td></tr>');
}

function _showAnzicInfo(result) {
  var anzic_info = [];
  Object.keys(result).forEach(function (key) {
    var value = result[key];
    var p = value.indexOf('(');
    var code = value.slice(0, p);
    var desc = value.slice(p + 1, value.length - 1);
    var cats = desc.split('>');
    anzic_info.push({
      'code': code,
      'division': cats[0],
      'subdivision': cats[1],
      'group': cats[2],
      'class': cats[3]
    });
  });
  var inputStr = '%' + JSON.stringify(anzic_info);
  requestToChatbotServer(inputStr);
}

function showAnzicInfo(result) {
  initAnzic();

  _showAnzicInfo(result);
}

function select(code) {
  var code_meta = anzic_code_by_code[code];
  var div = code_meta.division;
  var subdiv = code_meta.subdivision;
  var grp = code_meta.group;
  var cls = code_meta["class"];
  $('#anzic_div').val(div);
  $('#anzic_div').change();
  $('#anzic_subdiv').val(subdiv);
  $('#anzic_subdiv').change();
  $('#anzic_group').val(grp);
  $('#anzic_group').change();
  $('#anzic_class').val(cls);
  $('#anzic_class').change();
  $('#pl').focus();
  document.getElementById('anzic_details').scrollIntoView({
    behavior: 'auto'
  }); //alert(code);
}

function show_anzic_details(code) {
  var obj = document.getElementById('anzic_desc');

  if (anzic_code_by_code[code] === undefined) {
    obj.innerHTML = "Not founded the information of ".concat(code, ".");
  }

  var code_meta = anzic_code_by_code[code];
  var div = code_meta.division;
  var subdiv = code_meta.subdivision;
  var grp = code_meta.group;
  var cls = code_meta["class"];
  var desc = code_meta.description;
  var code = code_meta.code; //show_account_info(cls);

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
  var res_list = [];
  msg = "<b>Description</b>:<br>" + refine_enter(desc);
  res_list.push(msg);
  msg_list = [];
  msg_list.push("<b>Phrases</b>: ".concat(phrases_desc));
  msg_list.push("<b>Phrases of Activity</b>: ".concat(phrases_activity));
  msg_list.push("<b>Phrases of Exclusion</b>: ".concat(phrases_exclusion));
  msg = msg_list.join('<br>');
  res_list.push(msg);
  msg_list = [];
  msg_list.push("<b>Words</b>: ".concat(words_desc));
  msg_list.push("<b>Words of Activity</b>: ".concat(words_activity));
  msg_list.push("<b>Words of Exclusion</b>: ".concat(words_exclusion));
  msg = msg_list.join('<br>');
  res_list.push(msg);
  obj.innerHTML = res_list.join('<br><br>');
}

function fillAnzicInfo() {
  var keys = Object.keys(anzic_code);
  $('#anzic_div').innerHTML = "";
  keys.forEach(function (key) {
    $('#anzic_div').append("<option val=\"".concat(key, "\">").concat(key, "</option>"));
  });
  $('#anzic_div').change();
}

function fillAnzicSubdiv(div) {
  var keys = Object.keys(anzic_code[div]);
  $('#anzic_subdiv').find("option").remove();
  keys.forEach(function (key) {
    $('#anzic_subdiv').append("<option val=\"".concat(key, "\">").concat(key, "</option>"));
  });
  $('#anzic_subdiv').change();
}

function fillAnzicGroup(div, subdiv) {
  var keys = Object.keys(anzic_code[div][subdiv]);
  $('#anzic_group').find("option").remove();
  keys.forEach(function (key) {
    $('#anzic_group').append("<option val=\"".concat(key, "\">").concat(key, "</option>"));
  });
  $('#anzic_group').change();
}

function fillAnzicClass(div, subdiv, group) {
  var keys = anzic_code[div][subdiv][group];
  $('#anzic_class').find("option").remove();
  keys.forEach(function (item) {
    var key = item.cls_name;
    var code = item.cls_code;
    $('#anzic_class').append("<option code=\"".concat(code, "\">").concat(key, "</option>"));
  });
  $('#anzic_class').change();
}

function refine_comma(txt) {
  var txt_list = txt.split(',');
  return txt_list.join(', ');
}

function refine_enter(txt) {
  var txt_list = txt.split('\n');
  return txt_list.join('<br>');
}

function isDigit(str) {
  if (str[0] < '0' || str[0] > '9') return false;
  if (str[1] < '0' || str[1] > '9') return false;
  if (str[2] < '0' || str[2] > '9') return false;
  if (str[3] < '0' || str[3] > '9') return false;
  return true;
}

function isStopWord(word1) {
  word = word1.toLowerCase(); // word = word1;

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
  if (word == "for") return false;
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

function splitByWords1(desc1) {
  desc = desc1.substring(47);
  ret = [];
  word = "";

  for (i = 0; i < desc.length; i++) {
    c = desc[i];

    if (c == ' ' || c == ',' || c == '(' || c == ')' || c == '.' || c == '\r' || c == '\n' || c == '|' || c == '\\' || c == '/') {
      if (word.length > 0) if (isStopWord(word) == true && ret.indexOf(word) == -1) ret.push(word);
      word = "";
    } else word = word + c;
  }

  return JSON.stringify(ret);
}

function splitByWords(desc) {
  var ret = {};
  ret.words = "";
  ret.primary_words = "";
  ret.exclusion_words = "";
  var desc_lower = desc.toLowerCase();
  idx = desc_lower.indexOf("primary activities");

  if (idx != -1) {
    tmp = desc.substring(0, idx);
    ret.words = splitByWords1(tmp);
    idx1 = desc_lower.indexOf("exclusions/references");

    if (idx1 != -1) {
      tmp = desc.substring(idx + 19, idx1);
      ret.primary_words = splitByWords1(tmp);
      tmp = desc.substring(idx1 + 21);
      ret.exclusion_words = splitByWords1(tmp);
    } else {
      tmp = desc.substring(idx + 19);
      ret.primary_words = splitByWords1(tmp);
    }
  } else {
    ret.words = splitByWords1(desc);
  }

  return ret;
}

function refine_query(item) {
  item = item.replace(/[<]b[>]/g, '');
  item = item.replace(/[<][/]b[>]/g, '');
  var split_symbol = ':;"/.,?<>[]{}()*&^%$#@!`~-+=_' + "'";

  for (var i = 0; i < split_symbol.length; i++) {
    var c = split_symbol.charAt(i);
    var word_list = item.split(c);
    item = word_list.join(' ');
  }

  return item;
}

function search_anzic_code1(query, callback) {
  query = query.toLowerCase();
  query = refine_query(query);
  var endpoint_mpnet = "http://".concat(ANZIC_URL, "/search/").concat(query);
  $.ajax({
    type: "GET",
    url: endpoint_mpnet,
    success: function success(result) {
      try {
        if (result.length) {
          var jsobj = eval(result);
          callback(jsobj);
        }
      } catch (e) {
        callback([]);
      }
    }
  });
}

function filterCandidate(result) {
  var res = {};
  var cnt = 0;
  result.forEach(function (item) {
    var div = item.division;
    var sdiv = item.subdivision;
    var grp = item.group;
    var cls = item["class"];
    var code = item.code;
    if (exclude_code.hasOwnProperty(code)) return;
    if (cnt >= 5) return;
    var val = "".concat(code, "(").concat([div, sdiv, grp, cls].join('>'), ")");

    if (cnt == 0) {
      res['anzicCode'] = val;
    } else {
      res["Candidate(".concat(cnt, ")")] = val;
    }

    cnt += 1;
  }); //_showAnzicInfo(res);
}

function clickClear() {
  initAnzic();
}