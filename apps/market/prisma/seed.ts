import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pmndrs.market' },
    update: {},
    create: {
      email: 'admin@pmndrs.market',
      name: 'Admin User',
      isAdmin: true,
      apiKey: `pmndrs_admin_${nanoid(32)}`,
      emailVerified: true,
    }
  })

  // Create regular user
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@pmndrs.market' },
    update: {},
    create: {
      email: 'user@pmndrs.market',
      name: 'Test User',
      isAdmin: false,
      apiKey: `pmndrs_user_${nanoid(32)}`,
      emailVerified: true,
    }
  })

  // Create some tags
  const reactTag = await prisma.tag.upsert({
    where: { name: 'react' },
    update: {},
    create: { name: 'react' }
  })

  const threeTag = await prisma.tag.upsert({
    where: { name: 'three' },
    update: {},
    create: { name: 'three' }
  })

  const componentTag = await prisma.tag.upsert({
    where: { name: 'component' },
    update: {},
    create: { name: 'component' }
  })

  // Create an artifact recipe
  const artifactRecipe = await prisma.recipe.create({
    data: {
      name: 'mesh-component',
      description: 'A basic 3D mesh component for React Three Fiber',
      type: 'ARTIFACT',
      userId: regularUser.id,
      versions: {
        create: {
          version: '1.0.0',
          approved: true,
          edits: {
            'src/MeshComponent.tsx': `import { useRef } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

export function MeshComponent(props: any) {
  const meshRef = useRef<Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta
    }
  })

  return (
    <mesh ref={meshRef} {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}`
          }
        }
      },
      tags: {
        create: [
          { tag: { connect: { id: reactTag.id } } },
          { tag: { connect: { id: threeTag.id } } },
          { tag: { connect: { id: componentTag.id } } }
        ]
      }
    }
  })

  // Create an example recipe that depends on the artifact
  const exampleRecipe = await prisma.recipe.create({
    data: {
      name: 'mesh-component-demo',
      description: 'Demo showcasing the mesh component',
      type: 'EXAMPLE',
      userId: regularUser.id,
      versions: {
        create: {
          version: '1.0.0',
          approved: false,
          edits: {
            'src/App.tsx': `import { Canvas } from '@react-three/fiber'
import { MeshComponent } from 'mesh-component'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <MeshComponent position={[0, 0, 0]} />
      </Canvas>
    </div>
  )
}`
          }
        }
      },
      tags: {
        create: [
          { tag: { connect: { id: reactTag.id } } },
          { tag: { connect: { id: threeTag.id } } }
        ]
      }
    }
  })

  console.log('✅ Seed data created successfully!')
  console.log('📧 Admin user:', adminUser.email, '(API Key:', adminUser.apiKey, ')')
  console.log('📧 Test user:', regularUser.email, '(API Key:', regularUser.apiKey, ')')
  console.log('📦 Created artifact recipe:', artifactRecipe.name)
  console.log('🔥 Created example recipe:', exampleRecipe.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })