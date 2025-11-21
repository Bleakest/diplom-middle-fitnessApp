const registerSchemaSwagger = {
	querystring: {
		type: 'object',
		properties: {
			role: { type: 'string', enum: ['CLIENT', 'TRAINER'], example: 'CLIENT' },
		},
	},
	body: {
		type: 'object',
		required: ['name', 'emailOrPhone', 'password'],
		properties: {
			name: { type: 'string', example: 'Иван Иванов' },
			emailOrPhone: { type: 'string', example: 'ivan@mail.ru или +79161234567' },
			password: { type: 'string', minLength: 5, maxLength: 10, example: '123456' },

			// client
			age: { type: 'number', example: 25 },
			weight: { type: 'number', example: 70 },
			height: { type: 'number', example: 175 },
			waist: { type: 'number', example: 80 },
			chest: { type: 'number', example: 95 },
			hips: { type: 'number', example: 90 },
			arm: { type: 'number', example: 30 },
			leg: { type: 'number', example: 50 },
			goal: { type: 'string', example: 'Похудеть' },
			restrictions: { type: 'string', example: 'Нет ограничений' },
			experience: { type: 'string', example: 'Начальный уровень' },
			diet: { type: 'string', example: 'Белковая' },
			photoFront: {
				type: 'string',
				format: 'url',
				example: 'https://example.com/front.jpg',
			},
			photoSide: {
				type: 'string',
				format: 'url',
				example: 'https://example.com/side.jpg',
			},
			photoBack: {
				type: 'string',
				format: 'url',
				example: 'https://example.com/back.jpg',
			},

			// trainer
			telegram: { type: 'string', example: '@ivan' },
			whatsapp: { type: 'string', example: '+79161234567' },
			instagram: { type: 'string', example: '@ivan_insta' },
			bio: { type: 'string', maxLength: 500, example: 'Люблю спорт' },
		},
	},
	response: {
		201: {
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

export { registerSchemaSwagger }
