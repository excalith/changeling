#!/usr/bin/env node
const fs = require('fs')
const chalk = require('chalk')
const cmd = require('node-cmd')
const inquirer = require('inquirer')

// Filenames
const tempLog = 'tempLog.txt'
const changeLog = 'Changelog.md'

// Commit Prefix Arrays
const add = []
const remove = []
const improve = []
const change = []
const update = []
const refactor = []
const fix = []

// User Parameters
let title = ''
let fromHash = ''
let toHash = ''
let isAppend = false
let log = ''

start()

// Get Required Parameters
function start() {
	console.log(chalk.white.bold('\nSettings will ask Changelog details'))
	console.log('')
	inquirer
		.prompt([
			{
				message: 'Milestone Title:',
				type: 'input',
				name: 'milestoneTitle',
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
				start()
			} else {
				title = answers.milestoneTitle
				fromHash = answers.fromHash
				toHash = answers.toHash
				isAppend = answers.shouldAppend === 'Append'

				console.log('')
				runCommand()
			}
		})
}

// Save Git Log Output To Temp Log File
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
	// Check Temp Log
	if (fs.existsSync(tempLog)) {
		// Read from Temp Log
		const lines = fs.readFileSync(tempLog, 'utf8').split('\n')
		const lineCount = lines.length
		let currentCount = 0

		console.log(chalk.magenta('\n2. Reading Output'))
		console.log('   ' + lineCount + ' lines of commit')

		lines.forEach(line => {
			currentCount++
			if (getFirstWord(line).includes('Add')) {
				add.push(line)
			} else if (getFirstWord(line).includes('Remove')) {
				remove.push(line)
			} else if (getFirstWord(line).includes('Improve')) {
				improve.push(line)
			} else if (getFirstWord(line).includes('Change')) {
				change.push(line)
			} else if (getFirstWord(line).includes('Update')) {
				update.push(line)
			} else if (getFirstWord(line).includes('Refactor')) {
				refactor.push(line)
			} else if (getFirstWord(line).includes('Fix')) {
				fix.push(line)
			}

			if (currentCount === lineCount) {
				console.log('   ' + add.length + ' adds')
				console.log('   ' + improve.length + ' improvements')
				console.log('   ' + change.length + ' changes')
				console.log('   ' + update.length + ' updates')
				console.log('   ' + refactor.length + ' refactoring')
				console.log('   ' + remove.length + ' removes')
				console.log('   ' + fix.length + ' fixes')

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

	if (add.length > 0) {
		log += '\n## Added\n'

		add.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (improve.length > 0) {
		log += '\n## Improved\n'

		improve.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (change.length > 0) {
		log += '\n## Changed\n'

		change.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (update.length > 0) {
		log += '\n## Changed\n'

		update.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (refactor.length > 0) {
		log += '\n## Refactored\n'

		refactor.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (remove.length > 0) {
		log += '\n## Removed\n'

		remove.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	if (fix.length > 0) {
		log += '\n## Fixed\n'

		fix.forEach(line => {
			log += formatLogEntry(line)
		})
	}

	console.log('   Done')
	saveLog()
}

// Save Generated Data As Markdown
function saveLog() {
	console.log(chalk.magenta('\n4. Saving Changelog'))

	// If Append Is True, Append To Changelog.md
	if (isAppend) {
		if (fs.existsSync(changeLog)) {
			console.log('   Appended into Changelog.md')
			fs.appendFileSync(changeLog, log)
		}
		// If Append Is False, Create A New Changelog
		else {
			console.log('   Changelog.md not found, saving as new')
			const stream = fs.createWriteStream(changeLog)
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
				chalk.red('\n   Could not remove temporary log file\n   ' + err)
			)
		}
	})
}

// Log Entry Format
function formatLogEntry(line) {
	return '- ' + line + '\n'
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
