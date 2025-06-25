import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import cors from '@fastify/cors'

const server = Fastify()

await server.register(cors, { origin: 'https://react-three.org' })

// Add schema validator and serializer
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.withTypeProvider<ZodTypeProvider>().get(
  '/',
  {
    schema: {
      querystring: z.object({
        prompt: z.string(),
      }),
    },
  },
  async (request, response) => {
    const { prompt } = request.query
    const fetchResponse = await fetch(`https://api.beta.drawcall.ai/pick/v1?prompt=${prompt}`, {
      headers: { authorization: `Bearer ${process.env.DRAWCALL_AI_TOKEN}` },
    })
    return response.status(fetchResponse.status).send(await fetchResponse.json())
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
