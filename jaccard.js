function calc_jaccard_sim(content, query){
    if (!content) {
        return 0;
    }
    var content1 = content.toLowerCase();
    var query1 = query.toLowerCase();

    var ct = content1.split(' ');
    var qr = query1.split(' ');
    ct = ct.sort((a,b)=>(a.localeCompare(b)));
    qr = qr.sort((a,b)=>(a.localeCompare(b)));
    let [c, d1, d2] = check_overlap(ct, qr);
    if (c == 0) return 0;
    let jaccard_sim = parseFloat(c) / (c + d1 + d2);
    return jaccard_sim;        
}


function check_overlap(cl, ql) {
    var i = 0;
    var j = 0;
    var l1 = cl.length;
    var l2 = ql.length;
    var c = 0;
    var d1 = 0;
    var d2 = 0;
    while((i<l1) && (j <l2)) {
        let ci = cl[i];
        let qi = ql[j];

        if (ci == qi){
            i+=1;
            j+=1;
            c += 1;
            continue
        }
        if (ci < qi) {
            i+=1;
            if (ci.localeCompare('pty') == 0) continue
            if (ci.localeCompare('corporation') == 0) continue
            if (ci.localeCompare('ltd') == 0) continue 
            if (ci.localeCompare('company') == 0) continue 
            if (ci.localeCompare('profile') == 0) continue 
            d1+=1;
            continue;
        }
        j+=1;
        if (qi.localeCompare('pty') == 0) continue
        if (qi.localeCompare('corporation') == 0) continue
        if (qi.localeCompare('ltd') == 0) continue 
        if (qi.localeCompare('company') == 0) continue 
        if (qi.localeCompare('profile') == 0) continue 
        d2+=1;
        continue;
    }
    while (i < l1) {
        let ci = cl[i];
        i+=1;
        if (ci.localeCompare('corporation') == 0) continue
        if (ci.localeCompare('pty') == 0) continue
        if (ci.localeCompare('ltd') == 0) continue 
        if (ci.localeCompare('company') == 0) continue 
        if (ci.localeCompare('profile') == 0) continue 
        d1+=1;
    }
    while (j < l2) {
        let qi = ql[j];
        j+=1;
        if (qi.localeCompare('pty') == 0) continue
        if (qi.localeCompare('corporation') == 0) continue
        if (qi.localeCompare('ltd') == 0) continue 
        if (qi.localeCompare('company') == 0) continue 
        if (qi.localeCompare('profile') == 0) continue 
        d2+=1;
    }
    //console.debug(`cl=${cl.join(' ')}\nql=${ql.join(' ')}`);
    return [c, d1, d2];
}

function get_similarity(content, queries) {
    for (var i = 0; i< queries.length; i++) {
        let [c, d1, d2] = check_overlap(content, queries[i])
        let jaccard_sim = parseFloat(c) / (c + d1 + d2);
        //console.debug(`sim=${jaccard_sim}`);
        if (jaccard_sim > 0.7) {
            return jaccard_sim;
        }
    }
    return 0.0;
}

module.exports = {
    calc_jaccard_sim,
    get_similarity
};