import { z } from 'zod'

/**
 * Схема валидации для создания комментария тренером
 */
export const CreateCommentSchema = z.object({
	text: z
		.string({ message: 'Текст комментария обязателен' })
		.min(1, 'Комментарий не может быть пустым')
		.max(1000, 'Комментарий не может превышать 1000 символов')
		.trim(),
})

export type CreateCommentDTO = z.infer<typeof CreateCommentSchema>
