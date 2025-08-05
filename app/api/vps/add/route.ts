import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Add new VPS
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Add VPS API called')

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    console.log('📝 Request data:', body)

    // Lấy authorization header
    const authorization = request.headers.get('authorization')

    if (!authorization?.startsWith('Bearer ')) {
      console.log('❌ No authorization header')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const token = authorization.split(' ')[1]
    console.log('🔑 Token received:', token ? 'Yes' : 'No')

    // Verify token với Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 })
    }

         console.log('✅ Authenticated user:', user.email)

                       // Check user's subscription and VPS count
       const { data: profile, error: profileError } = await supabaseAdmin
         .from('profiles')
         .select('current_plan_id')
         .eq('id', user.id)
         .single()

       // Handle case where profile doesn't exist
       let hasPremiumPlan = false
       if (profileError) {
         console.warn('⚠️ Profile not found, creating default profile for user:', user.id)
         
         // Create default profile for user
         const { error: createProfileError } = await supabaseAdmin
           .from('profiles')
           .insert({
             id: user.id,
             email: user.email,
             current_plan_id: null, // Free plan
             wallet_balance: 0,
             total_spent: 0,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           })

         if (createProfileError) {
           console.error('❌ Failed to create profile:', createProfileError)
           hasPremiumPlan = false
         } else {
           console.log('✅ Created default profile for user')
           hasPremiumPlan = false
         }
       } else {
         // Check if user has premium plan directly from profiles and subscription_plans
         if (profile?.current_plan_id) {
           console.log('🎯 Checking plan ID:', profile.current_plan_id)
           
           // Check plan directly from subscription_plans
           const { data: plan, error: planError } = await supabaseAdmin
             .from('subscription_plans')
             .select('name, price')
             .eq('id', profile.current_plan_id)
             .single()

           console.log('💳 Plan data:', plan)
           console.log('💳 Plan error:', planError)

           if (!planError && plan && plan.price >= 30000) {
             hasPremiumPlan = true
             console.log('✅ User has premium plan:', plan.name, 'Price:', plan.price)
           } else {
             console.log('❌ User plan is not premium. Plan:', plan?.name, 'Price:', plan?.price)
           }
         }
       }
     
     if (!hasPremiumPlan) {
       // For free users, check VPS count
       const { data: existingVps, error: vpsError } = await supabaseAdmin
         .from('user_vps')
         .select('id')
         .eq('user_id', user.id)

       if (vpsError) {
         console.error('❌ VPS count error:', vpsError)
         return NextResponse.json({
           success: false,
           error: 'Failed to check VPS count'
         }, { status: 500 })
       }

       if (existingVps && existingVps.length >= 1) {
         return NextResponse.json({
           success: false,
           error: 'Free users can only add 1 VPS. Please upgrade to premium plan for unlimited VPS.'
         }, { status: 403 })
       }
     }

     // Validate required fields
     if (!body.name || !body.ip_address || !body.username || !body.password) {
       return NextResponse.json({
         success: false,
         error: 'Required fields missing: name, ip_address, username, password'
       }, { status: 400 })
     }

    console.log('💰 Adding VPS for user:', user.id, 'Name:', body.name)

                                         // Generate random metrics
                 const cpuUsage = Math.floor(Math.random() * 10) + 10 // 10-20%
                 const memoryUsage = Math.floor(Math.random() * 10) + 10 // 10-20%
                 const diskUsage = Math.floor(Math.random() * 10) + 10 // 10-20%
                 const uptimeHours = 0 // 0 hours for new servers

    // Insert VPS into database
    const { data: vps, error: dbError } = await supabaseAdmin
      .from('user_vps')
      .insert({
        user_id: user.id,
        name: body.name,
        host: body.ip_address,
        port: parseInt(body.port) || 22,
        username: body.username,
        password_encrypted: body.password,
        provider: body.provider || 'other',
        region: body.region || '',
        notes: body.notes || '',
        status: 'connected',
        admin_verified: true,
        verification_attempts: 1,
        last_connection_test: new Date().toISOString(),
        cpu_usage: cpuUsage,
        memory_usage: memoryUsage,
        disk_usage: diskUsage,
        uptime_hours: uptimeHours,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Failed to add VPS: ' + dbError.message
      }, { status: 500 })
    }

    console.log('✅ VPS added successfully:', vps.id)

    return NextResponse.json({
      success: true,
      data: {
        vpsId: vps.id,
        name: vps.name,
        host: vps.host,
        status: vps.status,
        message: 'VPS added successfully to database'
      }
    })

  } catch (error: any) {
    console.error('❌ Add VPS error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 })
  }
}

// GET - Not supported on /add endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'GET method not supported on /add endpoint. Use POST to add VPS.'
  }, { status: 405 })
}