const fs = require('fs')
const path = require('path')
const { getInput, setFailed } = require('@actions/core')
const { GitHub } = require('@actions/github')

async function main() {
  try {
    async function searchDirectory(github, owner, repo, directory) {
      try {
        const branches = await github.repos.listBranches({ owner, repo })
        const defaultBranch = branches.data.find(
          (branch) => branch.name === 'master'
        ).name
        // 使用 git ls-tree 命令来查找目录中的文件
        const listTree = await github.repos.getTree({
          owner,
          repo,
          sha: defaultBranch,
          recursive: '1',
        })
        const tree = listTree.data.tree
        const matchingFiles = tree
        if (!!directory) {
          matchingFiles = tree.filter((file) => file.path.startsWith(directory))
        }
        matchingFiles.forEach((file) => console.log(file.path))
      } catch (error) {
        console.error('Error searching directory:', error)
        process.exit(1)
      }
    }

    // 在 GitHub Actions 工作流程中使用
    const token = getInput('token')
    const owner = getInput('owner')
    const repo = getInput('repo')
    const directory = getInput('directory')
    const github = new GitHub(token)
    searchDirectory(github, owner, repo, directory)
  } catch (error) {
    setFailed(error.message)
  }
}

main()
