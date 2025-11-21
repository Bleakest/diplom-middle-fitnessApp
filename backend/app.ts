import Fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCookie from '@fastify/cookie'
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from 'middleware/globalErrorHandler.js'

import authRoutes from './routes/auth.routes.js'

const app = Fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.withTypeProvider<ZodTypeProvider>()

errorHandler(app)

app.register(fastifyCookie, {
	secret: process.env.COOKIE_SECRET,
	parseOptions: {
		// secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		sameSite: 'lax',
	},
})

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'Онлайн фитнес-тренер API',
			description: 'API для платформы онлайн фитнес-тренера',
			version: '1.0.0',
		},
	},
	transform: jsonSchemaTransform,
})

// Документация будет доступна по /docs
app.register(fastifySwaggerUi, {
	routePrefix: '/docs',
})

app.register(authRoutes, { prefix: '/auth' })

export default app
