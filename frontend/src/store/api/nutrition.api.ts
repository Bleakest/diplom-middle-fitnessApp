import type {
	NutritionCategory,
	NutritionSubcategory,
	NutritionDay,
	AssignedNutritionPlan,
	NutritionDayInput,
	NutritionDayUpdate,
} from '../types/nutrition.types'
import {
	createApi,
	fetchBaseQuery,
	type BaseQueryFn,
	type FetchArgs,
	type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { API_ENDPOINTS } from '../../config/api.config'

const rawBaseQuery = fetchBaseQuery({
	baseUrl: API_ENDPOINTS.base,
	credentials: 'include',
	prepareHeaders: (headers) => {
		const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
		if (token) {
			headers.set('authorization', `Bearer ${token}`)
		}
		return headers
	},
})

export const baseQueryWithReauth: BaseQueryFn<
	string | FetchArgs,
	unknown,
	FetchBaseQueryError
> = async (args, api, extraOptions) => {
	let result = await rawBaseQuery(args, api, extraOptions)

	if (result.error && result.error.status === 401) {
		const refreshResult = await rawBaseQuery(
			{
				url: '/auth/refresh',
				method: 'POST',
				credentials: 'include',
			},
			api,
			extraOptions,
		)

		if (refreshResult.data) {
			result = await rawBaseQuery(args, api, extraOptions)
		} else if (typeof window !== 'undefined') {
			localStorage.removeItem('token')
			window.location.href = '/login'
		}
	}

	return result
}

export const nutritionApi = createApi({
	reducerPath: 'nutritionApi',
	baseQuery: baseQueryWithReauth,
	tagTypes: ['Category', 'Subcategory', 'Day', 'AssignedPlan'],
	endpoints: (builder) => ({
		// План питания текущего клиента
		getClientNutritionPlan: builder.query<NutritionDay[], void>({
			query: () => '/nutrition/client/plan',
			providesTags: ['AssignedPlan', 'Day'],
		}),

		// === КАТЕГОРИИ ===
		getCategories: builder.query<NutritionCategory[], void>({
			query: () => '/nutrition/categories',
			providesTags: ['Category'],
		}),

		createCategory: builder.mutation<
			NutritionCategory,
			{ name: string; description?: string }
		>({
			query: (category) => ({
				url: '/nutrition/categories',
				method: 'POST',
				body: category,
			}),
			invalidatesTags: ['Category'],
		}),

		updateCategory: builder.mutation<
			NutritionCategory,
			{ id: string; name?: string; description?: string }
		>({
			query: ({ id, ...updates }) => ({
				url: `/nutrition/categories/${id}`,
				method: 'PUT',
				body: updates,
			}),
			invalidatesTags: ['Category'],
		}),

		deleteCategory: builder.mutation<void, string>({
			query: (id) => ({
				url: `/nutrition/categories/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Category'],
		}),

		// === ПОДКАТЕГОРИИ ===
		getSubcategories: builder.query<NutritionSubcategory[], string>({
			query: (categoryId) => `/nutrition/categories/${categoryId}/subcategories`,
			providesTags: ['Subcategory'],
		}),

		createSubcategory: builder.mutation<
			NutritionSubcategory,
			{
				categoryId: string
				name: string
				description?: string
				days?: Array<{
					dayTitle: string
					dayOrder: number
					meals: Array<{
						type: 'BREAKFAST' | 'SNACK' | 'LUNCH' | 'DINNER'
						name: string
						mealOrder: number
						items: string[]
					}>
				}>
			}
		>({
			query: ({ categoryId, ...data }) => ({
				url: `/nutrition/categories/${categoryId}/subcategories`,
				method: 'POST',
				body: data,
			}),
			invalidatesTags: ['Subcategory', 'Category'],
		}),

		updateSubcategory: builder.mutation<
			NutritionSubcategory,
			{ id: string; name?: string; description?: string }
		>({
			query: ({ id, ...updates }) => ({
				url: `/nutrition/subcategories/${id}`,
				method: 'PUT',
				body: updates,
			}),
			invalidatesTags: ['Subcategory'],
		}),

		deleteSubcategory: builder.mutation<void, string>({
			query: (id) => ({
				url: `/nutrition/subcategories/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Subcategory', 'Category'],
		}),
		getSubcategory: builder.query<NutritionSubcategory, string>({
			query: (id) => `/nutrition/subcategories/${id}`,
			providesTags: (result, error, id) => [{ type: 'Subcategory', id }],
		}),

		//=== ДНИ ===
		getDays: builder.query<NutritionDay[], string>({
			query: (subcategoryId) => `/nutrition/subcategories/${subcategoryId}/days`,
			providesTags: ['Day'],
		}),

		getDay: builder.query<NutritionDay, string>({
			query: (dayId) => `/nutrition/days/${dayId}`,
			providesTags: ['Day'],
		}),

		createDay: builder.mutation<
			NutritionDay,
			NutritionDayInput & { subcategoryId: string }
		>({
			query: ({ subcategoryId, ...data }) => ({
				url: `/nutrition/subcategories/${subcategoryId}/days`,
				method: 'POST',
				body: data,
			}),
			invalidatesTags: ['Day'],
		}),

		updateDay: builder.mutation<
			NutritionDay,
			{ id: string; updates: NutritionDayUpdate }
		>({
			query: ({ id, updates }) => ({
				url: `/nutrition/days/${id}`,
				method: 'PATCH',
				body: updates,
			}),
			invalidatesTags: ['Day'],
		}),

		deleteDay: builder.mutation<void, string>({
			query: (id) => ({
				url: `/nutrition/days/${id}`,
				method: 'DELETE',
			}),
			invalidatesTags: ['Day'],
		}),

		// === НАЗНАЧЕНИЕ ПЛАНОВ ===
		assignNutritionPlan: builder.mutation<
			AssignedNutritionPlan,
			{
				clientId: string
				programId: string
				dayIds: string[]
			}
		>({
			query: (assignment) => ({
				url: `/clients/${assignment.clientId}/assign`,
				method: 'POST',
				body: assignment,
			}),
			invalidatesTags: ['AssignedPlan'],
		}),
	}),
})

export const {
	//категории
	useGetCategoriesQuery,
	useCreateCategoryMutation,
	useUpdateCategoryMutation,
	useDeleteCategoryMutation,
	//подкатегории
	useGetSubcategoriesQuery,
	useCreateSubcategoryMutation,
	useUpdateSubcategoryMutation,
	useDeleteSubcategoryMutation,
	useGetSubcategoryQuery,
	//дни
	useGetDaysQuery,
	useCreateDayMutation,
	useUpdateDayMutation,
	useDeleteDayMutation,
	//назначение планов
	useAssignNutritionPlanMutation,
	useGetClientNutritionPlanQuery,
} = nutritionApi
