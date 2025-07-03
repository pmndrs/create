import type { Generator } from '../index.js'

export type GenerateViverseOptions = {} | boolean

export function generateViverse(generator: Generator, options: GenerateViverseOptions | undefined) {
  if (options == null || (generator.options.packageManager ?? 'npm') != 'npm') {
    return
  }

  generator.addFile('.github/workflows/viverse.yml', {
    type: 'text',
    content: `name: Deploy to Viverse

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  check-secrets:
    runs-on: ubuntu-latest
    outputs:
      secrets-available: \${{ steps.check.outputs.secrets-available }}
    steps:
      - id: check
        run: |
          if [[ -n "\${{ secrets.VIVERSE_EMAIL }}" && -n "\${{ secrets.VIVERSE_PASSWORD }}" ]]; then
            echo "secrets-available=true" >> $GITHUB_OUTPUT
          else
            echo "secrets-available=false" >> $GITHUB_OUTPUT
          fi

  build-and-deploy:
    runs-on: ubuntu-latest
    needs: check-secrets
    # Only run if secrets are present
    if: needs.check-secrets.outputs.secrets-available == 'true'
    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Install dependencies
        run: npm install

      - name: Build project
        run: npm run build

      - name: Viverse Login
        run: npx viverse-cli auth login -e \${{ secrets.VIVERSE_EMAIL }} -p \${{ secrets.VIVERSE_PASSWORD }}

      - name: Deploy to Viverse
        run: npx viverse-cli app publish ./dist --auto-create-app --name ${generator.options.name}

`,
  })

  generator.addDependency('@viverse/cli', '^0.9.5-beta.8')

  generator.inject(
    'readme-start',
    `A GitHub CI/CD workflow for publishing to Viverse is configured.

To use publish to viverse via the CI/CD workflow:
1. Set \`VIVERSE_EMAIL\` and \`VIVERSE_PASSWORD\` secrets in your repository settings under \`Secrets and Variables\` > \`Actions\` > \`New repository secret\`
2. Manually trigger the "Deploy to Viverse" workflow or push to the main branch

**Manual CLI Upload:**
You can also upload your project manually using the Viverse CLI:
\`\`\`bash
viverse-cli auth login -e <email> -p <password>
npm run build
viverse-cli app publish ./dist --auto-create-app --name ${generator.options.name}
\`\`\`\n`,
  )
}
