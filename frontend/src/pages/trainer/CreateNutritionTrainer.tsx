import { useState } from 'react'
import { Typography, Button, Form, Input, message, Modal, Card } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { CreateDayForm } from '../../components/Admin/CreateDayForm'
import { useCreateSubcategoryMutation } from '../../store/api/nutrition.api'
import type { NutritionDay } from '../../types/nutritions'
import type { NutritionDayInput, TempDay } from '../../store/types/nutrition.types'

const { Title } = Typography
const { TextArea } = Input

export const CreateNutritionTrainer = () => {
	const { category } = useParams<{ category: string }>()
	const navigate = useNavigate()
	const [form] = Form.useForm()
	const [isDayFormVisible, setIsDayFormVisible] = useState(false)
	const [selectedDayForEdit, setSelectedDayForEdit] = useState<
		NutritionDay | TempDay | null
	>(null)
	const [tempDays, setTempDays] = useState<TempDay[]>([])

	const [createSubcategory, { isLoading: isCreatingSubcategory }] =
		useCreateSubcategoryMutation()

	const handleSubmit = async (values: { name: string; description?: string }) => {
		if (!category) {
			message.error('Не указана категория')
			return
		}

		try {
			// Подготавливаем дни для отправки
			const daysToSend = tempDays.map((day) => ({
				dayTitle: day.dayTitle,
				dayOrder: day.dayOrder,
				meals: day.meals.map((meal) => ({
					type: meal.type,
					name: meal.name,
					mealOrder: meal.mealOrder,
					items: meal.items.filter((item) => item.trim() !== ''),
				})),
			}))

			await createSubcategory({
				categoryId: category,
				name: values.name,
				description: values.description,
				days: daysToSend, // может быть пустым массивом
			}).unwrap()

			message.success('Подкатегория успешно создана')

			// Закрываем форму и очищаем
			form.resetFields()
			setTempDays([])
			message.info('Форма очищена. Можете создать ещё или закрыть')
		} catch (error: any) {
			console.error('Ошибка создания:', error)
			message.error(error?.data?.message || 'Ошибка при создании подкатегории')
		}
	}

	const handleCancel = () => {
		console.log('в категории обратно')
		navigate(`/admin/nutrition`)
	}

	const handleAddDay = () => {
		setSelectedDayForEdit(null)
		setIsDayFormVisible(true)
	}

	const handleEditDay = (day: TempDay) => {
		setSelectedDayForEdit(day)
		setIsDayFormVisible(true)
	}

	const handleDayFormCancel = () => {
		setIsDayFormVisible(false)
		setSelectedDayForEdit(null)
	}

	const handleDayFormSubmit = (dayData: NutritionDayInput) => {
		if (selectedDayForEdit) {
			setTempDays((prev) =>
				prev.map((day) =>
					day.id === selectedDayForEdit.id
						? {
								...day,
								dayTitle: dayData.dayTitle,
								dayOrder: dayData.dayOrder,
								meals: dayData.meals,
						  }
						: day,
				),
			)
			message.success('День обновлен')
		} else {
			// Добавляем новый день
			const newDay: TempDay = {
				id: `temp_${Date.now()}`,
				subcatId: '',
				dayTitle: dayData.dayTitle,
				dayOrder: dayData.dayOrder,
				meals: dayData.meals,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
			setTempDays((prev) => [...prev, newDay])
			message.success('День добавлен')
		}

		setIsDayFormVisible(false)
		setSelectedDayForEdit(null)
	}

	const handleRemoveDay = (dayId: string) => {
		setTempDays((prev) => {
			const filtered = prev.filter((day) => day.id !== dayId)
			// Перенумеровываем порядок
			return filtered.map((day, index) => ({
				...day,
				dayOrder: index + 1,
			}))
		})
		message.success('День удален')
	}

	return (
		<div className='page-container gradient-bg'>
			<div className='page-card max-w-4xl'>
				<div className='flex justify-between items-center mb-8'>
					<Title level={2} className='section-title inline-block m-0'>
						➕ Создание новой подкатегории
					</Title>
					<Button onClick={handleCancel}>Закрыть</Button>
				</div>

				<Form form={form} layout='vertical' onFinish={handleSubmit}>
					<Form.Item
						name='name'
						label='Название подкатегории'
						rules={[
							{ required: true, message: 'Введите название' },
							{ min: 2, message: 'Минимум 2 символа' },
						]}
					>
						<Input
							placeholder='Название подкатегории'
							size='large'
							className='rounded-lg'
						/>
					</Form.Item>

					<Form.Item name='description' label='Описание'>
						<TextArea
							placeholder='Описание подкатегории...'
							rows={3}
							className='rounded-lg'
						/>
					</Form.Item>

					<div className='mb-8'>
						<div className='flex justify-between items-center mb-4'>
							<Title level={4} className='m-0 text-gray-700'>
								Дни ({tempDays.length})
							</Title>
							<Button type='primary' icon={<PlusOutlined />} onClick={handleAddDay}>
								Добавить день
							</Button>
						</div>

						{tempDays.length > 0 ? (
							<div className='space-y-3'>
								{tempDays.map((day) => (
									<Card key={day.id} className='border-muted bg-light'>
										<div className='flex justify-between items-start'>
											<div
												onClick={() => handleEditDay(day)}
												className='cursor-pointer flex-1'
											>
												<div className='font-medium text-base'>{day.dayTitle}</div>
												<div className='text-sm text-gray-600 mt-1'>
													Приемов пищи: {day.meals.length} • Порядок: {day.dayOrder}
												</div>
											</div>
											<Button
												type='text'
												danger
												icon={<DeleteOutlined />}
												onClick={() => handleRemoveDay(day.id)}
											/>
										</div>
									</Card>
								))}
							</div>
						) : (
							<Card className='text-center py-8 border-dashed'>
								<p className='text-gray-500'>
									Дни не обязательны. Можете добавить позже.
								</p>
							</Card>
						)}
					</div>

					<Form.Item>
						<div className='flex gap-3 justify-end'>
							<Button size='large' onClick={handleCancel}>
								Отмена
							</Button>
							<Button
								type='primary'
								htmlType='submit'
								size='large'
								loading={isCreatingSubcategory}
							>
								Создать подкатегорию
							</Button>
						</div>
					</Form.Item>
				</Form>

				<Modal
					title={selectedDayForEdit ? 'Редактирование дня' : 'Добавление дня'}
					open={isDayFormVisible}
					onCancel={handleDayFormCancel}
					footer={null}
					width={800}
				>
					<CreateDayForm
						day={selectedDayForEdit}
						existingDays={tempDays}
						onSubmit={handleDayFormSubmit}
						onCancel={handleDayFormCancel}
					/>
				</Modal>
			</div>
		</div>
	)
}
