import { z } from 'zod'

export const InviteTrainerSchema = z.object({
	trainerId: z
		.string({ message: 'ID тренера обязателен' })
		.cuid({ message: 'Некорректный формат ID тренера' }),
})

export type InviteTrainerDto = z.infer<typeof InviteTrainerSchema>
