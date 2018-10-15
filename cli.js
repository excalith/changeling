#!/usr/bin/env node
const fs = require('fs')
const Configstore = require('configstore')
const opn = require('opn')
const chalk = require('chalk')
const inquirer = require('inquirer')
const git = require('isomorphic-git')
const pkg = require('./package.json')

git.plugins.set('fs', fs)

const conf = new Configstore(pkg.name, {
	prefixes: ['Add', 'Remove', 'Improve', 'Change', 'Update', 'Refactor', 'Fix'],
	defaultFileName: 'CHANGELOG.md'
})

// User Parameters
const prefixDictionary = {}
let tags
let fromCommit = ''
let toCommit = ''
let commits
let data = ''

checkArguments()

// Check Arguments
function checkArguments() {
	const type = process.argv[2]

	if (type === '-h' || type === '--help') {
		showHelp()
	} else if (type === '-s' || type === '--settings') {
		showSettings()
	} else {
		fetchTags()
	}
}

// Show Help
function showHelp() {
	console.log('')
	console.log(chalk.magenta.bold('Changeling Help'))
	console.log('')
	console.log('Commands:')
	console.log('  clog		Run Changeling')
	console.log('  clog -s 	Open Settings File')
	console.log('  clog -h 	Display This Help')
	console.log('')
}

// Show Config JSON File
function showSettings() {
	console.log('Opening config file: ' + conf.path)
	opn(conf.path, {
		wait: false
	})
}

// Fetch All Tags For Selection
async function fetchTags() {
	console.log(chalk.magenta.bold('\nFetching Tags'))
	tags = await git.listTags({dir: '.'})
	console.log('   Done')
	run()
}

// Get Required Parameters
function run() {
	console.log(chalk.magenta.bold('\nSettings will ask Changelog details'))
	inquirer
		.prompt([
			{
				message: 'From Version:',
				type: 'list',
				name: 'fromHash',
				choices: tags
			},
			{
				message: 'To Version:',
				type: 'list',
				name: 'toHash',
				choices: tags
			},
			{
				message: 'Are your settings correct?',
				type: 'list',
				name: 'isConfirmed',
				choices: ['Yes', 'No']
			}
		])
		.then(answers => {
			if (answers.isConfirmed === 'No') {
				run()
			} else {
				fromCommit = answers.fromHash
				toCommit = answers.toHash
				console.log('')
				runCommand()
			}
		})
}

async function runCommand() {
	console.log(chalk.magenta('\n2. Reading Log Meta Data'))

	// Get Prefixes From Config
	const prefixes = conf.get('prefixes')
	prefixes.forEach(prefix => {
		prefixDictionary[prefix] = []
	})

	commits = await git.log({dir: '.', since: fromCommit})

	let currentCount = 0
	commits.forEach(commit => {
		currentCount++

		const logMessage = commit.message.split('\n').shift()
		const logPrefix = getFirstWord(logMessage)

		if (Array.isArray(prefixDictionary[logPrefix])) {
			prefixDictionary[logPrefix].push(logMessage)
		}

		if (currentCount === commits.length) {
			const keys = Object.keys(prefixDictionary)
			for (let i = 0; i < keys.length; i++) {
				const entryCount = prefixDictionary[keys[i]].length
				if (entryCount > 0) console.log('   ' + entryCount + ' ' + keys[i])
			}

			generateLogData()
		}
	})
}

// Generate Formatted Log Data
function generateLogData() {
	console.log(chalk.magenta('\n3. Generating Data'))

	data += '\n## ' + toCommit

	const keys = Object.keys(prefixDictionary)
	for (let i = 0; i < keys.length; i++) {
		const entryCount = prefixDictionary[keys[i]].length

		if (entryCount > 0) {
			data += '\n### ' + keys[i] + '\n' // Prefix Title
			prefixDictionary[keys[i]].forEach(entry => {
				data += formatLogEntry(entry)
			})
		}
	}

	console.log('   Done')
	saveLog()
}

// Save Generated Data As Markdown
function saveLog() {
	console.log(chalk.magenta('\n4. Saving Changelog'))
	const fileName = conf.get('defaultFileName')
	let previousFile = ''

	if (fs.existsSync(fileName)) {
		previousFile = fs.readFileSync(fileName, 'utf8')
		const lines = previousFile.split('\n')
		lines.splice(0, 1)
		previousFile = lines.join('\n')
	}

	const stream = fs.createWriteStream(fileName)
	stream.once('open', () => {
		stream.write('# CHANGELOG\n' + data + previousFile)
		stream.end()
	})

	console.log('   Saved as ' + fileName)
}

// Log Entry Format
function formatLogEntry(line) {
	return '* ' + line + '\n'
}

// Get The First Word For Checking Prefixes
function getFirstWord(str) {
	const spacePosition = str.indexOf(' ')
	if (spacePosition === -1) {
		return str
	}
	return str.substr(0, spacePosition)
}
