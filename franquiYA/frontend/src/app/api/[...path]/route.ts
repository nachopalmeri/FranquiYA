import { NextRequest, NextResponse } from 'next/server'
import { demoInventory } from '@/server/demo-inventory'

const DEMO_TOKEN_LIFETIME_MS = 60 * 60 * 1000
// Sample data is public; this marker gates demo UI access and is not a private credential.
const issueDemoToken = () => `franquiya-demo-${Math.floor(Date.now() / DEMO_TOKEN_LIFETIME_MS)}`
const DEMO_USER = {
  id: 0,
  email: 'demo@franquiya.com',
  name: 'Demo Franquiciado',
  role: 'admin',
  user_type: 'franquiciado',
  franchise_id: 0,
  franchise_name: 'FranquiYA Demo',
  is_active: true,
  requires_setup: false,
  completed_tour: true,
  is_demo: true,
}

type RouteContext = { params: Promise<{ path: string[] }> }

function jsonError(status: number, detail: string) {
  return NextResponse.json({ detail }, { status })
}

function isDemoRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const currentWindow = Math.floor(Date.now() / DEMO_TOKEN_LIFETIME_MS)
  return token === `franquiya-demo-${currentWindow}` || token === `franquiya-demo-${currentWindow - 1}`
}

async function handleGet(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  const route = path.join('/')

  if (route === 'auth/me') {
    return isDemoRequest(request) ? NextResponse.json(DEMO_USER) : jsonError(401, 'Not authenticated')
  }

  if (!isDemoRequest(request)) return jsonError(401, 'Not authenticated')

  if (route === 'stock') {
    return NextResponse.json(demoInventory.list(request.nextUrl.searchParams.get('category') ?? undefined))
  }

  if (route === 'stock/alerts') return NextResponse.json(demoInventory.alerts())

  if (route === 'dashboard/stats') return NextResponse.json(demoInventory.stats())

  const productMatch = route.match(/^stock\/(\d+)$/)
  if (productMatch) {
    const product = demoInventory.get(Number(productMatch[1]))
    return product ? NextResponse.json(product) : jsonError(404, 'Producto no encontrado')
  }

  return jsonError(404, 'Not found')
}

async function handlePost(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  if (path.join('/') === 'auth/demo') {
    return NextResponse.json({ access_token: issueDemoToken(), token_type: 'bearer', user: DEMO_USER })
  }

  return jsonError(403, 'Demo mode is read-only')
}

export const GET = handleGet
export const POST = handlePost
export const PUT = () => jsonError(403, 'Demo mode is read-only')
export const PATCH = () => jsonError(403, 'Demo mode is read-only')
export const DELETE = () => jsonError(403, 'Demo mode is read-only')
