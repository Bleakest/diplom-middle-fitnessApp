import { useState, useEffect } from 'react'
import { Typography, Button, Select, Card, message, Spin, Empty } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import {
	useGetCategoriesQuery,
	useAssignNutritionPlanMutation,
} from '../../store/api/nutrition.api'
import type { NutritionSubcategory, NutritionDay } from '../../types/nutritions'

const { Title } = Typography
const { Option } = Select

export const AddNutritionTrainer = () => {
	const { id: clientId } = useParams<{ id: string }>()
	const navigate = useNavigate()

	const [selectedCategory, setSelectedCategory] = useState<string>('')
	const [selectedProgram, setSelectedProgram] = useState<string>('')
	const [selectedDay, setSelectedDay] = useState<string>('')

	const { data: categories = [], isLoading } = useGetCategoriesQuery()
	const [assignMealPlan, { isLoading: isAssigning }] = useAssignNutritionPlanMutation()

	console.log(categories)

	// Находим выбранную категорию
	const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory)
	const programs: NutritionSubcategory[] = selectedCategoryData?.subcategories || []

	// Находим выбранную подкатегорию
	const selectedSubcategoryData = programs.find(
		(program) => program.id === selectedProgram,
	)
	const days: NutritionDay[] = selectedSubcategoryData?.days || []

	// Находим данные выбранного дня
	const selectedDayData = days.find((day) => day.id === selectedDay)

	useEffect(() => {
		if (!clientId) {
			message.error('Клиент не указан')
			navigate(-1)
		}
	}, [clientId, navigate])

	const handlePublish = async () => {
		if (!selectedDay || !clientId || !selectedProgram) {
			message.error('Выберите все параметры')
			return
		}

		try {
			await assignMealPlan({
				clientId,
				subcategoryId: selectedProgram,
				dayIds: [selectedDay],
			}).unwrap()

			message.success('План питания успешно назначен клиенту')
			navigate(`/admin/client/${clientId}`)
		} catch (error: any) {
			message.error(error?.data?.message || 'Ошибка при назначении плана')
		}
	}

	const handleCancel = () => {
		navigate(`/admin/client/${clientId}`)
	}

	const handleCategoryChange = (value: string) => {
		setSelectedCategory(value)
		setSelectedProgram('')
		setSelectedDay('')
	}

	const handleProgramChange = (value: string) => {
		setSelectedProgram(value)
		setSelectedDay('')
	}

	const handleDayChange = (value: string) => {
		setSelectedDay(value)
	}

	if (isLoading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<Spin size='large' />
			</div>
		)
	}

	return (
		<div className='page-container gradient-bg'>
			<div className='page-card max-w-4xl'>
				<div className='section-header text-center mb-8'>
					<Title level={2} className='section-title inline-block'>
						🍽️ Назначение плана питания
					</Title>
				</div>

				<div className='space-y-6'>
					<Card title='Выбор плана питания' className='card-hover border-muted bg-light'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700'>
									Категория
								</label>
								<Select
									placeholder='Выберите категорию'
									value={selectedCategory}
									onChange={handleCategoryChange}
									className='w-full rounded-lg'
								>
									{categories.map((category) => (
										<Option key={category.id} value={category.id}>
											{category.name}
										</Option>
									))}
								</Select>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700'>
									Программа
								</label>
								<Select
									placeholder='Выберите программу'
									value={selectedProgram}
									onChange={handleProgramChange}
									disabled={!selectedCategory}
									className='w-full rounded-lg'
								>
									{programs.map((program) => (
										<Option key={program.id} value={program.id}>
											{program.name}
										</Option>
									))}
								</Select>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2 text-gray-700'>
									День
								</label>
								<Select
									placeholder='Выберите день'
									value={selectedDay}
									onChange={handleDayChange}
									disabled={!selectedProgram}
									className='w-full rounded-lg'
								>
									{days.map((day) => (
										<Option key={day.id} value={day.id}>
											{day.dayTitle}
										</Option>
									))}
								</Select>
							</div>
						</div>
					</Card>

					{selectedDayData ? (
						<Card title='Предпросмотр плана' className='card-hover border-muted bg-light'>
							<div className='space-y-4'>
								<Title level={4} className='text-center text-gray-800'>
									{selectedDayData.dayTitle}
								</Title>

								{selectedDayData.meals.map((meal) => (
									<div key={meal.id} className='border-l-4 border-primary pl-4'>
										<Title level={5} className='mb-2 text-gray-700'>
											{meal.name}
										</Title>
										{meal.items.length > 0 ? (
											<ul className='list-disc ml-6 text-gray-600'>
												{meal.items.map((item, index) => (
													<li key={index} className='mb-1'>
														{item}
													</li>
												))}
											</ul>
										) : (
											<p className='text-gray-400'>Нет данных</p>
										)}
									</div>
								))}
							</div>
						</Card>
					) : selectedProgram && days.length === 0 ? (
						<Card className='border-muted bg-light'>
							<Empty description='В этой программе нет дней' />
						</Card>
					) : null}

					<div className='flex gap-3 justify-end'>
						<Button size='large' onClick={handleCancel} className='rounded-lg'>
							Отмена
						</Button>
						<Button
							type='primary'
							size='large'
							onClick={handlePublish}
							disabled={!selectedDay}
							loading={isAssigning}
							className='rounded-lg'
						>
							Назначить план
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
