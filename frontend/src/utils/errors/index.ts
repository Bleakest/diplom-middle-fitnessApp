// Типы
export type {
	ApiErrorResponse,
	ApiErrorResponseAlt,
	RTKQueryError,
	ErrorType,
	NormalizedError,
} from './types'

export { HttpStatusCode } from './types'

// Парсинг ошибок
export {
	parseError,
	getErrorMessage,
	isAuthError,
	isNetworkError,
	isServerError,
} from './parseError'

// Отображение ошибок
export {
	showError,
	showApiError,
	showErrorWithFallback,
	handleError,
	handleMutationError,
} from './showError'

// Хук для компонентов
export { useApiError } from './useApiError'

