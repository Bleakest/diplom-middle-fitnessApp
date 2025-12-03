import { prisma } from '../prisma.js'

export async function getClientsForTrainer(trainerId: string) {
	// 1) все клиенты
	const [allClients, links] = await Promise.all([
		prisma.user.findMany({
			where: { role: 'CLIENT' },
			select: {
				id: true,
				email: true,
				name: true,
				age: true,
				phone: true,
				photo: true,
				role: true,
			},
		}),
		prisma.trainerClient.findMany({
			where: { trainerId },
			select: { clientId: true, isFavorite: true },
		}),
	])

	const map = new Map<string, boolean>()
	links.forEach((l) => map.set(l.clientId, l.isFavorite))

	// 2) всем клиентам добавляем флаг isFavorite, если есть связь
	return allClients.map((c) => ({
		...c,
		isFavorite: map.get(c.id) ?? false,
	}))
}

export async function toggleClientStar(trainerId: string, clientId: string) {
	const existing = await prisma.trainerClient.findUnique({
		where: { clientId }, // один клиент — один тренер
	})

	if (!existing) {
		const created = await prisma.trainerClient.create({
			data: { trainerId, clientId, isFavorite: true },
		})
		return created.isFavorite
	}

	const updated = await prisma.trainerClient.update({
		where: { clientId },
		data: { isFavorite: !existing.isFavorite },
	})

	return updated.isFavorite
}
