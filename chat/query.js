var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'localhost:9200/books'
});

const axios = require('axios');

const openai = axios.create({
    baseURL: 'https://api.openai.com/v1/',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`,
    },
});

// engines/gpt-4/completions
// engines/davinci-codex/completions

async function generateText(msg, maxTokens = 2048, temperature = 0.8) {
    try {
        const response = await openai.post("chat/completions", {
            model: "gpt-3.5-turbo",
            messages: msg
        });
        if (response.data.choices && response.data.choices.length > 0) {
            console.log(JSON.stringify(response.data))
            return response.data.choices[0].message.content;
        } else {
            return '';
        }
    } catch (error) {
        console.error('Error while calling the GPT-4 API:', error);
    }
    return '';
}

async function search_from_knowledge(query) {
    const response = await client.search({
        q: query
    });
    
    const result = response.hits.hits.map(h => {
        let { _source, ...params } = h;
        console.log(params._id, params._score)
        return {
            title: params._id,
            content: _source.body,
            score: params._score
        }
    })
    return result
}

/*
let q = "what does it mean by motor vehicle deductions";
(async query => {
    try {
        const response = await client.search({
            q: query
        });
        console.log("Results found:", response.hits.hits.length)
        let total_context = ''
        response.hits.hits.forEach((h,ind) => {
            //if (ind > 1) return;
            let { _source, ...params } = h;
            total_context += _source.body + "\n"

            console.log("Result found in file: ", params._id, " with score: ", params._score)
        })
        chatgpt(total_context, query)
    } catch (error) {
        console.trace(error.message)
    }
})(q)
*/

async function chatgpt(context, query, hist=[]) {
    var msg = []
    if (context.length > 12000) {
        context = context.slice(0,12000)
    }

    let prompt = `
    According the following knowledge, answer the given question.

    knowledge:
    ${context}

    question:
    ${query}

    answer:
    `

    msg.push({
        role: "user",
        content: prompt
    })
    
    const generatedText = await generateText(msg);
    if (generatedText == '') {
        return null;
    }

    hist.push({
        prompt: prompt,
        answer: generatedText
    })
    return hist
}

module.exports = {
    chatgpt,
    search_from_knowledge
}