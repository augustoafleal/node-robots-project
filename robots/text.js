const wiki = require('wikipedia')
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apikey
const watsonApiUrl = require('../credentials/watson-nlu.json').url
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
    version: '2022-04-07',
    authenticator: new IamAuthenticator({
        apikey: watsonApiKey,
    }),
    serviceUrl: watsonApiUrl,
})

const state = require('./state')


async function textRobot() {
    console.log('> [text-robot] Starting...')
    const content = state.load()
    
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordsOfAllSentences(content)
    cleanKeywords(content) 
    
    state.save(content)

    async function fetchContentFromWikipedia(content) {
        console.log('> [text-robot] Fetching content from Wikipedia.')
        try {
            const page = await wiki.page(content.searchTerm)
            const wikipediaContent = await page.content({ autoSuggest: true })
            content.sourceContentOriginal = wikipediaContent

            console.log('> [text-robot] Fetching done.')
        } catch (error) {
            console.log(error)
        }

    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split("\n")

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {

                if (line.trim().length === 0 || line.trim().startsWith("=")) {
                    return false
                }

                return true

            })

            return withoutBlankLinesAndMarkdown.join(' ')

        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

    function limitMaximumSentences(content) {

       content.sentences = content.sentences.slice(0, content.maximumSentences)

    }

    async function fetchKeywordsOfAllSentences(content) {
        console.log('> [text-robot] Starting to fetch keywords from Watson')

        for (const sentence of content.sentences) {

            console.log(`> [text-robot] Sentence: "${sentence.text}"`)
            
            try {
                sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
                console.log(`> [text-robot] Keywords: ${sentence.keywords.join(', ')}\n`)
            }
            catch (e) {
                console.log(e); 
            }

        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {

        const analyzeParams = {
            'features': {
                'keywords': {}
            },
            'text': sentence
        };

        return naturalLanguageUnderstanding.analyze(analyzeParams)
            .then(analysisResults => {

                const keywords = analysisResults.result.keywords.map((keyword) => {
                    return keyword.text
                })

                return keywords

            })
            .catch(err => {
                console.log('error:', err);

                return
            });
    }

    function cleanKeywords(content) {

        for (const sentence of content.sentences) {
            if (sentence.keywords === undefined || sentence.keywords.length === 0) {

                let index = content.sentences.indexOf(sentence)
                content.sentences.splice(index, 1)

            }
        }

    }

}

module.exports = {
    textRobot
}


