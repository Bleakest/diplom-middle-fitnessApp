import { useState } from 'react'
import { Typography, Button, Card, message, Modal, Empty, Spin, Popconfirm } from 'antd'
import { useParams } from 'react-router-dom'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { DayCard } from '../../components/Admin/DayCard'
import { CreateDayForm } from '../../components/Admin/CreateDayForm'
import {
	useGetDaysQuery,
	useDeleteDayMutation,
	useUpdateDayMutation,
	useCreateDayMutation,
	useGetSubcategoryQuery,
} from '../../store/api/nutrition.api'
import type { NutritionDay } from '../../types/nutritions'
import type { NutritionDayInput } from '../../store/types/nutrition.types'

const { Title } = Typography

export const NutritionPlanTrainer = () => {
	const { subcategory } = useParams<{ subcategory: string }>()

	const [openedDayId, setOpenedDayId] = useState<string | null>(null)
	const [isDayFormVisible, setIsDayFormVisible] = useState(false)
	const [editingDay, setEditingDay] = useState<NutritionDay | null>(null)

	const { data: subcategoryData } = useGetSubcategoryQuery(subcategory || '', {
		skip: !subcategory,
	})

	const {
		data: days = [],
		isLoading,
		refetch,
	} = useGetDaysQuery(subcategory || '', {
		skip: !subcategory,
	})

	const [createDay] = useCreateDayMutation()
	const [updateDay] = useUpdateDayMutation()
	const [deleteDay, { isLoading: isDeleting }] = useDeleteDayMutation()

	const handleAddDay = () => {
		setEditingDay(null)
		setIsDayFormVisible(true)
	}

	const handleEditDay = (day: NutritionDay, e: React.MouseEvent) => {
		e.stopPropagation()
		setEditingDay(day)
		setIsDayFormVisible(true)
	}

	const handleDeleteDay = async (dayId: string, e: React.MouseEvent) => {
		e.stopPropagation()

		try {
			await deleteDay(dayId).unwrap()
			message.success('День удален')
			refetch()
		} catch (error: any) {
			message.error(error?.data?.message || 'Ошибка при удалении дня')
		}
	}

	const handleDayClick = (dayId: string) => {
		setOpenedDayId((prev) => (prev === dayId ? null : dayId))
	}

	const handleDayFormCancel = () => {
		setIsDayFormVisible(false)
		setEditingDay(null)
	}

	const handleDayFormSubmit = async (dayData: NutritionDayInput) => {
		try {
			if (!subcategory) {
				message.error('Не указана подкатегория')
				return
			}

			if (editingDay) {
				await updateDay({
					id: editingDay.id,
					updates: {
						dayTitle: dayData.dayTitle,
						dayOrder: dayData.dayOrder,
						meals: dayData.meals,
					},
				}).unwrap()
				message.success('День обновлен')
			} else {
				await createDay({
					subcategoryId: subcategory,
					...dayData,
				}).unwrap()
				message.success('День создан')
			}

			setIsDayFormVisible(false)
			setEditingDay(null)
			refetch()
		} catch (error) {
			console.log(error)
			message.error('Ошибка при сохранении')
		}
	}

	if (isLoading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Spin size='large' />
			</div>
		)
	}

	const nutritionDays: NutritionDay[] = [...days].sort((a, b) => a.dayOrder - b.dayOrder)

	return (
		<div className='page-container gradient-bg'>
			<div className='page-card max-w-6xl'>
				<div className='section-header text-center mb-8'>
					<Title level={2} className='section-title inline-block'>
						{subcategoryData?.name
							? `Дни подкатегории: ${subcategoryData.name}`
							: 'Дни питания'}
					</Title>
				</div>

				<div className='flex justify-between items-center mb-6'>
					<div className='text-base text-gray-700'>
						Количество дней:{' '}
						<span className='font-semibold text-primary'>{nutritionDays.length}</span>
					</div>
					<Button
						type='primary'
						icon={<PlusOutlined />}
						onClick={handleAddDay}
						className='h-10 rounded-lg'
					>
						Добавить день
					</Button>
				</div>

				{nutritionDays.length > 0 ? (
					<div className='space-y-4'>
						{nutritionDays.map((day) => (
							<Card key={day.id} className='card-hover border-muted bg-light relative'>
								<Popconfirm
									title='Удалить день?'
									description='Вы уверены, что хотите удалить этот день?'
									onConfirm={(e) => handleDeleteDay(day.id, e as any)}
									okText='Да'
									cancelText='Нет'
									okButtonProps={{ danger: true, loading: isDeleting }}
								>
									<Button
										type='text'
										danger
										size='small'
										icon={<DeleteOutlined />}
										className='absolute top-4 right-4 z-10'
										title='Удалить день'
									/>
								</Popconfirm>

								<DayCard
									day={day}
									openedDayId={openedDayId}
									onDayClick={handleDayClick}
									onEditDay={handleEditDay}
								/>
							</Card>
						))}
					</div>
				) : (
					<Card className='text-center py-12 border-muted bg-light'>
						<Empty
							description='В этой подкатегории пока нет дней'
							image={Empty.PRESENTED_IMAGE_SIMPLE}
						>
							<Button type='primary' onClick={handleAddDay} className='mt-4 rounded-lg'>
								Создать первый день
							</Button>
						</Empty>
					</Card>
				)}

				<Modal
					title={editingDay ? 'Редактирование дня' : 'Добавление нового дня'}
					open={isDayFormVisible}
					onCancel={handleDayFormCancel}
					footer={null}
					width={800}
					className='rounded-xl'
					destroyOnHidden
				>
					<CreateDayForm
						day={editingDay}
						onSubmit={handleDayFormSubmit}
						onCancel={handleDayFormCancel}
						existingDays={nutritionDays}
					/>
				</Modal>
			</div>
		</div>
	)
}
