import { FastifyInstance } from 'fastify'

import { loginUser, logoutUser, registerUser } from 'controllers/user.js'
import { refreshTokenService } from 'services/refreshToken.service.js'

import { registerSchema } from '../validation/zod/auth/register.dto.js'
import { loginSchema } from '../validation/zod/auth/login.dto.js'

import { MAX_AGE_30_DAYS } from 'consts/cookie.js'
import { CLIENT } from 'consts/role.js'
import { ApiError } from 'utils/ApiError.js'
import { removeRefreshCookie, setRefreshCookie } from 'utils/refreshCookie.js'
import { authGuard } from 'middleware/auth.js'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export default async function authRoutes(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.post('/signup', { schema: registerSchema }, async (req, reply) => {
			const body = req.body
			const query = req.query

			const role = query.role ?? CLIENT

			const user = await registerUser(body, role)

			setRefreshCookie(reply, user.token.refreshToken, MAX_AGE_30_DAYS)

			return reply.status(201).send({
				user: user.user,
				token: {
					accessToken: user.token.accessToken,
				},
			})
		})

	app
		.withTypeProvider<ZodTypeProvider>()
		.post('/login', { schema: loginSchema }, async (req, reply) => {
			const body = req.body

			const user = await loginUser(body)

			setRefreshCookie(reply, user.token.refreshToken, MAX_AGE_30_DAYS)

			return reply.status(200).send({
				user: user.user,
				token: {
					accessToken: user.token.accessToken,
				},
			})
		})

	app.withTypeProvider<ZodTypeProvider>().post('/refresh', async (req, reply) => {
		const refreshToken = req.cookies.refreshToken

		if (!refreshToken) {
			throw ApiError.unauthorized('Refresh token отсутствует')
		}

		const result = await refreshTokenService({ refreshToken })

		setRefreshCookie(reply, result.token.refreshToken, MAX_AGE_30_DAYS)

		return reply.status(200).send({
			user: result.user,
			token: {
				accessToken: result.token.accessToken,
			},
		})
	})

	app.post('/logout', { preHandler: authGuard }, async (req, reply) => {
		await logoutUser(req.user.id)

		removeRefreshCookie(reply)

		return reply.status(200).send({ message: 'Вы успешно вышли из аккаунта' })
	})
}
