import { z } from 'zod'

const MealTypeEnum = z.enum(['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'])

export const CreateNutritionDaySchema = z.object({
	dayTitle: z
		.string()
		.min(1, 'Название дня обязательно')
		.max(100, 'Название дня не должно превышать 100 символов')
		.describe('Название дня питания'),

	dayOrder: z
		.number()
		.int('Порядок дня должен быть целым числом')
		.min(1, 'Порядок дня должен быть положительным числом')
		.max(31, 'План питания не может содержать более 31 дня')
		.describe('Порядковый номер дня'),

	meals: z
		.array(
			z.object({
				type: MealTypeEnum,
				name: z
					.string()
					.min(1, 'Название приема пищи обязательно')
					.max(100, 'Название приема пищи не должно превывать 100 символов'),

				mealOrder: z
					.number()
					.int('Порядок приема пищи должен быть целым числом')
					.min(1, 'Порядок приема пищи должен быть положительным числом'),
				items: z
					.array(z.string().min(1, 'Элемент не может быть пустым').max(500))
					.min(1, 'Добавьте хотя бы один продукт')
					.max(20, 'Не более 20 продуктов в одном приеме пищи'),
			}),
		)
		.min(1, 'Добавьте хотя бы один прием пищи')
		.max(10, 'Не более 10 приемов пищи в дне')
		.describe('Массив приемов пищи'),
})

export type CreateNutritionDayDto = z.infer<typeof CreateNutritionDaySchema>

export const NutritionDayParamsSchema = z.object({
	id: z.string().cuid('ID дня должен быть валидным CUID'),
})

export type NutritionDayParams = z.infer<typeof NutritionDayParamsSchema>

export const SubcategoryParamsSchema = z.object({
	id: z.string().cuid('ID подкатегории должен быть валидным CUID'),
})

export type SubcategoryParams = z.infer<typeof SubcategoryParamsSchema>
