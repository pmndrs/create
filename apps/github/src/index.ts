import { generate, generateRandomName } from '@react-three/create'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { upload } from './upload.js'
import { OAuthApp } from '@octokit/oauth-app'
import cors from '@fastify/cors'
import { Octokit } from '@octokit/rest'

const oauthApp = new OAuthApp({
  clientType: 'oauth-app',
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
})

const server = Fastify({
  logger: {
    level: 'error',
  },
})

await server.register(cors)

// Add schema validator and serializer
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

// Define the response schema
const GenerateOptionsSchema = z.object({
  token: z.string(),
  name: z.string().optional(),
  language: z.enum(['javascript', 'typescript']).optional(),
  handle: z.boolean().optional(),
  drei: z.boolean().optional(),
  koota: z.boolean().optional(),
  leva: z.boolean().optional(),
  offscreen: z.boolean().optional(),
  postprocessing: z.boolean().optional(),
  rapier: z.boolean().optional(),
  uikit: z.boolean().optional(),
  xr: z.boolean().optional(),
  triplex: z.boolean().optional(),
  zustand: z.boolean().optional(),
  viverse: z.boolean().optional(),
})

server
  .withTypeProvider<ZodTypeProvider>()
  .post(
    '/repo',
    {
      schema: {
        body: GenerateOptionsSchema,
      },
    },
    async ({ body: { token, ...options } }) => {
      const name = options.name ?? `react-three-${generateRandomName()}`
      const octokit = new Octokit({ auth: token })
      const {
        data: { login, name: username, email },
      } = await octokit.users.getAuthenticated()
      const files = generate({ name, ...options, githubRepoName: name, githubUserName: login })
      const url = await upload(octokit, name, username!, login, email!, files, token)
      return { url }
    },
  )
  .get(
    '/oauth',
    {
      schema: {
        querystring: z.object({
          code: z.string(),
        }),
      },
    },
    async (request) => {
      const { code } = request.query
      const { authentication } = await oauthApp.createToken({ code })
      return {
        token: authentication.token,
      }
    },
  )

const start = async () => {
  try {
    await server.listen({ port: 8080, host: '0.0.0.0' })
    console.log('Server is running on http://localhost:8080')
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
