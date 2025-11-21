const loginSchemaSwagger = {
	body: {
		type: 'object',
		required: ['emailOrPhone', 'password'],
		properties: {
			emailOrPhone: { type: 'string', example: 'ivan@mail.ru или +79161234567' },
			password: { type: 'string', example: '123456' },
		},
	},
	response: {
		200: {
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						role: { type: 'string', example: 'CLIENT' },
					},
				},
				token: {
					type: 'object',
					properties: {
						accessToken: { type: 'string', example: 'jwt-access-token' },
						refreshToken: { type: 'string', example: 'jwt-refresh-token' },
					},
				},
			},
		},
	},
}

export { loginSchemaSwagger }
