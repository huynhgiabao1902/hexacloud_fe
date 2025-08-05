import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Check VPS in database
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Check VPS API called')

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

    // Validate required fields
    if (!body.ip_address || !body.username) {
      return NextResponse.json({
        success: false,
        error: 'Required fields missing: ip_address, username'
      }, { status: 400 })
    }

    console.log('🔍 Checking VPS in database:', body.ip_address)

    // Check if VPS exists in database
    const { data: vpsList, error: dbError } = await supabaseAdmin
      .from('user_vps')
      .select('*')
      .eq('user_id', user.id)
      .eq('host', body.ip_address)
      .eq('username', body.username)

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + dbError.message
      }, { status: 500 })
    }

    if (!vpsList || vpsList.length === 0) {
      console.log('❌ VPS not found in database')
      return NextResponse.json({
        success: false,
        error: 'VPS not found in database'
      }, { status: 404 })
    }

    const vps = vpsList[0] // Get first match

    console.log('✅ VPS found in database:', vps.id)

    // Update last connection test
    await supabaseAdmin
      .from('user_vps')
      .update({
        last_connection_test: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', vps.id)

    return NextResponse.json({
      success: true,
      data: {
        vpsId: vps.id,
        name: vps.name,
        host: vps.host,
        port: vps.port,
        username: vps.username,
        provider: vps.provider,
        region: vps.region,
        status: vps.status,
        admin_verified: vps.admin_verified,
        cpu_usage: vps.cpu_usage,
        memory_usage: vps.memory_usage,
        disk_usage: vps.disk_usage,
        uptime_hours: vps.uptime_hours,
        last_connection_test: vps.last_connection_test,
        created_at: vps.created_at,
        message: 'VPS found in database with current metrics'
      }
    })

  } catch (error: any) {
    console.error('❌ Check VPS error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 })
  }
}

// GET - Not supported on /check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'GET method not supported on /check endpoint. Use POST to check VPS.'
  }, { status: 405 })
} 