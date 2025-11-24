import { ApiError } from '../utils/ApiError.js'
import type { FastifyInstance, FastifyError } from 'fastify'

export const errorHandler = (app: FastifyInstance) => {
	app.setErrorHandler((error: FastifyError, request, reply) => {
		// Обработка ошибок парсинга JSON
		if (error.code === 'FST_ERR_CTP_INVALID_JSON_BODY') {
			return reply.status(400).send({
				error: {
					message: 'Некорректный JSON в теле запроса',
					statusCode: 400,
				},
			})
		}

		// Обработка ошибок валидации Fastify
		if (error.validation) {
			return reply.status(400).send({
				error: {
					message: error.message || 'Ошибка валидации',
					statusCode: 400,
				},
			})
		}

		// Обработка кастомных ApiError
		if (error instanceof ApiError) {
			return reply.status(error.statusCode).send({
				error: {
					message: error.message,
					statusCode: error.statusCode,
				},
			})
		}

		// Обработка всех остальных ошибок
		console.error(error)
		return reply.status(500).send({
			error: {
				message: 'Внутренняя ошибка сервера',
				statusCode: 500,
			},
		})
	})
}
