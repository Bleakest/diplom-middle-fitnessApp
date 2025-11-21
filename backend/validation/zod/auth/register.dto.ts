import { Regex } from 'consts/regex.js'
import { z } from 'zod'

export const registerSchema = {
	querystring: z.object({
		role: z.enum(['CLIENT', 'TRAINER']),
	}),

	body: z.object({
		// обязательные поля
		name: z.string().min(1, 'Имя обязательно'),
		emailOrPhone: z.string().refine(
      (val) => Regex.email.test(val) || Regex.phone.test(val),
      'Введите корректный email или российский номер телефона'
    ),

		password: z
			.string()
			.min(5, 'Пароль должен быть минимум 5 символов')
			.max(10, 'Пароль не должен превышать 10 символов'),

		// необязательные поля профиля
		age: z.number().int().positive().optional(),
		weight: z.number().positive().optional(),
		height: z.number().positive().optional(),
		waist: z.number().positive().optional(),
		chest: z.number().positive().optional(),
		hips: z.number().positive().optional(),
		arm: z.number().positive().optional(),
		leg: z.number().positive().optional(),
		goal: z.string().optional(),
		restrictions: z.string().optional(),
		experience: z.string().optional(),
		diet: z.string().optional(),
		photoFront: z.string().url().optional(),
		photoSide: z.string().url().optional(),
		photoBack: z.string().url().optional(),

		// соцсети
		telegram: z.string().optional(),
		whatsapp: z.string().optional(),
		instagram: z.string().optional(),
		bio: z.string().max(500, 'Bio слишком длинное').optional(),
	}),
}

export type RegisterDTO = z.infer<typeof registerSchema.body>
export type RegisterQuery = z.infer<typeof registerSchema.querystring>

