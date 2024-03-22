const { 
    update_abn_from_name_list,
    update_abn_from_id_list,
    init_mongodb,
    init_rdfdb
} = require('./manage/update_abn');

const { 
    asx_update, 
    asx_rdf_update
} = require('./manage/update_asx');

async function manage_db(request, result) {
    console.log(request);
    if (request.type == 'abn') {
        update_abn(request, result);
        return;
    }
    else if (request.type == 'asx') {
        update_asx(request, result);
        return;
    }
    result.json({"msg": "Nothing has been done."});
};

async function update_asx(req, res) {
    if (req.cmd == 'update_mongodb') {
        asx_update(()=>{
            res.json('Finished updating ASX database.');
            console.log('Finished Updation.');
        });
        return;
    }
    else if (req.cmd == 'update_rdf') {
        await asx_rdf_update(()=>{
            res.json('Finished updating ASX database.');
            console.log('Finished Updation.');
        });
        return;
    }
    res.json({"msg": "Nothing has been done."});
    console.log('Finished Updation.');
}

async function update_abn(req, res, law=true) {
    //console.log(req);
    if (req.cmd == 'init_mongodb') {
        init_mongodb(msg => {
            res.json(msg);
            console.log('Finished Updation.');
        });
        return;
    }
    if (req.cmd == 'init_rdfdb') {
        init_rdfdb(msg => {
            res.json(msg);
            console.log('Finished Updation.');
        });
        return;
    }
    if (req.cmd == 'insert_id_list') {
        var id_list;
        if (law) {
            id_list = req.content;
        } else {
            id_list = req.content.split(';'); 
        } 
        var msg = await update_abn_from_id_list(id_list);
        res.json(msg);
        console.log('Finished Updation.');
        return;
    }
    if (req.cmd == 'insert_name_list') {
        var name_list;
        if (law) {
            name_list = req.content;
        } else {
            name_list = req.content.split(';'); 
        } 
        var msg = await update_abn_from_name_list(name_list);
        res.json(msg);
        console.log('Finished Updation.');
        return;
    }
    res.json({"msg": "Nothing has been done."});
    console.log('Finished Updation.');
}

module.exports = {
    manage_db
};