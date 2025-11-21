import { z } from 'zod'
import { Regex } from 'consts/regex.js'

export const loginSchema = {
	body: z.object({
		emailOrPhone: z
			.string()
			.refine(
				(val) => Regex.email.test(val) || Regex.phone.test(val),
				'Введите корректный email или российский номер телефона',
			),

		password: z
			.string()
			.min(6, 'Минимальная длина пароля — 6 символов')
			.max(10, 'Максимальная длина пароля — 10 символов'),
	}),
}

export type LoginDTO = z.infer<typeof loginSchema.body>
