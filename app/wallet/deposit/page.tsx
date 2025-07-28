'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function DepositContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const suggestedAmount = searchParams.get('amount')
  const redirectUrl = searchParams.get('redirect')

  const [amount, setAmount] = useState(suggestedAmount || '')
  const [loading, setLoading] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)

  const presetAmounts = [50000, 100000, 200000, 500000, 1000000]

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    fetchCurrentBalance(session.access_token)
  }

  const fetchCurrentBalance = async (token: string) => {
    try {
      console.log('🔍 Fetching balance from:', process.env.NEXT_PUBLIC_BACKEND_URL)
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('💰 Balance response status:', response.status)
      if (response.ok) {
        const result = await response.json()
        console.log('💰 Balance result:', result)
        if (result.success) {
          setCurrentBalance(result.data.balance)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching balance:', error)
    }
  }

  const handleDeposit = async () => {
    const depositAmount = parseInt(amount)

    if (!depositAmount || depositAmount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ')
      return
    }

    if (depositAmount > 50000000) {
      toast.error('Số tiền nạp tối đa là 50.000.000đ')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session')
      }

      console.log('🚀 Starting deposit process:', {
        amount: depositAmount,
        token: session.access_token ? 'Present' : 'Missing',
        userEmail: session.user?.email
      })

      // Create payment with PayOS
      console.log('📤 Calling /api/create-payment...')
      const response = await fetch(`/api/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: depositAmount,
          description: `Nạp tiền vào ví - ${new Date().toLocaleDateString('vi-VN')}`
        })
      })

      console.log('📥 API Response status:', response.status)
      console.log('📥 API Response headers:', response.headers)

      const result = await response.json()
      console.log('📋 API Response dataaaaaaaaa:', result.data.paymentUrl)

      if (result.success && result.data.paymentUrl) {
        toast.success('Đang chuyển đến trang thanh toán...')

        // Store redirect URL if any
        if (redirectUrl) {
          localStorage.setItem('deposit_redirect', redirectUrl)
        }

        console.log('🔗 Redirecting to PayOS:', result.data.paymentUrl)
        // Redirect to PayOS payment page
        window.location.href = result.data.paymentUrl
      } else {
        console.error('❌ Payment creation failed:', result)
        throw new Error(result.error || 'Failed to create payment')
      }

    } catch (error: any) {
      console.error('💥 Deposit error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi tạo thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '')

    // Format with thousand separators
    if (numericValue) {
      setAmount(numericValue)
    } else {
      setAmount('')
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nạp tiền vào ví</CardTitle>
            <CardDescription>
              Nạp tiền để mua gói dịch vụ và sử dụng các tính năng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Balance */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Số dư hiện tại</span>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-semibold">
                    {currentBalance.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền nạp</Label>
              <Input
                id="amount"
                type="text"
                placeholder="Nhập số tiền (VNĐ)"
                value={amount ? parseInt(amount).toLocaleString('vi-VN') : ''}
                onChange={(e) => formatAmount(e.target.value)}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Tối thiểu 10.000đ - Tối đa 50.000.000đ
              </p>
            </div>

            {/* Preset Amounts */}
            <div className="space-y-2">
              <Label>Chọn nhanh</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className={amount === preset.toString() ? 'border-primary' : ''}
                  >
                    {preset.toLocaleString('vi-VN')}đ
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <Label>Phương thức thanh toán</Label>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-semibold">P</span>
                  </div>
                  <div>
                    <p className="font-medium">PayOS</p>
                    <p className="text-sm text-muted-foreground">
                      Thanh toán qua QR Code hoặc chuyển khoản
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                className="flex-1"
                onClick={handleDeposit}
                disabled={!amount || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Đang xử lý...' : 'Nạp tiền'}
              </Button>
            </div>

            {/* Notice */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Giao dịch sẽ được xử lý ngay lập tức</p>
              <p>• Không thu phí giao dịch</p>
              <p>• Hỗ trợ 24/7 qua email</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nạp tiền vào ví</CardTitle>
            <CardDescription>
              Đang tải...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DepositPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DepositContent />
    </Suspense>
  )
}