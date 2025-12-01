import { useMemo, useState } from 'react'
import { Card, Col, Row, type RadioChangeEvent } from 'antd'
import { SelectPeriod } from './SelectPeriod'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import type { ProgressMetric } from '../../constants/progressMetrics'
import { SelectMetric } from './SelectMetric'

interface ProgressChartProps {
	data: Array<Record<string, any>>
	metrics: readonly ProgressMetric[]
	chartTitle?: string
	yLabel?: string
}

export const ProgressChart = ({
	data,
	metrics,
	yLabel = 'Объем (см)',
}: ProgressChartProps) => {
	const defaultSelected = useMemo(
		() => metrics.map((m) => m.nameMetric as string),
		[metrics],
	)
	const [selectedMetrics, setSelectedMetrics] = useState<string[]>(defaultSelected)
	const [period, setPeriod] = useState<'month' | 'year' | 'all'>('all')

	const metricNames = useMemo(
		() => Object.fromEntries(metrics.map((m) => [m.nameMetric, m.label])),
		[metrics],
	)

	const handlePeriodChange = (e: RadioChangeEvent) => {
		setPeriod(e.target.value)
	}

	const filteredData = useMemo(() => {
		if (period === 'all') return data

		const now = new Date()
		const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		if (period === 'month') {
			const oneMonthAgo = new Date(currentDate)
			oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
			return data.filter((item) => {
				const itemDate = new Date(item.date)
				return itemDate >= oneMonthAgo && itemDate <= currentDate
			})
		}

		if (period === 'year') {
			const oneYearAgo = new Date(currentDate)
			oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
			return data.filter((item) => {
				const itemDate = new Date(item.date)
				return itemDate >= oneYearAgo && itemDate <= currentDate
			})
		}

		return data
	}, [period, data])

	// Если данных нет, показываем сообщение
	if (!filteredData || filteredData.length === 0) {
		return (
			<div className='w-full text-center p-8'>
				<p>Нет данных для отображения за выбранный период</p>
			</div>
		)
	}

	return (
		<div className='w-full'>
			{/* Заголовок и выбор периода */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
				<h3 className='text-lg font-semibold m-0'>График прогресса</h3>
				<SelectPeriod period={period} handlePeriodChange={handlePeriodChange} />
			</div>

			{/* Выбор метрик и график */}
			<Row gutter={[24, 24]} align="stretch">
				<Col xs={24} lg={10} xl={8}>
					<div style={{ height: '100%', minHeight: '300px' }}>
						<SelectMetric
							selectedMetrics={selectedMetrics}
							setSelectedMetrics={setSelectedMetrics}
						/>
					</div>
				</Col>

				<Col xs={24} lg={14} xl={16}>
					<Card size='small' className='w-full' styles={{ body: { padding: 0 } }}>
						<div className='w-full h-[400px] p-4'>
							<ResponsiveContainer width='100%' height={400}>
								<BarChart
									data={filteredData}
									margin={{
										top: 20,
										right: 30,
										left: 20,
										bottom: 15,
									}}
								>
									<CartesianGrid strokeDasharray='3 3' />
									<XAxis
										dataKey='date'
										tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU')}
									/>
									<YAxis
										label={{
											value: yLabel,
											angle: -90,
											position: 'insideLeft',
											offset: -10,
										}}
									/>
									<Tooltip
										formatter={(value, name) => [
											`${value} ${name === 'weight' ? 'кг' : 'см'}`,
											metricNames[name as string] || name,
										]}
										labelFormatter={(label) =>
											`Дата: ${new Date(label).toLocaleDateString('ru-RU')}`
										}
									/>
									<Legend formatter={(value) => metricNames[value] || value} />

									{metrics.map((metric) =>
										selectedMetrics.includes(metric.nameMetric) ? (
											<Bar
												key={metric.nameMetric}
												dataKey={metric.nameMetric}
												fill={metric.color}
												name={metric.nameMetric}
												maxBarSize={40}
											/>
										) : null,
									)}
								</BarChart>
							</ResponsiveContainer>
						</div>
					</Card>
				</Col>
			</Row>
		</div>
	)
}