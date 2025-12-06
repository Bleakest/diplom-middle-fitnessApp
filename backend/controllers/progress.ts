import { prisma } from '../prisma.js'
import { CreateProgressDTO } from '../validation/zod/progress/progress.dto.js'
import { CreateCommentDTO } from '../validation/zod/progress/comment.dto.js'
import { GetProgressCommentsQueryDTO } from '../validation/zod/progress/get-comments.dto.js'
import { parseDateString, getDayRange } from '../services/date.service.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Создание нового отчета о прогрессе
 * @param userId - ID пользователя
 * @param data - Данные отчета (измерения и дата)
 * @param filesMap - Объект с путями к загруженным фотографиями
 * @returns Созданный отчет о прогрессе
 */
export async function createProgress(
	userId: string,
	data: CreateProgressDTO,
	filesMap: Record<string, string>,
) {
	// Парсим дату из формата ДД/ММ/ГГГГ
	const reportDate = parseDateString(data.date)

	// Проверяем, существует ли уже отчет за эту дату
	const dateRange = getDayRange(reportDate)
	const existingReport = await prisma.progress.findFirst({
		where: {
			userId,
			date: {
				gte: dateRange.start,
				lt: dateRange.end,
			},
		},
	})

	if (existingReport) {
		throw ApiError.badRequest('Отчет за эту дату уже существует')
	}

	// Создаем новый отчет о прогрессе
	const progress = await prisma.progress.create({
		data: {
			userId,
			date: reportDate,
			// Обязательные поля
			weight: data.weight,
			waist: data.waist,
			hips: data.hips,
			// Опциональные поля
			...(data.height !== undefined && { height: data.height }),
			...(data.chest !== undefined && { chest: data.chest }),
			...(data.arm !== undefined && { arm: data.arm }),
			...(data.leg !== undefined && { leg: data.leg }),
			// Фото (опциональные)
			...(filesMap.photoFront && { photoFront: filesMap.photoFront }),
			...(filesMap.photoSide && { photoSide: filesMap.photoSide }),
			...(filesMap.photoBack && { photoBack: filesMap.photoBack }),
		},
	})

	return progress
}

/**
 * Получает последний отчет о прогрессе для пользователя
 * @param userId - ID пользователя
 * @returns Последний отчет о прогрессе или null, если отчетов нет
 */
export async function getLatestProgress(userId: string) {
	return await prisma.progress.findFirst({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			date: true,
			weight: true,
			height: true,
			chest: true,
			waist: true,
			hips: true,
			arm: true,
			leg: true,
			photoFront: true,
			photoSide: true,
			photoBack: true,
			createdAt: true,
			updatedAt: true,
		},
	})
}

/**
 * Получает конкретный отчет о прогрессе по ID
 * @param progressId - ID отчета
 * @param userId - ID пользователя
 * @param userRole - Роль пользователя
 * @returns Отчет о прогрессе с полной информацией
 */
export async function getProgressById(
	progressId: string,
	userId: string,
	userRole: 'CLIENT' | 'TRAINER',
) {
	const { ApiError } = await import('../utils/ApiError.js')

	// Находим отчет о прогрессе
	const progress = await prisma.progress.findUnique({
		where: { id: progressId },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					photo: true,
				},
			},
		},
	})

	// Проверяем существование отчета
	if (!progress) {
		throw ApiError.notFound('Отчет о прогрессе не найден')
	}

	// Проверка прав доступа:
	// - Клиент может видеть только свои отчеты
	// - Тренер может видеть все отчеты (в будущем добавим проверку связи клиент-тренер)
	if (userRole === 'CLIENT' && progress.userId !== userId) {
		throw ApiError.forbidden('Нет доступа к этому отчету')
	}

	return progress
}

/**
 * Получает все отчеты о прогрессе пользователя
 * @param userId - ID пользователя
 * @returns Список всех отчетов о прогрессе
 */
export async function getAllProgress(userId: string) {
	const progress = await prisma.progress.findMany({
		where: { userId },
		orderBy: { date: 'desc' },
		select: {
			id: true,
			date: true,
			weight: true,
			height: true,
			chest: true,
			waist: true,
			hips: true,
			arm: true,
			leg: true,
			photoFront: true,
			photoSide: true,
			photoBack: true,
			createdAt: true,
			updatedAt: true,
			comments: {
				select: {
					id: true,
					text: true,
					createdAt: true,
					trainer: {
						select: {
							id: true,
							name: true,
							photo: true,
						},
					},
				},
			},
		},
	})
	return progress || []
}

/**
 * Добавление комментария тренером к отчету о прогрессе
 * @param progressId - ID отчета о прогрессе
 * @param trainerId - ID тренера
 * @param data - Данные комментария
 * @returns Созданный комментарий
 */
export async function addComment(
	progressId: string,
	trainerId: string,
	data: CreateCommentDTO,
) {
	const { ApiError } = await import('../utils/ApiError.js')

	// Проверяем существование отчета о прогрессе
	const progress = await prisma.progress.findUnique({
		where: { id: progressId },
	})

	if (!progress) {
		throw ApiError.notFound('Отчет о прогрессе не найден')
	}

	// Создаем комментарий
	const comment = await prisma.comment.create({
		data: {
			text: data.text,
			progressId,
			trainerId,
		},
		include: {
			trainer: {
				select: {
					id: true,
					name: true,
					photo: true,
				},
			},
		},
	})

	return comment
}

