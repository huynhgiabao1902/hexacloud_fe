// app/pricing/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price: number
  storage_gb: number
  cpu_cores: number
  ram_gb: number
  max_vps: number
  features: any
  is_active: boolean
}

interface WalletData {
  balance: number
  currentPlan: SubscriptionPlan | null
  activeSubscription: any
}

export default function PricingPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Vui lòng đăng nhập để xem gói dịch vụ')
      router.push('/login')
      return
    }
    setUser(session.user)
    // Lấy current_plan_id từ profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_plan_id')
      .eq('id', session.user.id)
      .single()
    setCurrentPlanId(profile?.current_plan_id || null)
    // Fetch data after auth check
    await Promise.all([
      fetchPlans(),
      fetchWalletData(session.access_token)
    ])
  }

  const fetchPlans = async () => {
    try {
      console.log('🔍 Fetching subscription plans from database...')

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) {
        console.error('Error fetching plans:', error)
        throw error
      }

      if (data && data.length > 0) {
        console.log('✅ Plans fetched from database:', data.length)
        setPlans(data)
      } else {
        console.log('⚠️ No plans found in database')
        toast.error('Không tìm thấy gói dịch vụ')
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error)
      toast.error('Không thể tải danh sách gói dịch vụ')
    }
  }

  const fetchWalletData = async (token: string) => {
    try {
      console.log('💰 Fetching wallet data...')

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('💰 Wallet data result:', result)

      if (result.success) {
        setWalletData(result.data)
        console.log('✅ Wallet balance:', result.data.balance)
      } else {
        throw new Error(result.error || 'Failed to fetch wallet data')
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error)
      toast.error('Không thể tải thông tin ví')
      // Set default wallet data to prevent UI errors
      setWalletData({
        balance: 0,
        currentPlan: null,
        activeSubscription: null
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    setPurchasing(plan.id)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Phiên đăng nhập hết hạn')
        router.push('/login')
        return
      }

      // Gọi API tạo payment cho mua gói
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: plan.price,
          description: `Thanh toán mua gói ${plan.display_name}`,
          type: 'subscription_purchase', // luôn truyền type này khi mua gói
          packageId: plan.id,
          redirect: '/payment/success' // hoặc trang bạn muốn redirect về sau khi thanh toán
        })
      })

      const result = await response.json()
      if (result.success && result.data.paymentUrl) {
        // Lưu lại thông tin gói nếu cần xử lý sau
        localStorage.setItem('pending_package_id', plan.id)
        localStorage.setItem('pending_payment_type', 'subscription_purchase')
        window.location.href = result.data.paymentUrl
      } else {
        throw new Error(result.error || 'Không thể tạo thanh toán')
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi tạo thanh toán')
    } finally {
      setPurchasing(null)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí'
    return `${price.toLocaleString('vi-VN')}đ/tháng`
  }

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = []
    
    // Thêm thông tin VPS từ features
    if (plan.features?.vps) {
      features.push(`${plan.features.vps} VPS`)
    }
    
    // Thêm mô tả từ features
    if (plan.features?.description) {
      features.push(plan.features.description)
    }

    return features
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải gói dịch vụ...</span>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không có gói dịch vụ</h2>
          <p className="text-muted-foreground mb-4">Hiện tại chưa có gói dịch vụ nào được cấu hình.</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Chọn gói dịch vụ phù hợp với bạn</h1>
      
        {walletData && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Wallet className="w-4 h-4 mr-2" />
              Số dư ví: {walletData.balance.toLocaleString('vi-VN')}đ
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/wallet')}
            >
              Nạp thêm
            </Button>
          </div>
        )}
        {walletData?.activeSubscription && (
          <div className="mt-2">
            <Badge variant="outline" className="text-sm">
              Gói hiện tại: {walletData.activeSubscription.subscription_plans?.display_name || 'Unknown'}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          console.log('currentPlanId:', currentPlanId, 'plan.id:', plan.id)
          const isCurrentPlan = String(currentPlanId) === String(plan.id)
          const isPopular = plan.name.toLowerCase() === 'plus' || plan.name.toLowerCase() === 'pro'

          return (
            <Card
              key={plan.id}
              className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                  Phổ biến nhất
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4" variant="secondary">
                  Gói hiện tại
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {getPlanFeatures(plan).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'secondary' : isPopular ? 'default' : 'outline'}
                  disabled={isCurrentPlan || purchasing === plan.id}
                  onClick={() => handlePurchase(plan)}
                >
                  {purchasing === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCurrentPlan ? 'Đang sử dụng' : plan.price === 0 ? 'Bắt đầu miễn phí' : 'Mua gói'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

     
    </div>
  )
}