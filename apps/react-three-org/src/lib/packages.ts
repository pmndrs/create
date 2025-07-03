export interface Package {
  id: string
  name: string
  description: string
  githubUrl?: string
  docsUrl: string
}
export const packages: Package[] = [
  {
    id: "drei",
    name: "react-three/drei",
    description:
      "A growing collection of useful helpers and fully functional, ready-made abstractions for @react-three/fiber.",
    githubUrl: "https://github.com/pmndrs/drei",
    docsUrl: "https://docs.pmnd.rs/drei",
  },
  {
    id: "handle",
    name: "react-three/handle",
    description:
      "A cross-platform handle system for react-three-fiber. Create interactive controls and handles for your 3D objects.",
    githubUrl: "https://github.com/pmndrs/xr/tree/main/packages/react/handle",
    docsUrl: "https://pmndrs.github.io/xr/docs/handles/introduction",
  },
  {
    id: "koota",
    name: "koota",
    description:
      "An ECS-based state management library optimized for real-time apps, games, and XR experiences.",
    githubUrl: "https://github.com/pmndrs/koota",
    docsUrl: "https://github.com/pmndrs/koota",
  },
  {
    id: "leva",
    name: "leva",
    description: "A GUI panel for React. Create controls and debug your react-three-fiber scene with ease.",
    githubUrl: "https://github.com/pmndrs/leva",
    docsUrl: "https://github.com/pmndrs/leva",
  },
  {
    id: "offscreen",
    name: "react-three/offscreen",
    description: "Offscreen rendering for react-three-fiber. Render your scene in a worker thread for better performance.",
    githubUrl: "https://github.com/pmndrs/react-three-offscreen",
    docsUrl: "https://github.com/pmndrs/react-three-offscreen",
  },
  {
    id: "postprocessing",
    name: "react-three/postprocessing",
    description: "Post-processing effects for react-three-fiber, using react-postprocessing.",
    githubUrl: "https://github.com/pmndrs/react-postprocessing",
    docsUrl: "https://react-postprocessing.docs.pmnd.rs/",
  },
  {
    id: "rapier",
    name: "react-three/rapier",
    description: "Physics based hooks for react-three-fiber using rapier.js.",
    githubUrl: "https://github.com/pmndrs/react-three-rapier",
    docsUrl: "https://github.com/pmndrs/react-three-rapier",
  },
  {
    id: "uikit",
    name: "react-three/uikit",
    description: "UI components for react-three-fiber. Build interactive interfaces in 3D space.",
    githubUrl: "https://github.com/pmndrs/uikit",
    docsUrl: "https://pmndrs.github.io/uikit/docs/",
  },
  {
    id: "xr",
    name: "react-three/xr",
    description:
      "VR/AR support for react-three-fiber. Build cross-platform XR applications with React.",
    githubUrl: "https://github.com/pmndrs/xr",
    docsUrl: "https://pmndrs.github.io/xr/docs/",
  },
  {
    id: "zustand",
    name: "zustand",
    description: "A small, fast and scalable state-management solution. Perfect for react-three-fiber applications.",
    githubUrl: "https://github.com/pmndrs/zustand",
    docsUrl: "https://zustand.docs.pmnd.rs/",
  },
] as const satisfies Package[]

export const addons = [
  {
    id: 'triplex',
    name: 'Triplex',
    description: 'Build the 2D and 3D web without coding. Your visual workspace for React / Three Fiber.',
    githubUrl: 'https://github.com/try-triplex/triplex',
    docsUrl: 'https://triplex.dev/docs/get-started',
  },
  {
    id: 'viverse',
    name: 'Viverse',
    description: 'Deploy your 3D web apps to the open-platform metaverse ecosystem from HTC.',
    docsUrl: 'https://docs.viverse.com/',
  },
] as const satisfies Package[]

export type ToolIDs = (typeof addons)[number]['id']

export type PackageIDs = (typeof packages)[number]['id']
