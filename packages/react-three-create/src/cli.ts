#!/usr/bin/env node
import { cwd } from 'process'
import { generate, GenerateOptions, generateRandomName } from './index.js'
import { dirname, join } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { Command } from 'commander'
import prompts, { PromptObject } from 'prompts'
import chalk from 'chalk'
import ora from 'ora'
import { fetch } from 'undici'
import { spawn } from 'child_process'
import open from 'open'

// Track child processes for cleanup
const childProcesses = new Set<ReturnType<typeof spawn>>()

// Kill all child processes on termination
function cleanup() {
  for (const child of childProcesses) {
    child.kill()
  }
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

async function loadOptionsFromUrl(url: string): Promise<GenerateOptions> {
  const spinner = ora('Loading template from URL...').start()
  try {
    const response = await fetch(url)
    const options = await response.json()
    spinner.succeed('Create options loaded successfully')
    return options as any
  } catch (error) {
    spinner.fail('Failed to load template')
    throw error
  }
}

async function promptForOptions(name: string): Promise<GenerateOptions> {
  let cancelled = false
  if (name == null) {
    name = (
      await prompts(
        {
          type: 'text',
          name: 'name',
          message: 'What is your project named?',
          initial: 'react-three-app',
          validate: (name: string) => (name.length > 0 ? true : 'Project name is required'),
        },
        {
          onCancel: () => {
            cancelled = true
            return false
          },
        },
      )
    ).name
  }

  if (cancelled) {
    return Promise.reject(`Input cancelled`)
  }

  const questions = [
    {
      type: 'autocomplete',
      name: 'packageManager' as const,
      message: 'Which package manager would you like to use?',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'yarn', value: 'yarn' },
        { title: 'pnpm', value: 'pnpm' },
        { title: 'Other (custom)', value: 'custom' },
      ],
      initial: 0,
    },
    {
      type: (prev) => (prev === 'custom' ? 'text' : null),
      name: 'customPackageManager' as const,
      message: 'Enter your package manager command:',
      validate: (value: string) => (value.length > 0 ? true : 'Package manager command is required'),
    },
    {
      type: 'confirm',
      name: 'skipSetup' as const,
      message:
        'Skip automatic setup? (This will skip installing dependencies, starting the dev server, and opening the browser)',
      initial: false,
    },
    {
      type: 'select',
      name: 'language' as const,
      message: 'Which language would you like to use?',
      choices: [
        { title: 'TypeScript', value: 'typescript' },
        { title: 'JavaScript', value: 'javascript' },
      ],
      initial: 0,
    },
    {
      type: 'multiselect',
      name: 'integrations' as const,
      message: 'Which integrations would you like to include?',
      choices: [
        { title: 'Drei', value: 'drei', selected: true },
        { title: 'Handle', value: 'handle', selected: true },
        { title: 'Leva', value: 'leva', selected: true },
        { title: 'Postprocessing', value: 'postprocessing', selected: true },
        { title: 'Rapier', value: 'rapier', selected: true },
        { title: 'XR', value: 'xr', selected: true },
        { title: 'UIKit', value: 'uikit', selected: true },
        { title: 'Offscreen', value: 'offscreen', selected: true },
        { title: 'Zustand', value: 'zustand', selected: true },
        { title: 'Koota', value: 'koota', selected: true },
        { title: 'Triplex', value: 'triplex', selected: true },
      ],
    },
  ] satisfies Array<PromptObject>

  const answers = await prompts(questions, {
    onCancel: () => {
      cancelled = true
      return false
    },
  })

  if (cancelled) {
    return Promise.reject(`Input cancelled`)
  }

  return {
    name,
    language: answers.language,
    drei: answers.integrations?.includes('drei') ? {} : undefined,
    handle: answers.integrations?.includes('handle') ? {} : undefined,
    leva: answers.integrations?.includes('leva') ? {} : undefined,
    postprocessing: answers.integrations?.includes('postprocessing') ? {} : undefined,
    rapier: answers.integrations?.includes('rapier') ? {} : undefined,
    xr: answers.integrations?.includes('xr') ? {} : undefined,
    uikit: answers.integrations?.includes('uikit') ? {} : undefined,
    offscreen: answers.integrations?.includes('offscreen') ? {} : undefined,
    zustand: answers.integrations?.includes('zustand') ? {} : undefined,
    koota: answers.integrations?.includes('koota') ? {} : undefined,
    triplex: answers.integrations?.includes('triplex') ? {} : undefined,
    packageManager: answers.packageManager === 'custom' ? answers.customPackageManager : answers.packageManager,
    skipSetup: answers.skipSetup,
  }
}

interface CliOptions {
  url?: string
  js?: boolean
  ts?: boolean
  drei?: boolean
  handle?: boolean
  leva?: boolean
  postprocessing?: boolean
  rapier?: boolean
  xr?: boolean
  uikit?: boolean
  offscreen?: boolean
  zustand?: boolean
  koota?: boolean
  triplex?: boolean
  'package-manager'?: string
  'skip-setup'?: boolean
  yes?: boolean
}

