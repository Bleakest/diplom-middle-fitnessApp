import { Typography, Card, Spin, Alert, Empty, Button } from 'antd'
import { PROGRESS_METRICS } from '../../constants/progressMetrics'
import { ProgressChart } from '../../components'
import { useGetProgressChartDataQuery } from '../../store/api/progress.api'

const { Title } = Typography

export const Progress = () => {
  const { data: progressData, isLoading, error, refetch } = useGetProgressChartDataQuery()

  if (isLoading) {
    return (
      <div className="page-container gradient-bg">
        <div className="page-card">
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container gradient-bg">
        <div className="page-card">
          <Alert 
            message="Ошибка загрузки" 
            description="Не удалось загрузить данные о прогрессе"
            type="error" 
            showIcon
            action={
              <Button size="small" onClick={refetch}>
                Повторить
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const chartData = progressData || []

  return (
    <div className='page-container gradient-bg'>
      <div className='page-card'>
        <div className='section-header'>
          <Title level={2} className='section-title'>
            📈 Ваш прогресс
          </Title>
        </div>

        {chartData.length === 0 ? (
          <Empty 
            description="Нет данных о прогрессе"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary"
              onClick={() => window.location.href = '/progress/new-report'}
            >
              Добавить первый отчет
            </Button>
          </Empty>
        ) : (
          <Card className='!border !border-gray-200'>
            <ProgressChart
              data={chartData}
              metrics={PROGRESS_METRICS}
              chartTitle='График прогресса'
            />
          </Card>
        )}
      </div>
    </div>
  )
}