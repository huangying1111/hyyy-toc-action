const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')
const path = require('path')

try {
  // const ignore = core.getInput('ignore')
  // const sender = github.context.sender
  // const head_commit = github.context.head_commit
  // const url = sender.url
  // const author = head_commit.author
  const file = fs.readdirSync(__dirname)
  file.forEach((res) => {
    const fullPath = path.join(__dirname, res)
    const stat = fs.statSync(fullPath)
    const filename = path.basename(res)
    console.log(filename)
  })
} catch (error) {
  core.setFailed(error.message)
}
