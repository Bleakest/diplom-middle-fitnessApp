import React from 'react'
import { Card, Button, Typography } from 'antd'
import { EditOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import type { NutritionDay } from '../../types/nutritions'

const { Title } = Typography

interface DayCardProps {
	day: NutritionDay
	openedDayId: string | null
	onDayClick: (dayId: string) => void
	onEditDay: (day: NutritionDay, e: React.MouseEvent) => void
}

export const DayCard = ({ day, openedDayId, onDayClick, onEditDay }: DayCardProps) => {
	const getDayIcon = (dayId: string) => {
		return openedDayId === dayId ? <DownOutlined /> : <RightOutlined />
	}

	return (
		<Card
			style={{ background: '#fafafa', borderColor: '#d9d9d9', cursor: 'pointer' }}
			onClick={() => onDayClick(day.id)}
		>
			<div
				style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span style={{ fontSize: 18 }}>{getDayIcon(day.id)}</span>
					<Title level={4} style={{ margin: 0, color: '#333' }}>
						{day.dayTitle}
					</Title>
					<Button
						type='text'
						icon={<EditOutlined />}
						onClick={(e) => onEditDay(day, e)}
						style={{ color: '#1890ff' }}
					/>
				</div>
			</div>

			{openedDayId === day.id && (
				<div style={{ marginTop: 16, display: 'grid', gap: 16 }}>
					{day.meals.map((meal) => (
						<div
							key={meal.id}
							style={{ paddingLeft: 16, borderLeft: '4px solid #1890ff' }}
						>
							<Title level={5} style={{ marginBottom: 8, color: '#333' }}>
								{meal.name}
							</Title>
							{meal.items.length > 0 ? (
								<ul style={{ margin: 0, paddingLeft: 16, color: '#333' }}>
									{meal.items.map((item, index) => (
										<li key={index} style={{ marginBottom: 8 }}>
											{item}
										</li>
									))}
								</ul>
							) : (
								<p style={{ color: '#999' }}>Нет данных</p>
							)}
						</div>
					))}
				</div>
			)}
		</Card>
	)
}
