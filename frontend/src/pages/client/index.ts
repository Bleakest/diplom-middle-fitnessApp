import { lazy } from 'react'

export const AddProgress = lazy(() => import('./AddProgress').then(module => ({ default: module.AddProgress })))
export const AllReports = lazy(() => import('./AllReports').then(module => ({ default: module.AllReports })))
export const Main = lazy(() => import('./Main').then(module => ({ default: module.Main })))
export const Nutrition = lazy(() => import('./Nutrition').then(module => ({ default: module.Nutrition })))
export const PersonalAccount = lazy(() => import('./PersonalAccount').then(module => ({ default: module.PersonalAccount })))
export const Progress = lazy(() => import('./Progress').then(module => ({ default: module.Progress })))
export const Report = lazy(() => import('./Report').then(module => ({ default: module.Report })))
export const Trainer = lazy(() => import('./Trainer').then(module => ({ default: module.Trainer })))
