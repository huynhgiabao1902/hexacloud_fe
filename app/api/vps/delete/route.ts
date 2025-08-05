import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Delete VPS API called')
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    console.log('📝 Request data:', body)

    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const token = authorization.split(' ')[1]
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 })
    }
    console.log('✅ Authenticated user:', user.email)

    if (!body.vpsId) {
      return NextResponse.json({ success: false, error: 'VPS ID is required' }, { status: 400 })
    }

    console.log('🗑️ Deleting VPS:', body.vpsId, 'for user:', user.id)

    // Delete VPS from database
    const { error: deleteError } = await supabaseAdmin
      .from('user_vps')
      .delete()
      .eq('id', body.vpsId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Database error:', deleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete VPS: ' + deleteError.message }, { status: 500 })
    }

    console.log('✅ VPS deleted successfully:', body.vpsId)
    return NextResponse.json({
      success: true,
      message: 'VPS deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Delete VPS error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}

// GET - Not supported on /delete endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'GET method not supported on /delete endpoint. Use DELETE to remove VPS.'
  }, { status: 405 })
}