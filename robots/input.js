const readline = require('readline-sync')
const state = require('./state')

function inputRobot() {

    const content = {
        maximumSentences: 7
    }
    
    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()
    state.save(content)
    
    function askAndReturnSearchTerm() {
        return readline.question("Select a Wikipedia search term: ")
    }
    
    function askAndReturnPrefix() {
        const prefixes = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Choose one option: ')
        const selectedPrefixText = prefixes[selectedPrefixIndex]
        
        return selectedPrefixText
    }

}

module.exports = {
    inputRobot
}