import React from 'react'
import clsx from 'clsx'
import {
	CheckCircleOutlined,
	ClockCircleOutlined,
	ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { MessageType } from '../../types'

type MessageProps = {
	msg: MessageType
	onPreview: (url: string) => void
	currentUserId?: string
}

export const Message: React.FC<MessageProps> = ({ msg, onPreview, currentUserId }) => {
	const isOwnMessage = msg.sender.id === currentUserId

	// Форматируем время
	const formatTime = (dateString: string) => {
		const date = new Date(dateString)
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${hours}:${minutes}`
	}

	const renderStatusIcon = () => {
		if (!isOwnMessage) return null // Показывать статус только для своих сообщений

		switch (msg.status) {
			case 'sending':
				return (
					<ClockCircleOutlined className='message-status-icon message-status-sending' />
				)
			case 'sent':
				return <CheckCircleOutlined className='message-status-icon message-status-sent' />
			case 'error':
				return (
					<ExclamationCircleOutlined className='message-status-icon message-status-error' />
				)
			default:
				return null
		}
	}

	return (
		<div
			className={clsx(
				'message-bubble',
				isOwnMessage ? 'message-bubble-own' : 'message-bubble-other',
				msg.status === 'error' && 'message-bubble-error',
			)}
		>
			{msg?.text && (
				<div className='message-content'>
					<span className='message-text'>{msg.text}</span>
					{renderStatusIcon()}
				</div>
			)}
			{msg?.imageUrl && (
				<div>
					<img
						src={msg.imageUrl}
						alt='attachment'
						className={clsx(
							'message-image',
							msg.status === 'sending' && 'message-image-sending',
						)}
						onClick={() => onPreview(msg.imageUrl!)}
					/>
				</div>
			)}
			<div className='message-timestamp'>{formatTime(msg.createdAt)}</div>
		</div>
	)
}
