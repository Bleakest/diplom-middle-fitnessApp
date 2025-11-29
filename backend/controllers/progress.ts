import { prisma } from '../prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { CreateProgressDTO } from 'validation/zod/user/progress.dto.js'

/**
 * Создание нового отчета о прогрессе
 * @param userId - ID пользователя
 * @param data - Данные отчета (измерения и дата)
 * @param filesMap - Объект с путями к загруженным фотографиям
 * @returns Созданный отчет о прогрессе
 */
export async function createProgress(
	userId: string,
	data: CreateProgressDTO,
	filesMap: Record<string, string>,
) {
	// Парсим дату из формата ДД/ММ/ГГГГ в Date object
	const [day, month, year] = data.date.split('/').map(Number)
	const reportDate = new Date(year, month - 1, day)
	// Устанавливаем время на начало дня для корректного сравнения
	reportDate.setHours(0, 0, 0, 0)

	// Проверяем, существует ли уже отчет за эту дату для данного пользователя
	const existingReport = await prisma.progress.findFirst({
		where: {
			userId,
			date: {
				gte: reportDate,
				lt: new Date(reportDate.getTime() + 24 * 60 * 60 * 1000), // Следующий день
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
			weight: data.weight,
			height: data.height,
			waist: data.waist,
			chest: data.chest,
			hips: data.hips,
			arm: data.arm,
			leg: data.leg,
			photoFront: filesMap.photoFront,
			photoSide: filesMap.photoSide,
			photoBack: filesMap.photoBack,
		},
	})

	return progress
}
