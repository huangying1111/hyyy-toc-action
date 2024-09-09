const { getInput } = require('@actions/core')
const { Octokit } = require('@octokit/core')
class App {
  _github

  _owner
  _repo
  _token

  _ignore
  _updatePath
  _commitMessage
  _branch = 'master'
  _tree

  _headers = {
    'X-GitHub-Api-Version': '2022-11-28',
  }
  constructor() {
    // 在 GitHub Actions 工作流程中使用
    this._owner = getInput('owner')
    this._repo = getInput('repo')
    this._token = getInput('token')
    this._ignore = getInput('ignore').split(',')
    this._updatePath = getInput('updatePath')
    this._commitMessage = getInput('commitMessage')

    this._github = new Octokit({
      auth: this._token,
    })
    this.init()
  }
  async init() {
    try {
      const branchResponse = await this._github.request(
        'GET /repos/{owner}/{repo}/branches/{branch}',
        {
          owner: this._owner,
          repo: this._repo,
          branch: this._branch,
          headers: this._headers,
        }
      )
      const tree_sha = branchResponse.data.commit.sha
      const menu = await this.getListTree(tree_sha)
      let markdown = ''
      markdown = this.toMarkDown(markdown, menu)
      this.update(markdown)
    } catch (error) {
      console.error('Error:', error)
      process.exit(1)
    }
  }
  getListTree = async (tree_sha) => {
    const getTreePath = await this._github.request(
      'GET /repos/{owner}/{repo}/git/trees/{tree_sha}',
      {
        owner: this._owner,
        repo: this._repo,
        tree_sha: tree_sha,
        recursive: 1,
        headers: this._headers,
      }
    )
    this._tree = getTreePath.data.tree
    console.log('this._tree', this._tree)

    let matchingFiles = getTreePath.data.tree
    if (this._ignore.length > 0) {
      matchingFiles = matchingFiles.filter((file) =>
        this._ignore.every((e) => !file.path.includes(e))
      )
    }
    return matchingFiles
  }

  toMarkDown(markdown, data) {
    data.forEach((item) => {
      const namesArr = `/${item.path}`.split('/')
      markdown += `${item.type == 'tree' ? '###' : '*'} [${
        namesArr[namesArr.length - 1]
      }](https://github.com/${this._owner}/${this._repo}/tree/master${
        item.path
      })\n\n`
    })
    return markdown
  }

  update = async (newContent) => {
    // 获取当前文件内容
    const data = await this._github.request(
      'GET /repos/{owner}/{repo}/commits',
      {
        owner: this._owner,
        repo: this._repo,
        headers: this._headers,
      }
    )
    const currentContent = data.data[0]
    const sha = currentContent.sha
    const content = Buffer.from(newContent).toString('base64')
    const list = this._tree.filter((e) => {
      return e.path == this._updatePath
    })
    console.log('filter', list)
    if (list.length == 0) {
      return console.error(
        'Error:',
        `没有找到 “ ${this._updatePath} ”路径的文件`
      )
    }
    const getPathSha = list[0]?.sha
    await this._github.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: this._owner,
      repo: this._repo,
      message: this._commitMessage,
      parents: [sha],
      path: this._updatePath,
      committer: currentContent.commit.committer,
      content: content,
      headers: this._headers,
      sha: getPathSha,
    })
  }
}

new App()
