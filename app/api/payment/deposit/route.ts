import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import PayOS from '@payos/node'

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { amount, description } = await request.json()

    // Lấy authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const token = authorization.split(' ')[1]

    // Xác thực user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 })
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    // Tạo transaction
    const orderCode = Date.now()
    const paymentId = `DEPOSIT_${orderCode}`
    const fullDescription = description || `Nạp tiền vào ví - ${new Date().toLocaleDateString('vi-VN')}`

    const { data: transaction, error: dbError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        payment_id: paymentId,
        amount: amount,
        description: fullDescription,
        status: 'pending',
        payment_method: 'PayOS',
        type: 'deposit',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expired_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ success: false, error: 'Failed to create transaction: ' + dbError.message }, { status: 500 })
    }

    // Tạo payment link với PayOS
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment/success?transactionId=${transaction.id}&paymentId=${paymentId}`
    const cancelUrl = `${baseUrl}/payment/cancel?transactionId=${transaction.id}&paymentId=${paymentId}`

    const paymentData = {
      orderCode: orderCode,
      amount: amount,
      description: `Nap tien ${amount}VND`,
      returnUrl: successUrl,
      cancelUrl: cancelUrl
    }

    const paymentResult = await payOS.createPaymentLink(paymentData)

    // Cập nhật transaction với thông tin PayOS
    await supabaseAdmin
      .from('transactions')
      .update({
        payment_url: paymentResult.checkoutUrl,
        qr_code: paymentResult.qrCode,
        updated_at: new Date().toISOString(),
        metadata: {
          payos_order_code: orderCode,
          payos_short_description: paymentData.description,
          success_url: successUrl,
          cancel_url: cancelUrl
        }
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      data: {
        paymentUrl: paymentResult.checkoutUrl,
        paymentId: paymentId,
        transactionId: transaction.id,
        qrCode: paymentResult.qrCode,
        orderCode: orderCode,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        message: 'Deposit payment created successfully'
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}