import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { calculateCycleDays } from '../utils/nutritionCycle.js'
import { GetClientNutritionPlanQuerySchema } from '../validation/zod/nutrition/get-client-plan.dto.js'
import {
	CreateNutritionDaySchema,
	NutritionDayParamsSchema,
	SubcategoryParamsSchema,
} from '../validation/zod/nutrition/create-day.dto.js'
import { UpdateNutritionDaySchema } from '../validation/zod/nutrition/update-day.dto.js'
import { MealType } from '@prisma/client'

// =============================================
//  Личный назначенный план питания клиента
// =============================================

export async function getClientNutritionPlan(req: FastifyRequest, reply: FastifyReply) {
	const clientId = req.user.id

	// Валидация query параметров
	const queryValidation = GetClientNutritionPlanQuerySchema.safeParse(req.query)
	if (!queryValidation.success) {
		throw ApiError.badRequest(queryValidation.error.issues[0].message)
	}

	const { period = 'day', date } = queryValidation.data

	// Целевая дата (или сегодня)
	const targetDate = date ? new Date(date) : new Date()

	// Получаем активный план клиента
	const assignment = await prisma.clientNutritionPlan.findFirst({
		where: {
			clientId,
			isActive: true,
		},
		orderBy: { createdAt: 'desc' },
		include: {
			subcategory: {
				select: {
					id: true,
					name: true,
					description: true,
				},
			},
		},
	})

	if (!assignment) {
		return reply.status(200).send({
			plan: null,
			days: [],
		})
	}

	const { subcatId, dayIds, startDate } = assignment

	// Получаем дни плана
	const days = await prisma.nutritionDay.findMany({
		where: dayIds.length ? { id: { in: dayIds } } : { subcatId },
		orderBy: { dayOrder: 'asc' },
		include: {
			meals: {
				orderBy: { mealOrder: 'asc' },
			},
		},
	})

	// Вычисляем циклические дни с датами
	const cycleDays = calculateCycleDays(startDate, days, period, targetDate)

	return reply.status(200).send({
		plan: {
			id: assignment.id,
			subcategory: assignment.subcategory,
			startDate: assignment.startDate.toISOString().split('T')[0],
			assignedAt: assignment.createdAt.toISOString(),
		},
		days: cycleDays,
	})
}

// =============================================
//  История планов питания клиента
// =============================================