async function main() {
  const program = new Command()
    .name('Create React Three')
    .description('Official CLI for creating React Three Fiber projects')
    .argument('[name]', 'name for the app')
    .option('--url <url>', 'URL to the create options from')
    .option('--js', 'use javascript')
    .option('--ts', 'use typescript (default)')
    .option('--drei', 'add @react-three/drei')
    .option('--handle', 'add @react-three/handle')
    .option('--leva', 'add leva')
    .option('--postprocessing', 'add @react-three/postprocessing')
    .option('--rapier', 'add @react-three/rapier')
    .option('--xr', 'add @react-three/xr')
    .option('--uikit', 'add @react-three/uikit')
    .option('--offscreen', 'add @react-three/offscreen')
    .option('--zustand', 'add zustand')
    .option('--koota', 'add koota')
    .option('--triplex', 'set up triplex development environment')
    .option('--package-manager <manager>', 'specify package manager (e.g. npm, yarn, pnpm)')
    .option(
      '--skip-setup',
      'Skip automatically installing dependencies, starting the dev server, and opening the browser after project creation',
    )
    .option('-y, --yes', 'Skip prompts and use default values')
    .action(async (name: string = generateRandomName(), options: CliOptions) => {
      let generateOptions: GenerateOptions

      if (options.url) {
        generateOptions = await loadOptionsFromUrl(options.url)
        generateOptions.name ??= name
      } else if (Object.keys(options).length > 0) {
        generateOptions = {
          name,
          language: options.js ? 'javascript' : 'typescript',
          drei: options.drei ? {} : undefined,
          handle: options.handle ? {} : undefined,
          leva: options.leva ? {} : undefined,
          postprocessing: options.postprocessing ? {} : undefined,
          rapier: options.rapier ? {} : undefined,
          xr: options.xr ? {} : undefined,
          uikit: options.uikit ? {} : undefined,
          offscreen: options.offscreen ? {} : undefined,
          zustand: options.zustand ? {} : undefined,
          koota: options.koota ? {} : undefined,
          triplex: options.triplex,
          packageManager: options['package-manager'],
          skipSetup: options['skip-setup'],
        }
      } else {
        generateOptions = await promptForOptions(name)
      }

      generateOptions.name ??= 'react-three-app'

      const basePath = join(cwd(), generateOptions.name)
      const spinner = ora('Generating project structure...').start()

      try {
        const files = generate(generateOptions)
        const filePaths = Object.keys(files).sort()

        for (const filePath of filePaths) {
          const fullFilePath = join(basePath, filePath)
          await mkdir(dirname(fullFilePath), { recursive: true })
          const file = files[filePath]!

          if (file.type === 'text') {
            await writeFile(fullFilePath, file.content)
          } else {
            const response = await fetch(file.url)
            await writeFile(fullFilePath, response.body!)
          }
        }

        spinner.succeed('Project created successfully!')

        if (generateOptions.skipSetup) {
          console.log(chalk.green('\nNext steps:'))
          console.log(chalk.cyan(`  cd ${generateOptions.name}`))
          console.log(chalk.cyan(`  ${generateOptions.packageManager} install`))
          console.log(chalk.cyan(`  ${generateOptions.packageManager} run dev\n`))
        } else {
          const spinner = ora('Installing dependencies...').start()
          try {
            // Change to project directory
            process.chdir(basePath)

            // Install dependencies based on package manager
            const packageManager = generateOptions.packageManager || 'npm'
            const installCmd = `${packageManager} install`

            await new Promise((resolve, reject) => {
              const child = spawn(installCmd, { shell: true, stdio: 'inherit' })
              childProcesses.add(child)
              child.on('close', (code: number) => {
                childProcesses.delete(child)
                code === 0 ? resolve(undefined) : reject(new Error(`Installation failed with code ${code}`))
              })
            })

            spinner.succeed('Dependencies installed successfully!')

            // Start dev server and open browser
            const devCmd = `${packageManager} run dev`

            console.log(chalk.green('\nStarting development server...'))

            // Spawn the dev server and capture its output
            const devProcess = spawn(devCmd, { shell: true })
            childProcesses.add(devProcess)

            // Listen for the server URL in the output
            let serverUrl: string | undefined
            devProcess.stdout?.on('data', (data: Buffer) => {
              const output = data.toString()
              // Look for the local URL in Vite's output
              const urlMatch = output.match(/:\s+(https?:\/\/[^\s]+)/)
              if (urlMatch && !serverUrl) {
                serverUrl = urlMatch[1]!
                // Open browser once we have the URL
                open(serverUrl)
              }
              // Forward output to parent process
              process.stdout.write(data)
            })

            devProcess.stderr?.on('data', (data: Buffer) => {
              process.stderr.write(data)
            })

            // Handle process exit
            devProcess.on('exit', (code: number) => {
              childProcesses.delete(devProcess)
              if (code !== 0) {
                console.error(chalk.red(`Dev server exited with code ${code}`))
                process.exit(code)
              }
            })
          } catch (error) {
            spinner.fail('Failed to install dependencies')
            console.error(error)
            process.exit(1)
          }
        }
      } catch (error) {
        spinner.fail('Failed to create project')
        console.error(error)
        process.exit(1)
      }
    })

  await program.parseAsync()
}

main().catch(console.error)
