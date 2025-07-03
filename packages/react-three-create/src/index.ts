import { GitAttributes, HtmlContent, IndexContent } from './constants.js'
import { GenerateDreiOptions, generateDrei } from './integrations/drei.js'
import { generateFiber, GenerateFiberOptions } from './integrations/fiber.js'
import { generateGithubPages, GenerateGithubPagesOptions } from './integrations/github-pages.js'
import { generateHandle, GenerateHandleOptions } from './integrations/handle.js'
import { generateKoota, GenerateKootaOptions } from './integrations/koota.js'
import { generateLeva, GenerateLevaOptions } from './integrations/leva.js'
import { generateOffscreen, GenerateOffscreenOptions } from './integrations/offscreen.js'
import { generatePostprocessing, GeneratePostprocessingOptions } from './integrations/postprocessing.js'
import { generateRapier, GenerateRapierOptions } from './integrations/rapier.js'
import { generateUikit, GenerateUikitOptions } from './integrations/uikit.js'
import { generateXr, GenerateXrOptions } from './integrations/xr.js'
import { generateZustand, GenerateZustandOptions } from './integrations/zustand.js'
import { generateTriplex, GenerateTriplexOptions } from './integrations/triplex.js'
import { merge } from './merge.js'
import { generateViverse, GenerateViverseOptions } from './integrations/viverse.js'

export * from './utils.js'

export type GenerateOptions = {
  githubUserName?: string
  githubRepoName?: string
  name: string
  language?: 'javascript' | 'typescript'
  fiber?: GenerateFiberOptions
  handle?: GenerateHandleOptions
  drei?: GenerateDreiOptions
  koota?: GenerateKootaOptions
  leva?: GenerateLevaOptions
  offscreen?: GenerateOffscreenOptions
  postprocessing?: GeneratePostprocessingOptions
  rapier?: GenerateRapierOptions
  triplex?: GenerateTriplexOptions
  viverse?: GenerateViverseOptions
  uikit?: GenerateUikitOptions
  xr?: GenerateXrOptions
  zustand?: GenerateZustandOptions
  githubPages?: GenerateGithubPagesOptions
  dependencies?: Record<string, string>
  files?: Record<string, File>
  injections?: Array<{ location: CodeInjectionLocation; code: string }>
  replacements?: Array<{ search: string; replace: string }>
  packageManager?: string
  skipSetup?: boolean
}

export type File =
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'remote'
      url: string
    }

export type CodeInjectionLocation =
  | 'vite-config-import'
  | 'import'
  | 'global-start'
  | 'global-end'
  | 'dom-start'
  | 'dom'
  | 'dom-end'
  | 'scene-start'
  | 'scene'
  | 'scene-end'
  | 'readme-start'
  | 'readme-end'
  | 'readme-libraries'
  | 'readme-tools'
  | 'readme-commands'
  | 'vscode-extension-suggestion'

export type Generator = {
  get options(): GenerateOptions
  addDependency(name: string, semver: string): void
  addFile(path: string, file: File): void
  inject(location: CodeInjectionLocation, code: string): void
  replace(search: string, replace: string): void
  configureVite(object: any): void
}

