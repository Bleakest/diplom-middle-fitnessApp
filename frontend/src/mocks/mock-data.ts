import type { ClientInTrainerProfile } from '../types'
import type { Trainer } from '../types'

export const mockTrainer: Trainer = {
	id: 't1',
	name: 'Тренер',
	age: 25,
	phone: '89191919191',
	avatarUrl: '',
	telegram: '@trainer-telegram',
}

export const mockClients: ClientInTrainerProfile[] = [
	{
		id: '1',
		name: 'Клиент 1',
		isFavorite: true,
		unreadMessages: 1,
		hasNewReport: true,
		avatarUrl: '',
	},
	{
		id: '2',
		name: 'Клиент 2',
		isFavorite: true,
		unreadMessages: 0,
		hasNewReport: false,
		avatarUrl: '',
	},
	{
		id: '3',
		name: 'Клиент 3',
		isFavorite: false,
		unreadMessages: 2,
		hasNewReport: false,
		avatarUrl: '',
	},
	{
		id: '4',
		name: 'Клиент 4',
		isFavorite: false,
		unreadMessages: 0,
		hasNewReport: false,
		avatarUrl: '',
	},
]
