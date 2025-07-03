<h1 align="center">@react-three/create</h1>
<h3 align="center">Official CLI for creating React Three Fiber projects</h3>
<br/>

<p align="center">
  <a href="https://npmjs.com/package/@react-three/create" target="_blank">
    <img src="https://img.shields.io/npm/v/@react-three/create?style=flat&colorA=000000&colorB=000000" alt="NPM" />
  </a>
  <a href="https://npmjs.com/package/@react-three/create" target="_blank">
    <img src="https://img.shields.io/npm/dt/@react-three/create.svg?style=flat&colorA=000000&colorB=000000" alt="NPM" />
  </a>
  <a href="https://twitter.com/pmndrs" target="_blank">
    <img src="https://img.shields.io/twitter/follow/pmndrs?label=%40pmndrs&style=flat&colorA=000000&colorB=000000&logo=twitter&logoColor=000000" alt="Twitter" />
  </a>
  <a href="https://discord.gg/ZZjjNvJ" target="_blank">
    <img src="https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=000000" alt="Discord" />
  </a>
</p>

Create a new React Three project using the following command:

```bash
npm create @react-three
```

### Arguments

- `[name]` - Optional name for your application. If not provided, you'll be prompted to enter one.

### Options

| Option | Description |
|--------|-------------|
| `--url <url>` | Specify a custom URL to fetch create options from |
| `--js` | Use JavaScript instead of TypeScript |
| `--ts` | Use TypeScript (default) |
| `--drei` | Add [@react-three/drei](https://github.com/pmndrs/drei) for useful helpers and abstractions |
| `--handle` | Add [@react-three/handle](https://github.com/pmndrs/handle) for event handling |
| `--leva` | Add [leva](https://github.com/pmndrs/leva) for creating controls and panels |
| `--postprocessing` | Add [@react-three/postprocessing](https://github.com/pmndrs/postprocessing) for post-processing effects |
| `--rapier` | Add [@react-three/rapier](https://github.com/pmndrs/rapier) for physics |
| `--xr` | Add [@react-three/xr](https://github.com/pmndrs/xr) for VR/AR support |
| `--uikit` | Add [@react-three/uikit](https://github.com/pmndrs/uikit) for UI components |
| `--offscreen` | Add [@react-three/offscreen](https://github.com/pmndrs/offscreen) for offscreen rendering |
| `--zustand` | Add [zustand](https://github.com/pmndrs/zustand) for state management |
| `--koota` | Add [koota](https://github.com/pmndrs/koota) for animation |
| `--triplex` | Add [Triplex](https://triplex.dev) for a visual development environment |
| `--viverse` | Setup [viverse](https://docs.viverse.com) deplyoment |
| `--package-manager <manager>` | Specify package manager (npm, yarn, or pnpm) |
| `--skip-setup` | Skip automatic dependency installation, dev server start, and browser opening |
| `-y, --yes` | Skip prompts and use default values |

### Examples

Create a new project with TypeScript and drei:
```bash
npm create @react-three my-app --drei
```

Create a project with JavaScript and multiple features:
```bash
npm create @react-three my-app --js --drei --leva --zustand
```

Create a project using pnpm:
```bash
npm create @react-three my-app --package-manager pnpm
```

## Sponsors

This project is supported by a few companies and individuals building cutting edge 3D Web & XR experiences. Check them out!

![Sponsors Overview](https://bbohlender.github.io/sponsors/screenshot.png)