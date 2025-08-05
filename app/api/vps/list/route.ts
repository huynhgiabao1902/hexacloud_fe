import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    console.log('📋 Fetching VPS list for user:', user_id)

    const supabaseAdmin = getSupabaseAdmin()

    // Get VPS list from Supabase
    const { data: vpsList, error: dbError } = await supabaseAdmin
      .from('user_vps')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + dbError.message
      }, { status: 500 })
    }

    console.log(`✅ Found ${vpsList?.length || 0} VPS for user`)

    // Transform data to match frontend interface
    const transformedVpsList = (vpsList || []).map((vps: any) => ({
      id: vps.id,
      name: vps.name,
      host: vps.host,
      port: vps.port || 22,
      username: vps.username,
      password: vps.password_encrypted, // This contains the actual password (plain text as per user request)
      status: vps.status || 'unknown',
      type: vps.provider === 'other' ? 'manual' : 'cloud',
      provider: vps.provider || 'other',
      region: vps.region || '',
      zone: vps.region || '',
      machineType: '',
      description: vps.notes || '',
      tags: [],
      user_id: vps.user_id,
      created_at: vps.created_at,
      updated_at: vps.updated_at,
      last_checked: vps.last_connection_test,
      metrics: {
        cpu: vps.cpu_usage,
        memory: vps.memory_usage,
        disk: vps.disk_usage,
        uptime: vps.uptime_hours
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedVpsList,
      count: transformedVpsList.length,
      breakdown: {
        manual: transformedVpsList.filter((vps: any) => vps.type === 'manual').length,
        cloud: transformedVpsList.filter((vps: any) => vps.type === 'cloud').length
      }
    })

  } catch (error: any) {
    console.error('❌ VPS List API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error: ' + error.message
    }, { status: 500 })
  }
}