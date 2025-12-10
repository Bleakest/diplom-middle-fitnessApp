import { prisma } from '../prisma.js'
import { ApiError } from '../utils/ApiError.js'
import { SendMessageDTO } from '../validation/zod/chat/send-message.dto.js'
import { GetMessagesQueryDTO } from '../validation/zod/chat/get-messages.dto.js'

/**
 * Отправка сообщения в чат
 * @param chatId - ID чата
 * @param senderId - ID отправителя
 * @param data - Данные сообщения (text, image опционально)
 * @param filesMap - Карта загруженных файлов (для изображений)
 * @returns Созданное сообщение
 */
export async function sendMessage(
	chatId: string,
	senderId: string,
	data: SendMessageDTO,
	filesMap: Record<string, string>,
) {
	// Проверяем, существует ли чат
	const chat = await prisma.chat.findUnique({
		where: { id: chatId },
		include: { trainer: true, client: true },
	})

	if (!chat) {
		throw ApiError.notFound('Чат не найден')
	}

	// Проверяем, что отправитель — участник чата
	if (chat.trainerId !== senderId && chat.clientId !== senderId) {
		throw ApiError.forbidden('Вы не участник этого чата')
	}

	// Определяем получателя
	const receiverId = chat.trainerId === senderId ? chat.clientId : chat.trainerId

	// Используем транзакцию для сохранения
	const message = await prisma.$transaction(async (tx) => {
		// Создаём сообщение
		const newMessage = await tx.message.create({
			data: {
				chatId,
				senderId,
				text: data.text,
				imageUrl: data.image || filesMap.image, // Используем либо переданный URL, либо загруженный файл
			},
			include: {
				sender: {
					select: { id: true, name: true, photo: true },
				},
			},
		})

		// Обновляем updatedAt чата
		await tx.chat.update({
			where: { id: chatId },
			data: { updatedAt: new Date() },
		})

		return newMessage
	})

	// Возвращаем сообщение с данными отправителя
	return message
}

/**
 * Получение истории сообщений чата с пагинацией
 * @param chatId - ID чата
 * @param userId - ID пользователя (для проверки доступа)
 * @param query - Параметры пагинации
 * @returns Объект с сообщениями и метаданными пагинации
 */
export async function getMessages(
	chatId: string,
	userId: string,
	query: GetMessagesQueryDTO,
) {
	// Проверяем, существует ли чат и доступ
	const chat = await prisma.chat.findUnique({
		where: { id: chatId },
		include: { trainer: true, client: true },
	})

	if (!chat) {
		throw ApiError.notFound('Чат не найден')
	}

	// Проверяем, что пользователь — участник чата
	if (chat.trainerId !== userId && chat.clientId !== userId) {
		throw ApiError.forbidden('Вы не участник этого чата')
	}

	const { page, limit } = query
	const skip = (page - 1) * limit

	// Получаем сообщения с пагинацией
	const [messages, total] = await Promise.all([
		prisma.message.findMany({
			where: { chatId },
			include: {
				sender: {
					select: { id: true, name: true, photo: true },
				},
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
		}),
		prisma.message.count({
			where: { chatId },
		}),
	])

	// Отмечаем входящие сообщения как прочитанные
	await prisma.message.updateMany({
		where: {
			chatId,
			senderId: { not: userId }, // Сообщения от других
			isRead: false,
		},
		data: { isRead: true },
	})

	// Переворачиваем порядок для фронтенда (старые сначала)
	const reversedMessages = messages.reverse()

	return {
		messages: reversedMessages,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	}
}
