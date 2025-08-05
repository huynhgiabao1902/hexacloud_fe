import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Subscription detail API called')
    
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')
    
    if (!planId) {
      return NextResponse.json({
        success: false,
        error: 'Plan ID is required'
      }, { status: 400 })
    }

    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const token = authorization.split(' ')[1]
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 })
    }

    console.log('✅ Authenticated user:', user.email, 'Requesting plan:', planId)

    // Lấy thông tin plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError)
      return NextResponse.json({
        success: false,
        error: 'Plan not found'
      }, { status: 404 })
    }

    // Kiểm tra xem user có active subscription cho plan này không
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .eq('status', 'active')
      .single()

    console.log('✅ Plan found:', plan.name, 'Subscription active:', !!subscription)

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        isActive: !!subscription,
        subscription: subscription || null
      }
    })

  } catch (error: any) {
    console.error('❌ Subscription detail error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 })
  }
} 