export async function getClientNutritionHistory(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const clientId = req.user.id
	const query = req.query as { page?: string; limit?: string }

	// Парсинг и валидация параметров пагинации
	const page = Math.max(1, parseInt(query.page || '1', 10))
	const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)))
	const skip = (page - 1) * limit

	// Получаем неактивные планы (история)
	const [history, total] = await Promise.all([
		prisma.clientNutritionPlan.findMany({
			where: {
				clientId,
				isActive: false,
			},
			orderBy: {
				createdAt: 'desc',
			},
			skip,
			take: limit,
			include: {
				subcategory: {
					include: {
						category: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		}),
		prisma.clientNutritionPlan.count({
			where: {
				clientId,
				isActive: false,
			},
		}),
	])

	// Форматируем ответ
	const formattedHistory = history.map((plan) => ({
		id: plan.id,
		categoryName: plan.subcategory.category.name,
		subcategoryName: plan.subcategory.name,
		startDate: plan.startDate.toISOString(),
		assignedAt: plan.createdAt.toISOString(),
		replacedAt: plan.updatedAt.toISOString(),
	}))

	return reply.status(200).send({
		history: formattedHistory,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	})
}

// =============================================
//  Категории
// =============================================

export async function createNutritionCategory(req: FastifyRequest, reply: FastifyReply) {
	const { name, description } = req.body as { name: string; description?: string }

	const existing = await prisma.nutritionCategory.findUnique({
		where: { name },
	})

	if (existing) {
		throw ApiError.badRequest('Категория с таким названием уже существует')
	}

	const category = await prisma.nutritionCategory.create({
		data: {
			name,
			description,
			trainerId: req.user.id,
		},
	})

	return reply.status(201).send(category)
}

export async function getTrainerNutritionCategories(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const categories = await prisma.nutritionCategory.findMany({
		where: { trainerId: req.user.id },
		include: {
			subcategories: true,
		},
	})

	return reply.status(200).send(categories)
}

export async function updateNutritionCategory(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.params as { id: string }
	const { name, description } = req.body as Partial<{ name: string; description: string }>

	const category = await prisma.nutritionCategory.findFirst({
		where: {
			id,
			trainerId: req.user.id,
		},
	})

	if (!category) {
		throw ApiError.notFound('Категория не найдена или нет прав доступа')
	}

	if (name) {
		const existing = await prisma.nutritionCategory.findUnique({
			where: { name },
		})

		if (existing && existing.id !== id) {
			throw ApiError.badRequest('Категория с таким названием уже существует')
		}
	}

	const updated = await prisma.nutritionCategory.update({
		where: { id },
		data: { name, description },
	})

	return reply.status(200).send(updated)
}

export async function deleteNutritionCategory(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.params as { id: string }

	const category = await prisma.nutritionCategory.findFirst({
		where: {
			id,
			trainerId: req.user.id,
		},
	})

	if (!category) {
		throw ApiError.notFound('Категория не найдена или нет прав доступа')
	}

	await prisma.nutritionCategory.delete({
		where: { id },
	})

	return reply.status(204).send()
}

// =============================================
//  Подкатегории
// =============================================

//исправила чтобы с днями можно было создавать

export async function createNutritionSubcategory(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const { id: categoryId } = req.params as { id: string }
	const { name, description, days } = req.body as {
		name: string
		description?: string
		days?: Array<{
			dayTitle: string
			dayOrder: number
			meals: Array<{
				type: MealType
				name: string
				mealOrder: number
				items: string[]
			}>
		}>
	}

	// Проверяем категорию
	const category = await prisma.nutritionCategory.findFirst({
		where: {
			id: categoryId,
			trainerId: req.user.id,
		},
	})

	if (!category) {
		throw ApiError.notFound('Категория не найдена или нет прав доступа')
	}

	// Проверяем уникальность имени
	const existing = await prisma.nutritionSubcategory.findUnique({
		where: { name },
	})

	if (existing) {
		throw ApiError.badRequest('Подкатегория с таким названием уже существует')
	}

	// Создаем подкатегорию (с днями или без)
	const subcategory = await prisma.$transaction(async (tx) => {
		// Создаем подкатегорию
		const createdSubcategory = await tx.nutritionSubcategory.create({
			data: {
				name,
				description,
				categoryId,
			},
		})

		// Если есть дни - создаем их
		if (days && days.length > 0) {
			for (const dayData of days) {
				// Создаем день
				const createdDay = await tx.nutritionDay.create({
					data: {
						subcatId: createdSubcategory.id,
						dayTitle: dayData.dayTitle,
						dayOrder: dayData.dayOrder,
					},
				})

				// Создаем meals для дня
				for (const meal of dayData.meals) {
					await tx.nutritionMeal.create({
						data: {
							dayId: createdDay.id,
							type: meal.type,
							name: meal.name,
							mealOrder: meal.mealOrder,
							items: meal.items,
						},
					})
				}
			}
		}

		return createdSubcategory
	})

	return reply.status(201).send(subcategory)
}
export async function getNutritionSubcategories(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const { id: categoryId } = req.params as { id: string }

	const category = await prisma.nutritionCategory.findFirst({
		where: {
			id: categoryId,
			trainerId: req.user.id,
		},
	})

	if (!category) {
		throw ApiError.notFound('Категория не найдена или нет прав доступа')
	}

	const subcategories = await prisma.nutritionSubcategory.findMany({
		where: { categoryId },
		orderBy: { createdAt: 'asc' },
	})

	return reply.status(200).send(subcategories)
}

export async function updateNutritionSubcategory(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const { id } = req.params as { id: string }
	const { name, description } = req.body as Partial<{ name: string; description: string }>

	// Проверяем права доступа через категорию
	const subcategory = await prisma.nutritionSubcategory.findUnique({
		where: { id },
		include: { category: true },
	})

	if (!subcategory || subcategory.category.trainerId !== req.user.id) {
		throw ApiError.notFound('Подкатегория не найдена или нет прав доступа')
	}

	if (name) {
		const existing = await prisma.nutritionSubcategory.findUnique({
			where: { name },
		})

		if (existing && existing.id !== id) {
			throw ApiError.badRequest('Подкатегория с таким названием уже существует')
		}
	}

	const updated = await prisma.nutritionSubcategory.update({
		where: { id },
		data: { name, description },
	})

	return reply.status(200).send(updated)
}

export async function deleteNutritionSubcategory(
	req: FastifyRequest,
	reply: FastifyReply,
) {
	const { id } = req.params as { id: string }

	// Проверяем права доступа через категорию
	const subcategory = await prisma.nutritionSubcategory.findUnique({
		where: { id },
		include: { category: true },
	})

	if (!subcategory || subcategory.category.trainerId !== req.user.id) {
		throw ApiError.notFound('Подкатегория не найдена или нет прав доступа')
	}

	await prisma.nutritionSubcategory.delete({ where: { id } })

	return reply.status(204).send()
}

export async function getNutritionSubcategory(req: FastifyRequest, reply: FastifyReply) {
	console.log('subcat get')
	const { id } = req.params as { id: string }

	const subcategory = await prisma.nutritionSubcategory.findUnique({
		where: { id },
		include: {
			category: {
				select: {
					trainerId: true,
				},
			},
		},
	})

	if (!subcategory) {
		throw ApiError.notFound('Подкатегория не найдена')
	}

	if (subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	return reply.status(200).send({
		id: subcategory.id,
		categoryId: subcategory.categoryId,
		name: subcategory.name,
		description: subcategory.description,
		createdAt: subcategory.createdAt,
		updatedAt: subcategory.updatedAt,
	})
}

//=============ДНИ===============

// * Создание дня в подкатегории ( /api/nutrition/subcategories/:id/days)

export async function createNutritionDay(req: FastifyRequest, reply: FastifyReply) {
	const paramsValidation = SubcategoryParamsSchema.safeParse(req.params)
	if (!paramsValidation.success) {
		throw ApiError.badRequest('Невалидный ID подкатегории')
	}
	const { id: subcatId } = paramsValidation.data

	const bodyValidation = CreateNutritionDaySchema.safeParse(req.body)
	if (!bodyValidation.success) {
		throw ApiError.badRequest(bodyValidation.error.issues[0].message)
	}

	const { dayTitle, dayOrder, meals } = bodyValidation.data

	// Проверяем подкатегорию и права
	const subcategory = await prisma.nutritionSubcategory.findFirst({
		where: { id: subcatId },
		include: { category: { select: { trainerId: true } } },
	})

	if (!subcategory) throw ApiError.notFound('Подкатегория не найдена')
	if (subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	// Проверяем уникальность порядка дня
	const existingDay = await prisma.nutritionDay.findFirst({
		where: { subcatId, dayOrder },
	})
	if (existingDay) {
		throw ApiError.badRequest(`День с порядком ${dayOrder} уже существует`)
	}

	// Проверяем уникальность порядков приемов пищи
	const mealOrders = meals.map((m) => m.mealOrder)
	if (new Set(mealOrders).size !== mealOrders.length) {
		throw ApiError.badRequest('Порядки приемов пищи должны быть уникальными')
	}

	// Создаем день с приемами пищи
	const day = await prisma.$transaction(async (tx) => {
		const createdDay = await tx.nutritionDay.create({
			data: { subcatId, dayTitle, dayOrder },
		})

		const createdMeals = await Promise.all(
			meals.map((meal) =>
				tx.nutritionMeal.create({
					data: {
						dayId: createdDay.id,
						type: meal.type,
						name: meal.name,
						mealOrder: meal.mealOrder,
						items: meal.items,
					},
				}),
			),
		)

		return { ...createdDay, meals: createdMeals }
	})

	return reply.status(201).send(day)
}

// Получение всех дней подкатегории (Задача 7.2)

export async function getNutritionDays(req: FastifyRequest, reply: FastifyReply) {
	const paramsValidation = SubcategoryParamsSchema.safeParse(req.params)
	if (!paramsValidation.success) {
		throw ApiError.badRequest('Невалидный ID подкатегории')
	}
	const { id: subcatId } = paramsValidation.data

	const subcategory = await prisma.nutritionSubcategory.findFirst({
		where: { id: subcatId },
		include: { category: { select: { trainerId: true } } },
	})

	if (!subcategory) throw ApiError.notFound('Подкатегория не найдена')
	if (subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	const days = await prisma.nutritionDay.findMany({
		where: { subcatId },
		include: { meals: { orderBy: { mealOrder: 'asc' } } },
		orderBy: { dayOrder: 'asc' },
	})

	return reply.status(200).send(days)
}

//Просмотр конкретного дня

export async function getNutritionDay(req: FastifyRequest, reply: FastifyReply) {
	const paramsValidation = NutritionDayParamsSchema.safeParse(req.params)
	if (!paramsValidation.success) {
		throw ApiError.badRequest('Невалидный ID дня')
	}
	const { id } = paramsValidation.data

	const day = await prisma.nutritionDay.findFirst({
		where: { id },
		include: {
			meals: { orderBy: { mealOrder: 'asc' } },
			subcategory: { include: { category: { select: { trainerId: true } } } },
		},
	})

	if (!day) throw ApiError.notFound('День не найден')
	if (day.subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	return reply.status(200).send(day)
}

// Обновление дня - обновление meals

export async function updateNutritionDay(req: FastifyRequest, reply: FastifyReply) {
	console.log('updateNutritionDay', req.body)

	// 1. Валидация params
	const paramsValidation = NutritionDayParamsSchema.safeParse(req.params)
	if (!paramsValidation.success) {
		throw ApiError.badRequest('Невалидный ID дня')
	}
	const { id } = paramsValidation.data

	// 2. Валидация body
	const bodyValidation = UpdateNutritionDaySchema.safeParse(req.body)
	if (!bodyValidation.success) {
		console.log('Validation error:', bodyValidation.error)
		throw ApiError.badRequest(bodyValidation.error.issues[0].message)
	}

	const updates = bodyValidation.data
	console.log('Updates:', updates)

	// 3. Проверка прав доступа
	const day = await prisma.nutritionDay.findFirst({
		where: { id },
		include: {
			subcategory: {
				include: {
					category: {
						select: { trainerId: true },
					},
				},
			},
		},
	})
	console.log('Day from DB:', day)
	if (!day) throw ApiError.notFound('День не найден')
	if (day.subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	// 4. Подготовка данных для обновления дня
	const updateData: any = {}
	if (updates.dayTitle !== undefined) updateData.dayTitle = updates.dayTitle
	if (updates.dayOrder !== undefined) updateData.dayOrder = updates.dayOrder

	// 5. Если есть meals - используем транзакцию
	if (updates.meals && updates.meals.length > 0) {
		const updatedDay = await prisma.$transaction(async (tx) => {
			// Удаляем старые meals
			await tx.nutritionMeal.deleteMany({
				where: { dayId: id },
			})

			// Обновляем поля дня, если есть изменения
			if (Object.keys(updateData).length > 0) {
				await tx.nutritionDay.update({
					where: { id },
					data: updateData,
				})
			}

			// Создаем новые meals (без сохранения в переменную)
			await Promise.all(
				updates.meals.map((meal) =>
					tx.nutritionMeal.create({
						data: {
							dayId: id,
							type: meal.type,
							name: meal.name,
							mealOrder: meal.mealOrder,
							items: meal.items,
						},
					}),
				),
			)

			// Получаем обновленный день с meals
			return await tx.nutritionDay.findUnique({
				where: { id },
				include: { meals: { orderBy: { mealOrder: 'asc' } } },
			})
		})

		return reply.status(200).send(updatedDay)
	}

	// 6. Если нет meals - просто обновляем день
	if (Object.keys(updateData).length === 0) {
		throw ApiError.badRequest('Нет данных для обновления')
	}

	const updatedDay = await prisma.nutritionDay.update({
		where: { id },
		data: updateData,
		include: { meals: { orderBy: { mealOrder: 'asc' } } },
	})

	return reply.status(200).send(updatedDay)
}
export async function deleteNutritionDay(req: FastifyRequest, reply: FastifyReply) {
	const paramsValidation = NutritionDayParamsSchema.safeParse(req.params)
	if (!paramsValidation.success) {
		throw ApiError.badRequest('Невалидный ID дня')
	}
	const { id } = paramsValidation.data

	// Проверяем день и права
	const day = await prisma.nutritionDay.findFirst({
		where: { id },
		include: {
			subcategory: {
				include: {
					category: {
						select: { trainerId: true },
					},
				},
			},
		},
	})

	if (!day) throw ApiError.notFound('День не найден')
	if (day.subcategory.category.trainerId !== req.user?.id) {
		throw ApiError.forbidden('Нет прав доступа')
	}

	// Удаляем день (приемы пищи удалятся каскадно из-за onDelete: Cascade)
	await prisma.nutritionDay.delete({
		where: { id },
	})

	return reply.status(204).send()
}
