import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  timestamp: string
}

export function successResponse<T>(
  data: T,
  message: string = 'Operation successful',
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

export function errorResponse(
  error: string,
  code: string = 'ERROR',
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

export function validationErrorResponse(error: ZodError): NextResponse {
  const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  return errorResponse(messages, 'VALIDATION_ERROR', 400)
}

export function unauthorizedResponse(): NextResponse {
  return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 'FORBIDDEN', 403)
}

export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, 'NOT_FOUND', 404)
}

export function conflictResponse(message: string): NextResponse {
  return errorResponse(message, 'CONFLICT', 409)
}

export function serverErrorResponse(error: unknown): NextResponse {
  console.error('Server error:', error)
  return errorResponse('Internal server error', 'INTERNAL_ERROR', 500)
}