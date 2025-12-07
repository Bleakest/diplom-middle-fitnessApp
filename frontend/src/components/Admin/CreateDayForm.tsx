import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Space, Select, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { MealType } from '../../types/nutritions'
import { mealTypes } from '../../constants/mealTypes'
import type { NutritionDayInput, TempDay } from '../../store/types/nutrition.types'

export interface NutritionMealInput {
	type: MealType
	name: string
	mealOrder: number
	items: string[]
}

interface CreateDayFormProps {
	day?: NutritionDayInput | TempDay | null
	existingDays?: Array<{ dayOrder: number }>
	onSubmit: (dayData: NutritionDayInput) => void
	onCancel: () => void
}

export const CreateDayForm = ({
	day,
	existingDays = [],
	onSubmit,
	onCancel,
}: CreateDayFormProps) => {
	const [form] = Form.useForm()

	const [meals, setMeals] = useState(() => {
		if (day?.meals && day.meals.length > 0) {
			return day.meals.map((meal) => ({
				type: meal.type as MealType,
				name: meal.name,
				mealOrder: meal.mealOrder,
				items: meal.items || [''],
			}))
		}
		// Для нового дня - дефолтный meal
		return [
			{
				type: 'BREAKFAST' as MealType,
				name: 'Завтрак',
				mealOrder: 1,
				items: [''],
			},
		]
	})

	// Вычисляем порядковый номер дня
	const calculateDayOrder = () => {
		if (day) return day.dayOrder
		if (existingDays.length > 0) {
			return Math.max(...existingDays.map((d) => d.dayOrder)) + 1
		}
		return 1
	}

	const handleAddMeal = () => {
		const newMeal = {
			type: 'SNACK' as MealType,
			name: 'Перекус',
			mealOrder: meals.length + 1,
			items: [''],
		}
		setMeals([...meals, newMeal])
	}

	const handleRemoveMeal = (mealIndex: number) => {
		if (meals.length > 1) {
			const updatedMeals = meals
				.filter((_, index) => index !== mealIndex)
				.map((meal, index) => ({
					...meal,
					mealOrder: index + 1,
				}))
			setMeals(updatedMeals)
		}
	}

	const handleAddMealItem = (mealIndex: number) => {
		setMeals(
			meals.map((meal, index) =>
				index === mealIndex ? { ...meal, items: [...meal.items, ''] } : meal,
			),
		)
	}

	const handleRemoveMealItem = (mealIndex: number, itemIndex: number) => {
		setMeals(
			meals.map((meal, index) =>
				index === mealIndex
					? {
							...meal,
							items: meal.items.filter((_, idx) => idx !== itemIndex),
					  }
					: meal,
			),
		)
	}

	const handleItemChange = (mealIndex: number, itemIndex: number, value: string) => {
		setMeals(
			meals.map((meal, index) =>
				index === mealIndex
					? {
							...meal,
							items: meal.items.map((item, idx) => (idx === itemIndex ? value : item)),
					  }
					: meal,
			),
		)
	}

	const handleMealTypeChange = (mealIndex: number, value: MealType) => {
		const mealType = mealTypes.find((type) => type.value === value)
		setMeals(
			meals.map((meal, index) =>
				index === mealIndex
					? {
							...meal,
							type: value,
							name: mealType?.label || value,
					  }
					: meal,
			),
		)
	}

	const handleSubmit = async (values: { dayTitle: string }) => {
		try {
			const dayData = {
				dayTitle: values.dayTitle,
				dayOrder: calculateDayOrder(),
				meals: meals.map((meal) => ({
					type: meal.type,
					name: meal.name,
					mealOrder: meal.mealOrder,
					items: meal.items.filter((item) => item.trim() !== ''),
				})),
			}

			if (dayData.meals.some((meal) => meal.items.length === 0)) {
				message.error('У всех приемов пищи должен быть хотя бы один пункт')
				return
			}

			onSubmit(dayData) //теперь тут
		} catch {
			message.error('Ошибка при сохранении')
		}
	}

	// Устанавливаем начальное значение формы
	useEffect(() => {
		if (day) {
			form.setFieldsValue({
				dayTitle: day.dayTitle || `День ${calculateDayOrder()}`,
			})
		} else {
			form.setFieldsValue({
				dayTitle: `День ${calculateDayOrder()}`,
			})
		}
	}, [day, form])

	return (
		<Form form={form} layout='vertical' onFinish={handleSubmit}>
			<Form.Item
				name='dayTitle'
				label='Название дня'
				rules={[{ required: true, message: 'Введите название дня' }]}
			>
				<Input placeholder='Например: День 1, Понедельник...' />
			</Form.Item>

			<div style={{ marginBottom: 16 }}>
				{meals.map((meal, mealIndex) => (
					<Card
						key={mealIndex}
						size='small'
						style={{ marginBottom: 12 }}
						title={
							<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
								<Select
									value={meal.type}
									onChange={(value) => handleMealTypeChange(mealIndex, value as MealType)}
									options={[...mealTypes]}
									style={{ width: 120 }}
								/>
								<span>#{meal.mealOrder}</span>
							</div>
						}
						extra={
							meals.length > 1 && (
								<Button
									type='text'
									danger
									icon={<DeleteOutlined />}
									onClick={() => handleRemoveMeal(mealIndex)}
								/>
							)
						}
					>
						<div style={{ display: 'grid', gap: 8 }}>
							{meal.items.map((item, itemIndex) => (
								<div
									key={itemIndex}
									style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
								>
									<Input
										placeholder='Описание блюда/продукта'
										value={item}
										onChange={(e) =>
											handleItemChange(mealIndex, itemIndex, e.target.value)
										}
										style={{ flex: 1 }}
									/>
									<Button
										type='text'
										danger
										icon={<DeleteOutlined />}
										onClick={() => handleRemoveMealItem(mealIndex, itemIndex)}
									/>
								</div>
							))}
							<Button
								type='dashed'
								icon={<PlusOutlined />}
								onClick={() => handleAddMealItem(mealIndex)}
								style={{ width: '100%' }}
							>
								Добавить пункт
							</Button>
						</div>
					</Card>
				))}
			</div>

			<Button
				type='dashed'
				icon={<PlusOutlined />}
				onClick={handleAddMeal}
				style={{ width: '100%', marginBottom: 24 }}
			>
				Добавить прием пищи
			</Button>

			<Form.Item style={{ marginBottom: 0 }}>
				<Space>
					<Button onClick={onCancel}>Отмена</Button>
					<Button type='primary' htmlType='submit'>
						{day ? 'Сохранить изменения' : 'Создать день'}
					</Button>
				</Space>
			</Form.Item>
		</Form>
	)
}
