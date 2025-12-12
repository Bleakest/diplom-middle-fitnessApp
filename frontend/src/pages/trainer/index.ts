import { lazy } from 'react'

export const AddNutritionTrainer = lazy(() => import('./AddNutritionTrainer').then(module => ({ default: module.AddNutritionTrainer })))
export const Admin = lazy(() => import('./Admin').then(module => ({ default: module.Admin })))
export const ChatWithClient = lazy(() => import('./ChatWithClient').then(module => ({ default: module.ChatWithClient })))
export const ClientProfile = lazy(() => import('./ClientProfile').then(module => ({ default: module.ClientProfile })))
export const CreateNutritionTrainer = lazy(() => import('./CreateNutritionTrainer').then(module => ({ default: module.CreateNutritionTrainer })))
export const NutritionPlanTrainer = lazy(() => import('./NutritionPlanTrainer').then(module => ({ default: module.NutritionPlanTrainer })))
export const NutritionTrainer = lazy(() => import('./NutritionTrainer').then(module => ({ default: module.NutritionTrainer })))
export const AllReportsAdmin = lazy(() => import('./AllReportsAdmin').then(module => ({ default: module.AllReportsAdmin })))
