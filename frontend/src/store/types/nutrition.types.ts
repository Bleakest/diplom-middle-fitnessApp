export interface NutritionCategory {
	id: string
	trainerId: string
	name: string
	description?: string
	subcategories: NutritionSubcategory[] // массив подкатегорий
	createdAt: string | Date
	updatedAt: string | Date
}

export interface NutritionSubcategory {
	id: string
	categoryId: string
	name: string
	description?: string
	days?: NutritionDay[] // полный массив дней
	createdAt: string | Date
	updatedAt: string | Date
}

export interface NutritionDay {
	id: string
	subcatId: string
	dayTitle: string
	dayOrder: number
	meals: NutritionMeal[]
	createdAt: string | Date
	updatedAt: string | Date
}

export interface NutritionMeal {
	id: string
	dayId: string
	type: MealType
	name: string
	mealOrder: number
	items: string[]
	createdAt: string | Date
	updatedAt: string | Date
}

export type MealType = 'BREAKFAST' | 'SNACK' | 'LUNCH' | 'DINNER'

export interface AssignedNutritionPlan {
	id: string
	clientId: string
	subcatId: string
	dayIds: string[]
	createdAt: string | Date
}

export interface NutritionMealInput {
	type: MealType
	name: string
	mealOrder: number
	items: string[]
}

export interface NutritionDayInput {
	dayTitle: string
	dayOrder: number
	meals: NutritionMealInput[]
}

export interface NutritionDayUpdate {
	dayTitle?: string
	dayOrder?: number
	meals?: NutritionMealInput[]
}

export interface TempDay extends NutritionDayInput {
	id: string
	subcatId?: string
	createdAt?: Date
	updatedAt?: Date
}
