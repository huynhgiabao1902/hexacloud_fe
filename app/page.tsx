'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, Shield, Zap, Users, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

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

export default function HomePage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(2) // Chỉ lấy 2 gói đầu tiên

      if (error) {
        console.error('Error fetching plans:', error)
      } else if (data && data.length > 0) {
        setPlans(data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
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
    
    // Thêm features mặc định nếu không có dữ liệu từ features
    if (!plan.features?.vps && !plan.features?.description) {
      if (plan.price === 0) {
        features.push('1 VPS')
        features.push('Phù hợp cho dự án nhỏ và học tập')
        features.push('Hỗ trợ cơ bản')
      } else {
        features.push(`${plan.max_vps || 3} VPS`)
        features.push('Hiệu suất cao, ổn định cho production')
        features.push('Hỗ trợ ưu tiên 24/7')
      }
    }
    
    return features
  }
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Quản lý <span className="text-blue-600">Cloud</span>
              <br />
              Thông minh hơn
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              HexaCloud cung cấp nền tảng quản lý đám mây toàn diện, giúp doanh nghiệp tối ưu hóa hiệu suất và tiết kiệm
              chi phí.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-3">
                  Bắt đầu miễn phí
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Xem Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tại sao chọn HexaCloud?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Chúng tôi cung cấp những tính năng tốt nhất để quản lý hạ tầng cloud của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Cloud className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Quản lý Tập trung</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Quản lý tất cả tài nguyên cloud từ một dashboard duy nhất</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Bảo mật Cao</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Mã hóa end-to-end và tuân thủ các tiêu chuẩn bảo mật quốc tế</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-yellow-100 dark:bg-yellow-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle>Hiệu suất Cao</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Tối ưu hóa tự động và scaling theo nhu cầu thực tế</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Hỗ trợ 24/7</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Gói dịch vụ phù hợp</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => {
                const isPopular = plan.name.toLowerCase() === 'plus' || plan.name.toLowerCase() === 'pro'
                const features = getPlanFeatures(plan)
                
                return (
                  <Card
                    key={plan.id}
                    className={`relative ${isPopular ? 'border-blue-500 border-2 shadow-lg scale-105' : ''}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Phổ biến nhất
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl">{plan.display_name}</CardTitle>
                      <div className="text-4xl font-bold text-blue-600 mt-4">
                        {formatPrice(plan.price)}
                      </div>
                      <CardDescription>
                        {plan.price === 0 ? 'Hoàn hảo để bắt đầu' : 'Cho doanh nghiệp và dự án chuyên nghiệp'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      <Link href={plan.price === 0 ? "/register" : "/pricing"}>
                        <Button className="w-full mt-6">
                          {plan.price === 0 ? 'Bắt đầu ngay' : 'Chọn gói này'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn doanh nghiệp đã tin tưởng HexaCloud
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Đăng ký miễn phí ngay
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
