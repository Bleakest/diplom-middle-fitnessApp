import { Typography } from 'antd'
import { Chat } from '../../components/Chat'

const { Title } = Typography

export const Trainer = () => {
	return (
<<<<<<< HEAD
		<div className='gradient-bg min-h-[calc(100vh-4rem)] p-10 flex justify-center items-start'>
			<div className='bg-light rounded-2xl p-10 shadow-xl border border-gray-200 w-full max-w-[800px]'>
				<div className='text-center mb-4'>
					<Title level={2} className='text-gray-800 font-semibold mb-1 pb-3 border-b-3 border-primary inline-block'>
=======
		<div className='page-container gradient-bg'>
			<div className='page-card' style={{ maxWidth: '800px' }}>
				<div className='section-header mb-4'>
					<Title level={2} className='section-title mb-1!'>
>>>>>>> 3cc3512 (fix: Исправить чат между клиентом и тренером.)
						💬 Чат с тренером
					</Title>
				</div>
				<Chat role='client' />
			</div>
		</div>
	)
}