export function generate(options: GenerateOptions) {
  //deep cloning since integrations might decide to modify the options
  const clonedOptions = structuredClone(options)
  const files: Record<string, File> = {
    ...clonedOptions.files,
  }
  const replacements: Array<{ search: string; replace: string }> = clonedOptions.replacements ?? []
  const dependencies: Record<string, string> = {
    three: '~0.175.0',
    '@react-three/fiber': '^9.0.0',
    'react-dom': '^19.0.0',
    react: '^19.0.0',
    vite: '^6.3.4',
    '@vitejs/plugin-react': '^4.4.1',
    ...clonedOptions.dependencies,
  }
  if (clonedOptions.language === 'typescript') {
    files['tsconfig.json'] = {
      type: 'text',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ESNext',
          module: 'ESNext',
          moduleResolution: 'bundler',
          esModuleInterop: true,
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          outDir: 'dist',
        },
        include: ['src/**/*'],
      }),
    }
    dependencies['@types/three'] = '~0.175.0'
    dependencies['@types/react-dom'] = '^19.0.0'
    dependencies['@types/react'] = '^19.0.0'
  }
  const codeSnippets: Partial<Record<CodeInjectionLocation, Array<string>>> = {
    import: [`import { Canvas } from "@react-three/fiber"`],
    'vite-config-import': ["import react from '@vitejs/plugin-react'"],
  }

  const name = clonedOptions.name ?? 'react-three-app'

  let viteConfig = {
    plugins: ['$raw:react()'],
    resolve: { dedupe: ['three'] },
    base: './',
  }

  const generator: Generator = {
    options: clonedOptions,
    addDependency(name, semver) {
      const existingSemver = dependencies[name]
      if (existingSemver != null) {
        //TODO: intersect existingSemver with semver and write to semver
        //TODO: throw error if no overlap
      }
      dependencies[name] = semver
    },
    addFile(path, content) {
      files[path] = content
    },
    inject(location, code) {
      let entries = codeSnippets[location]
      if (entries == null) {
        codeSnippets[location] = entries = []
      }
      entries.push(code)
    },
    replace(search, replace) {
      replacements.push({ search, replace })
    },
    configureVite(config) {
      viteConfig = merge(viteConfig, config)
    },
  }
  generateDrei(generator, clonedOptions.drei)
  generateHandle(generator, clonedOptions.handle)
  generateKoota(generator, clonedOptions.koota)
  generateLeva(generator, clonedOptions.leva)
  generateOffscreen(generator, clonedOptions.offscreen)
  generatePostprocessing(generator, clonedOptions.postprocessing)
  generateRapier(generator, clonedOptions.rapier)
  generateUikit(generator, clonedOptions.uikit)
  generateXr(generator, clonedOptions.xr)
  generateZustand(generator, clonedOptions.zustand)
  generateFiber(generator, clonedOptions.fiber)
  generateGithubPages(generator, clonedOptions.githubPages)
  generateTriplex(generator, clonedOptions.triplex)
  generateViverse(generator, clonedOptions.viverse)

  for (const { code, location } of clonedOptions.injections ?? []) {
    generator.inject(location, code)
  }

  files['vite.config.js'] = {
    type: 'text',
    content: [
      `import { defineConfig } from 'vite'`,
      ...(codeSnippets['vite-config-import'] ?? []),
      `export default defineConfig(${JSON.stringify(viteConfig).replace(/"\$raw:([^"]+)"/g, (_, raw) => raw)})`,
    ].join('\n'),
  }

  files['package.json'] = {
    type: 'text',
    content: JSON.stringify({
      name,
      type: 'module',
      dependencies,
      scripts: {
        dev: 'vite',
        build: 'vite build',
      },
    }),
  }
  files['.gitignore'] = { type: 'text', content: ['node_modules', 'dist'].join('\n') }
  files['.gitattributes'] = { type: 'text', content: GitAttributes }
  files[`src/index.tsx`] = { type: 'text', content: IndexContent }

  const packageManager = options.packageManager ?? 'npm'
  codeSnippets['readme-libraries'] ??= []
  codeSnippets['readme-libraries'].unshift(
    `[React](https://react.dev/) - A JavaScript library for building user interfaces`,
    `[Three.js](https://threejs.org/) - JavaScript 3D library`,
    `[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - lets you create Three.js scenes using React components`,
  )
  codeSnippets['readme-commands'] ??= []
  codeSnippets['readme-commands'].unshift(
    `\`${packageManager} install\` to install the dependencies`,
    `\`${packageManager} run dev\` to run the development server and preview the app with live updates`,
    `\`${packageManager} run build\` to build the app into the \`dist\` folder`,
  )
  files[`README.md`] = {
    type: 'text',
    content: [
      `# ${name}`,
      `This project was generated with [react-three.org](https://react-three.org)`,
      ...(codeSnippets['readme-start'] ?? []),
      '\n',
      `## Project Architecture`,
      `This project uses [Vite](https://vitejs.dev/) as the bundler for fast development and optimized production builds.`,
      `- \`app.tsx\` defines the main application component containing your 3D content`,
      `- Modify the content inside the \`<Canvas>\` component to change what is visible on screen`,
      `- Static assets can be placed in the \`public\` folder`,
      '\n',
      `## Libraries`,
      `The following libraries are used - checkout the linked docs to learn more`,
      ...(codeSnippets['readme-libraries'] ?? []).map((library) => `- ${library}`),
      '\n',
      codeSnippets['readme-tools'] && `## Tools`,
      ...(codeSnippets['readme-tools'] ?? []).map((tool) => `- ${tool}`),
      codeSnippets['readme-tools'] && `\n`,
      `## Development Commands`,
      ...(codeSnippets['readme-commands'] ?? []).map((command) => `- ${command}`),
      ...(codeSnippets['readme-end'] ?? []),
    ]
      .filter(Boolean)
      .join('\n'),
  }

  codeSnippets['dom-end']?.reverse()
  codeSnippets['global-end']?.reverse()
  codeSnippets['scene-end']?.reverse()
  let appCode = [
    ...(codeSnippets['import'] ?? []),
    ...(codeSnippets['global-start'] ?? []),
    `export function App() {`,
    ' return <>',
    ...(codeSnippets['dom-start'] ?? []),
    ...(codeSnippets['dom'] ?? []),
    '   <Canvas>',
    ...(codeSnippets['scene-start'] ?? []),
    ...(codeSnippets['scene'] ?? []),
    ...(codeSnippets['scene-end'] ?? []),
    '   </Canvas>',
    ...(codeSnippets['dom-end'] ?? []),
    ' </>',
    '}',
    ...(codeSnippets['global-end'] ?? []),
  ].join('\n')
  const indexHtml = HtmlContent.replace(
    '$indexPath',
    clonedOptions.language === 'javascript' ? './src/index.jsx' : './src/index.tsx',
  ).replace('$title', name)

  for (const { search, replace } of replacements) {
    appCode = appCode.replace(search, replace)
  }
  files[`src/app.tsx`] = { type: 'text', content: appCode }
  files[`index.html`] = { type: 'text', content: indexHtml }

  if (codeSnippets['vscode-extension-suggestion']?.length) {
    files['.vscode/extensions.json'] = {
      type: 'text',
      content: JSON.stringify(
        {
          recommendations: codeSnippets['vscode-extension-suggestion'],
        },
        null,
        2,
      ),
    }
  }

  if (clonedOptions.language === 'javascript') {
    //TODO: transpile tsx? to jsx? files}
  }
  //TODO: execute prettier on ts(x), js(x), and json files``

  return files
}
