import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
	let response = NextResponse.next({
		request
	})

	// Supabase client
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),

				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) => {
						request.cookies.set(name, value)
					})

					response = NextResponse.next({
						request
					})

					cookiesToSet.forEach(({ name, value, options }) => {
						response.cookies.set(name, value, options)
					})
				}
			}
		}
	)

	// Current pathname
	const pathname = request.nextUrl.pathname

	// Current user
	const {
		data: { user }
	} = await supabase.auth.getUser()

	// =========================
	// НЕ АВТОРИЗОВАН
	// =========================

	const isAuthPage = pathname.startsWith('/auth')
	const isAdminPage = pathname.startsWith('/admin')

	// Не авторизован → login
	if (!user && !isAuthPage) {
		return NextResponse.redirect(new URL('/auth/login', request.url))
	}

	// Если пользователя нет дальше логика не нужна
	if (!user) {
		return response
	}

	// =========================
	// ROLE
	// =========================

	// Получаем роль только ОДИН раз
	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single()

	const role = profile?.role

	// =========================
	// AUTH PAGE
	// =========================

	// Авторизованный пользователь не должен видеть auth страницы
	if (isAuthPage) {
		const target = role === 'admin' ? '/admin/dashboard' : '/manager/dashboard'

		return NextResponse.redirect(new URL(target, request.url))
	}

	// =========================
	// ADMIN ACCESS
	// =========================

	// Менеджер не может заходить в admin
	if (isAdminPage && role !== 'admin') {
		return NextResponse.redirect(new URL('/manager/dashboard', request.url))
	}

	return response
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
