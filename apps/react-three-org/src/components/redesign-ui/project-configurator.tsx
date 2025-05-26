import { Copy } from 'lucide-react'
import { generate } from '@react-three/create'
import JSZip from 'jszip'
import { toast } from 'sonner'

interface ProjectConfiguratorProps {
  selections: string[]
  createGithubRepo: () => void
}

export const ProjectConfigurator = ({ selections, createGithubRepo }: ProjectConfiguratorProps) => {
  const command = `npm create @react-three ${selections.length > 0 ? '-- ' : ''}${selections
    .map((id) => `--${id}`)
    .join(' ')}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy command')
    }
  }

  const downloadProject = async () => {
    const element = document.createElement('a')
    const options: any = {}
    for (const selection of selections) {
      options[selection] = true
    }
    const files = generate(options)
    console.log(files)
    const zip = new JSZip()
    // Write each file into the zip
    for (const [path, file] of Object.entries(files)) {
      const parts = path.split('/').filter(Boolean)

      let currentFolder = zip
      // Create nested folders if needed
      for (let i = 0; i < parts.length - 1; i++) {
        currentFolder = currentFolder.folder(parts[i]!)!
      }
      // Add the file
      let content: string | Blob
      if (file.type === 'text') {
        content = file.content
      } else {
        // For remote files, we'll need to fetch them first
        const response = await fetch(file.url)
        content = await response.blob()
      }
      currentFolder.file(parts[parts.length - 1]!, content)
    }
    const content = await zip.generateAsync({ type: 'blob' })
    element.href = URL.createObjectURL(content)
    element.download = 'react-three-app.zip'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="w-full sticky bottom-0 left-0 p-6 flex flex-col gap-4 border-t border-redesign-gray bg-redesign-black">
      <div className="w-full flex items-center gap-4 py-4 px-6 border border-redesign-gray">
        <p className="w-full text-base whitespace-nowrap overflow-hidden text-ellipsis">{'>_ ' + command}</p>
        <button onClick={copyToClipboard} aria-label="Copy command to clipboard">
          <Copy className="w-4 h-4 text-redesign-white" />
        </button>
      </div>
      <div className="w-full flex flex-col md:flex-row items-center gap-4">
        <p className="w-full hidden md:block text-base text-redesign-white/50">
          {selections.length} {selections.length === 1 ? 'package' : 'packages'} selected
        </p>
        <div className="flex items-center gap-2 w-full justify-end">
          <button
            className="bg-redesign-dark px-4 py-2 h-fit w-full justify-center md:w-fit flex items-center gap-2"
            onClick={downloadProject}
          >
            <p>Download</p>
          </button>
          <button
            className="bg-redesign-dark px-4 py-2 w-full h-fit justify-center md:w-fit flex items-center gap-2"
            onClick={createGithubRepo}
          >
            <p className="text-nowrap">Create Repo</p>
          </button>
        </div>
      </div>
    </div>
  )
}