/**
 * Получение комментариев к отчету о прогрессе с пагинацией
 * @param progressId - ID отчета о прогрессе
 * @param query - Параметры пагинации (page, limit)
 * @returns Комментарии с метаданными пагинации
 */
export async function getProgressComments(
	progressId: string,
	query: GetProgressCommentsQueryDTO,
) {
	const { ApiError } = await import('../utils/ApiError.js')

	// Проверяем существование отчета о прогрессе
	const progress = await prisma.progress.findUnique({
		where: { id: progressId },
	})

	if (!progress) {
		throw ApiError.notFound('Отчет о прогрессе не найден')
	}

	const { page, limit } = query

	// Вычисляем offset для пагинации
	const skip = (page - 1) * limit
	const take = limit

	// Получаем комментарии с информацией о тренере
	const comments = await prisma.comment.findMany({
		where: { progressId },
		include: {
			trainer: {
				select: {
					id: true,
					name: true,
					email: true,
					photo: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' }, // Сортировка по дате (новые первыми)
		skip,
		take,
	})

	// Получаем общее количество комментариев
	const total = await prisma.comment.count({
		where: { progressId },
	})

	// Вычисляем общее количество страниц
	const totalPages = Math.ceil(total / limit)

	return {
		comments,
		pagination: {
			page,
			limit,
			total,
			totalPages,
		},
	}
}

/**
 * Получение данных аналитики прогресса для графиков
 * @param userId - ID пользователя
 * @param period - Период: 'month', 'year' или 'custom'
 * @param metrics - Массив метрик для анализа
 * @param startDate - Дата начала (обязательна для custom)
 * @param endDate - Дата окончания (обязательна для custom)
 * @returns Агрегированные данные по выбранным метрикам
 */
export async function getProgressAnalytics(
	userId: string,
	period: 'month' | 'year' | 'custom',
	metrics: string[],
	startDate?: string,
	endDate?: string,
) {
	const { ApiError } = await import('../utils/ApiError.js')

	// Определяем диапазон дат в зависимости от периода
	let dateFrom: Date
	let dateTo: Date = new Date()

	if (period === 'custom') {
		if (!startDate || !endDate) {
			throw ApiError.badRequest(
				'Для периода custom необходимо указать startDate и endDate',
			)
		}
		dateFrom = parseDateString(startDate)
		dateTo = parseDateString(endDate)
		// Устанавливаем конец дня для dateTo
		dateTo.setHours(23, 59, 59, 999)
	} else if (period === 'month') {
		dateFrom = new Date()
		dateFrom.setMonth(dateFrom.getMonth() - 1)
		dateFrom.setHours(0, 0, 0, 0)
	} else if (period === 'year') {
		dateFrom = new Date()
		dateFrom.setFullYear(dateFrom.getFullYear() - 1)
		dateFrom.setHours(0, 0, 0, 0)
	} else {
		throw ApiError.badRequest('Неизвестный период')
	}

	// Получаем все отчеты за период
	const progressReports = await prisma.progress.findMany({
		where: {
			userId,
			date: {
				gte: dateFrom,
				lte: dateTo,
			},
		},
		orderBy: { date: 'asc' },
		select: {
			id: true,
			date: true,
			weight: true,
			height: true,
			chest: true,
			waist: true,
			hips: true,
			arm: true,
			leg: true,
		},
	})

	// Формируем данные для графиков
	interface ChartDataPoint {
		date: string
		value: number | null
	}

	interface MetricData {
		metric: string
		data: ChartDataPoint[]
		min: number | null
		max: number | null
		avg: number | null
		change: number | null // Изменение от первого до последнего значения
	}

	const analyticsData: MetricData[] = metrics.map((metric) => {
		const dataPoints: ChartDataPoint[] = progressReports.map((report) => ({
			date: report.date.toISOString().split('T')[0], // YYYY-MM-DD
			value: report[metric as keyof typeof report] as number | null,
		}))

		// Фильтруем только не-null значения для расчета статистики
		const validValues = dataPoints
			.map((dp) => dp.value)
			.filter((v): v is number => v !== null)

		const min = validValues.length > 0 ? Math.min(...validValues) : null
		const max = validValues.length > 0 ? Math.max(...validValues) : null
		const avg =
			validValues.length > 0
				? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
				: null

		// Вычисляем изменение (разница между первым и последним)
		const firstValue = validValues[0]
		const lastValue = validValues[validValues.length - 1]
		const change = firstValue && lastValue ? lastValue - firstValue : null

		return {
			metric,
			data: dataPoints,
			min: min !== null ? Math.round(min * 10) / 10 : null,
			max: max !== null ? Math.round(max * 10) / 10 : null,
			avg: avg !== null ? Math.round(avg * 10) / 10 : null,
			change: change !== null ? Math.round(change * 10) / 10 : null,
		}
	})

	return {
		period,
		dateRange: {
			from: dateFrom.toISOString().split('T')[0],
			to: dateTo.toISOString().split('T')[0],
		},
		metrics: analyticsData,
	}
}
