import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()

        await supabase.auth.exchangeCodeForSession(code)

        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (!profile) {
                await supabase.from('profiles').insert({
                    id: user.id,
                    email: user.email,
                    full_name:
                        user.user_metadata.full_name ??
                        user.user_metadata.name ??
                        '',
                    role: 'manager'
                })

                return NextResponse.redirect(
                    `${origin}/manager/dashboard`
                )
            }

            return NextResponse.redirect(
                profile.role === 'admin'
                    ? `${origin}/admin/dashboard`
                    : `${origin}/manager/dashboard`
            )
        }
    }

    return NextResponse.redirect(`${origin}/auth/login`)
}