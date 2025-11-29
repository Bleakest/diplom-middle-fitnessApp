import { prisma } from '../prisma.js'
import { CreateProgressDTO } from 'validation/zod/user/progress.dto.js'
import { parseDateString, checkReportExists } from 'services/progress.service.js'

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
	// Парсим дату из формата ДД/ММ/ГГГГ
	const reportDate = parseDateString(data.date)

	// Проверяем, существует ли уже отчет за эту дату
	await checkReportExists(userId, reportDate)

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
