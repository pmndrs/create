import type { Generator } from '../index.js'

export type GenerateGithubPagesOptions = {} | boolean

export function generateGithubPages(generator: Generator, options: GenerateGithubPagesOptions | undefined) {
  if (options === false || (generator.options.packageManager ?? 'npm') != 'npm') {
    return
  }
  generator.addFile('.github/workflows/gh-pages.yml', {
    type: 'text',
    content: `name: Deploy to Github Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      contents: read
      id-token: write

    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`,
  })

  generator.inject('readme-start', `A github pages deployment action is configurd.`)
  if (generator.options.githubUserName != null && generator.options.githubRepoName != null) {
    const address = `${generator.options.githubUserName}.github.io/${generator.options.githubRepoName}`
    generator.inject(
      'readme-start',
      `Your app will be publish at [${address}](https://${address}) once the github action is finished.\n`,
    )
  }
}
