const { default: axios } = require("axios");
const { request, response } = require("express");
const { ANZIC_AI_URL } = require("./config");

function legislation_query(query, callback) {
    query = query.toLowerCase();
    query = encodeURI(query);
    
    var endpoint_mpnet = `${ANZIC_AI_URL}/legislation/${query}`;
    console.log(endpoint_mpnet)
    axios.get(endpoint_mpnet)
    .then(response=>{
        let result = response.data
        console.log(result);
        callback(result);
    });
}

module.exports = {
    legislation_query
}