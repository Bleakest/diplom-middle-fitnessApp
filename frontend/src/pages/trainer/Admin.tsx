import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'
import { Layout, Button, Typography, Spin, message } from 'antd'
import { MenuOutlined } from '@ant-design/icons'
import { ClientList, TrainerInfo, TrainerSidebar, InvitesList } from '../../components/Admin'
import {
	useGetClientsQuery,
	useGetInvitesQuery,
	useAcceptInviteMutation,
	useRejectInviteMutation,
	useToggleClientStarMutation,
} from '../../store/api/trainer.api'
import { useGetMeQuery } from '../../store/api/user.api'
import { toggleSidebar } from '../../store/slices/ui.slice'

const { Title } = Typography
const { Content, Sider } = Layout

export const Admin: React.FC = () => {
	const dispatch = useDispatch<AppDispatch>()
	const [acceptingId, setAcceptingId] = useState<string | null>(null)
	const [rejectingId, setRejectingId] = useState<string | null>(null)

	// текущий пользователь (для проверки загрузки)
	const { data: meData, isLoading: isLoadingMe } = useGetMeQuery()
	const trainerId = meData?.user.id

	// клиенты тренера с сервера (только ACCEPTED)
	const {
		data: clients = [],
		isLoading: isLoadingClients,
		isError: isClientsError,
	} = useGetClientsQuery()

	// приглашения (PENDING)
	const {
		data: invitesData,
		isLoading: isLoadingInvites,
	} = useGetInvitesQuery({ status: 'PENDING' })

	const invites = invitesData?.invites || []

	// Мутации
	const [toggleStarMutation] = useToggleClientStarMutation()
	const [acceptInvite] = useAcceptInviteMutation()
	const [rejectInvite] = useRejectInviteMutation()

	const sidebarCollapsed = useSelector(
		(state: RootState) => state.ui.isSidebarOpen === false,
	)

	const handleToggleSidebar = () => dispatch(toggleSidebar())

	const handleToggleStar = async (clientId: string) => {
		try {
			await toggleStarMutation({ clientId }).unwrap()
		} catch (error) {
			console.error('Ошибка переключения isFavorite:', error)
			message.error('Не удалось изменить статус избранного')
		}
	}

	// Принять приглашение
	const handleAcceptInvite = async (inviteId: string) => {
		setAcceptingId(inviteId)
		try {
			const result = await acceptInvite({ inviteId }).unwrap()
			message.success(result.message)
		} catch (error: any) {
			const errorMessage = error?.data?.message || 'Не удалось принять клиента'
			message.error(errorMessage)
		} finally {
			setAcceptingId(null)
		}
	}

	// Отклонить приглашение
	const handleRejectInvite = async (inviteId: string) => {
		setRejectingId(inviteId)
		try {
			const result = await rejectInvite({ inviteId }).unwrap()
			message.success(result.message)
		} catch (error: any) {
			const errorMessage = error?.data?.message || 'Не удалось отклонить приглашение'
			message.error(errorMessage)
		} finally {
			setRejectingId(null)
		}
	}

	// Разделяем: клиенты в работе (accepted) и избранные (подмножество)
	const { workingClients, favoriteClients, sidebarClients } = useMemo(() => {
		const withStarFlag = clients.map((client) => ({
			...client,
			isFavorite: Boolean(client.isFavorite),
		}))

		const favorites = withStarFlag.filter((c) => c.isFavorite)
		const working = withStarFlag // все ACCEPTED

		return {
			workingClients: working,
			favoriteClients: favorites,
			sidebarClients: working, // в сайдбаре только клиенты в работе
		}
	}, [clients])

	// загрузка
	if (isLoadingMe || isLoadingClients) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<Spin size='large' />
			</div>
		)
	}

	// ошибка API
	if (isClientsError) {
		return (
			<div className='p-6 text-red-500 text-center'>
				Не удалось загрузить клиентов тренера
			</div>
		)
	}

	// нет тренера
	if (!trainerId) {
		return (
			<div className='p-6 text-red-500 text-center'>Не удалось определить тренера</div>
		)
	}

	return (
		<div className='gradient-bg'>
			<Layout className='admin-layout bg-transparent'>
				<Sider
					width={sidebarCollapsed ? 80 : 300}
					collapsed={sidebarCollapsed}
					className='admin-sidebar'
					theme='light'
				>
					<div className='p-4 border-b border-gray-200'>
						<Button
							type='text'
							icon={<MenuOutlined style={{ fontSize: 18 }} />}
							onClick={handleToggleSidebar}
							className='w-full flex items-center justify-center'
						>
							{!sidebarCollapsed && <span className='ml-2'>Свернуть</span>}
						</Button>
					</div>

					{!sidebarCollapsed && (
						<div className='p-4'>
							<TrainerSidebar
								clients={sidebarClients}
							/>
						</div>
					)}
				</Sider>

				<Content className='admin-content p-6' style={{ overflow: 'auto' }}>
					<div className='admin-page-card h-full'>
						<div className='section-header'>
							<Title level={2} className='section-title'>
								🏢 Панель тренера
							</Title>
						</div>

						<TrainerInfo />

						{/* Секция приглашений */}
						<div className='mt-8'>
							<InvitesList
								invites={invites}
								loading={isLoadingInvites}
								onAccept={handleAcceptInvite}
								onReject={handleRejectInvite}
								acceptingId={acceptingId}
								rejectingId={rejectingId}
							/>
						</div>

					{/* Секция клиентов */}
					<div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8'>
						<ClientList
							title='👥 Клиенты в работе'
							clients={workingClients}
							starIcon='outlined'
							onToggleStar={handleToggleStar}
						/>
						<ClientList
							title='⭐ Избранные клиенты'
							clients={favoriteClients}
							starIcon='filled'
							onToggleStar={handleToggleStar}
						/>
					</div>
					</div>
				</Content>
			</Layout>
		</div>
	)
}
