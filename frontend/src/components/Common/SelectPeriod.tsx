import { Radio, Space, type RadioChangeEvent } from 'antd'

interface Props {
	period: 'month' | 'year' | 'all'
	handlePeriodChange: (e: RadioChangeEvent) => void
}

export const SelectPeriod = ({ period, handlePeriodChange }: Props) => {
	return (
		<Radio.Group value={period} onChange={handlePeriodChange}>
			<Space direction='horizontal'>
				<Radio.Button value='month'>Месяц</Radio.Button>
				<Radio.Button value='year'>Год</Radio.Button>
				<Radio.Button value='all'>Все время</Radio.Button>
			</Space>
		</Radio.Group>
	)
}