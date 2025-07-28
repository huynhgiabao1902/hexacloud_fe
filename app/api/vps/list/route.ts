import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://172.19.37.239:8080'

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
    console.log('🔗 Backend URL:', BACKEND_URL)

    // Call the correct endpoint
    const response = await fetch(`${BACKEND_URL}/api/vps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    console.log('📥 Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Backend error response:', errorText)

      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`,
        details: errorText
      }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ Backend response data:', result)

    // Filter servers for the specific user if needed
    let userServers = result.data || []

    // If the backend doesn't filter by user, do it here
    if (Array.isArray(userServers)) {
      userServers = userServers.filter((server: any) =>
        server.user_id === user_id || !server.user_id
      )
    }

    return NextResponse.json({
      success: true,
      data: userServers,
      count: userServers.length,
      breakdown: result.breakdown || { manual: 0, cloud: 0 }
    })

  } catch (error: any) {
    console.error('❌ VPS List API error:', error)

    // Check if it's a timeout error
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Request timeout - backend took too long to respond',
        backend_url: BACKEND_URL
      }, { status: 504 })
    }

    // Check if it's a connection error
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: 'Cannot connect to backend server',
        message: 'Please ensure the backend is running',
        backend_url: BACKEND_URL
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      backend_url: BACKEND_URL
    }, { status: 500 })
  }
}