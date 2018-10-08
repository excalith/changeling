#!/usr/bin/env node
const fs = require('fs')
const Configstore = require('configstore')
const opn = require('opn')
const chalk = require('chalk')
const cmd = require('node-cmd')
const inquirer = require('inquirer')
const pkg = require('./package.json')

const conf = new Configstore(pkg.name, {
	prefixes: ['Add', 'Remove', 'Improve', 'Change', 'Update', 'Refactor', 'Fix'],
	defaultFileName: 'CHANGELOG.md',
	tempFileName: 'tempLog.txt'
})

// User Parameters
const prefixDictionary = {}
let title = ''
let fromHash = ''
let toHash = ''
let isAppend = false
let log = ''

checkArguments()

// Check Arguments
function checkArguments() {
	const type = process.argv[2]

	if (type === '-h' || type === '--help') {
		showHelp()
	} else if (type === '-s' || type === '--settings') {
		showSettings()
	} else {
		run()
	}
}

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

function showSettings() {
	console.log('Opening config file: ' + conf.path)
	opn(conf.path, {
		wait: false
	})
}

// Get Required Parameters
function run() {
	console.log(chalk.magenta.bold('\nSettings will ask Changelog details'))
	console.log('')
	inquirer
		.prompt([
			{
				message: 'Title:',
				type: 'input',
				name: 'logTitle',
				validate: validateTitle
			},
			{
				message: 'From Commit Hash:',
				type: 'input',
				name: 'fromHash',
				validate: validateHash
			},
			{
				message: 'To Commit Hash:',
				type: 'input',
				name: 'toHash',
				validate: validateHash
			},
			{
				message: 'Append or Create As New Changelog?',
				type: 'list',
				name: 'shouldAppend',
				choices: ['Append', 'Create']
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
				title = answers.logTitle
				fromHash = answers.fromHash
				toHash = answers.toHash
				isAppend = answers.shouldAppend === 'Append'

				console.log('')
				runCommand()
			}
		})
}

// Run Git Log And Save To Temp Log File
function runCommand() {
	// Generate Command
	const command =
		"git log --no-merges --date=short --oneline --pretty=format:'%s *`(#%h)`*' " +
		fromHash +
		'...' +
		toHash +
		' > tempLog.txt'

	// Run Command
	cmd.get(command, err => {
		console.log('')
		if (err) {
			console.log(chalk.red('\n   Could not run command\n   ' + err))
			// Remove Temp log
			fs.unlink('tempLog.txt', err => {
				if (err) {
					return console.log(
						chalk.red('\n   Could not remove temporary log file\n   ' + err)
					)
				}
			})
		} else {
			console.log(chalk.magenta('1. Running Git Log'))
			console.log('   ' + command)
			readLog()
		}
	})
}

// Read From Temp Log File
function readLog() {
	// Get Prefixes From Config
	const prefixes = conf.get('prefixes')
	prefixes.forEach(prefix => {
		prefixDictionary[prefix] = []
	})

	// Check Temp Log
	const tempFile = conf.get('tempFileName')
	if (fs.existsSync(tempFile)) {
		// Read from Temp Log
		const lines = fs.readFileSync(tempFile, 'utf8').split('\n')
		const lineCount = lines.length
		let currentCount = 0

		console.log(chalk.magenta('\n2. Reading Output'))
		console.log('   Total Commits: ' + lineCount + '\n')

		lines.forEach(line => {
			currentCount++

			// Get Add Line To Prefix Dictionary
			const prefix = getFirstWord(line)
			prefixDictionary[prefix].push(line)

			// If Finished Log Output
			if (currentCount === lineCount) {
				const keys = Object.keys(prefixDictionary)
				for (let i = 0; i < keys.length; i++) {
					const entryCount = prefixDictionary[keys[i]].length
					if (entryCount > 0) console.log('   ' + entryCount + ' ' + keys[i])
				}

				generateLogData()
			}
		})
	} else {
		// If Temp Log does not exist, throw error
		console.log(chalk.red('   Git log not found'))
	}
}

// Generate Formatted Log Data
function generateLogData() {
	console.log(chalk.magenta('\n3. Generating Data'))

	log += '\n# ' + title
	log +=
		'\n**Showing Commits Between `' + fromHash + '` and `' + toHash + '`**\n'

	const keys = Object.keys(prefixDictionary)
	for (let i = 0; i < keys.length; i++) {
		const entryCount = prefixDictionary[keys[i]].length

		if (entryCount > 0) {
			log += '\n## ' + keys[i] + '\n' // Prefix Title
			prefixDictionary[keys[i]].forEach(entry => {
				log += formatLogEntry(entry)
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
	// If Append Is True, Append To Changelog.md
	if (isAppend) {
		if (fs.existsSync(fileName)) {
			console.log('   Appended into Changelog.md')
			fs.appendFileSync(fileName, log)
		}
		// If Append Is False, Create A New Changelog
		else {
			console.log(chalk.red('   Changelog.md not found, saving as new'))
			const stream = fs.createWriteStream(fileName)
			stream.once('open', () => {
				stream.write(log)
				stream.end()
			})
		}
	} else {
		console.log('   Saved as ' + title + '.md')
		const stream = fs.createWriteStream(title + '.md')
		stream.once('open', () => {
			stream.write(log)
			stream.end()
		})
	}

	// Remove Temp Git Log File
	fs.unlink('tempLog.txt', err => {
		if (err) {
			return console.log(
				chalk.red(
					chalk.red('\n   Could not remove temporary log file\n   ' + err)
				)
			)
		}
	})
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

// Validate Changelog Title
function validateTitle(str) {
	return !(str === undefined || str === '')
}

// Validate Commit Hash
function validateHash(str) {
	return !(str === undefined || str.length < 7 || str.match('[^a-z A-Z 0-9_]'))
}
