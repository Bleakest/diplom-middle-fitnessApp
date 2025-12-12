import { lazy } from 'react'

export const Login = lazy(() => import('./Login').then(module => ({ default: module.Login })))
export const Registration = lazy(() => import('./Registration').then(module => ({ default: module.Registration })))