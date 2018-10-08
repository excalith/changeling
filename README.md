<p align="center">
	<h1 align="center">Changeling - <i>A Changelog Generator</i></h1>
</p>
<p align = "center">
    Generates changelogs between commit hashes and creates a clean markdown file with commit prefix sections
</p>
<p align="center">
    <img src="screenshot.gif">
</p>

<p align="center">
	<a href="https://travis-ci.org/excalith/changeling">
		<img alt="Build Status" height="18" src="https://img.shields.io/travis/excalith/changeling.svg">
	</a>
	<a href="https://github.com/excalith/changeling/issues">
		<img alt="Build Status" height="18" src="https://img.shields.io/github/issues/excalith/changeling.svg">
	</a>
	<a href="https://github.com/excalith/changeling/stargazers">
		<img alt="Stars" height="18" src="https://img.shields.io/github/stars/excalith/changeling.svg">
	</a>
	<a href="https://github.com/excalith/changeling/network">
		<img alt="Forks" height="18" src="https://img.shields.io/github/forks/excalith/changeling.svg">
	</a>
</p>

<hr/>

**Changeling** helps you to generate changelogs between commit hashes easily. Depending on your commit message prefixes, your changelog will be created with markdown sections and commit messages with corresponding hashes.

## How To Install:

- Requirements
  - [NodeJS](https://nodejs.org)
  - [NPM](https://www.npmjs.com/get-npm)
- Clone or Download this repository
- Within the directory, from your favorite terminal
  - `npm install`
  - `npm link` (might ask for permission depending on your OS)
- Now you can use `clog` or `changelog` right from your terminal!

## How To Use:
In order to use the app, please follow **How To Install** steps above.

When you complete installation, you can run commands below

### Available Commands:
| _Command_ | _Description_                |
| --------- | ---------------------------- |
| clog      | Run Changeling               |
| clog -s   | Open Settings File In Editor |
| clog -h   | Display This Help            |

### Generating Log File
Whenever you run `clog` app will run by default. You need to fill required fields to generate your changelog. When you are done, changelog will be saved in your git directory.

| _Settings_       | _Description_                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- |
| Title            | Title for your new changelog (ie. Milestone 5)                                      |
| From Commit Hash | Pick from which commit you want to include commits                                  |
| To Commit Hash   | Pick which commit you want to end fetching commits                                  |
| Append or Create | If you generated a changelog before, you can append to it or create a new changelog |
| Check Settings   | Check your settings before creating                                                 |


### Settings
You can update settings by using `clog -s` command. This will open config file within your beloved editor.
Default Settings:

| _Key_           | _Value_      |
| --------------- | ------------ |
| prefixes        | Add          |
|                 | Remove       |
|                 | Improve      |
|                 | Change       |
|                 | Update       |
|                 | Refactor     |
|                 | Fix          |
| defaultFileName | Changelog.md |
| tempFileName    | tempLog.txt  |

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.