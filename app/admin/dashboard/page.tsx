// app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Users,
  DollarSign,
  Star,
  Package,
  TrendingUp,
  Clock,
  MessageSquare,
  Shield,
  Activity,
  RefreshCw,
  LogOut,
  Loader2
} from 'lucide-react'

interface DashboardStats {
  users: {
    total: number
    newThisMonth: number
    active: number
  }
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  subscriptions: {
    total: number
    free: number
    plus: number
    pro: number
  }
  reviews: {
    total: number
    averageRating: number
    pending: number
  }
}

interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  wallet_balance: number
  subscription: any
  current_plan_id?: string | null
}

interface Review {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  admin_response?: string
  user: any
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState('users')
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({})
  const [plansMap, setPlansMap] = useState<Record<string, any>>({})
  const [currentPageUsers, setCurrentPageUsers] = useState(1)
  const [currentPageReviews, setCurrentPageReviews] = useState(1)
  const [currentPageTransactions, setCurrentPageTransactions] = useState(1)
  const [weeklyTransactionData, setWeeklyTransactionData] = useState<any[]>([])
  const [selectedWeek, setSelectedWeek] = useState(0) // 0: tuần hiện tại
  const [weeksInMonth, setWeeksInMonth] = useState<{start: Date, end: Date, label: string}[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date()) // Tháng được chọn
  const pageSize = 10

  // Admin emails (có thể lấy từ env hoặc config)
  const ADMIN_EMAILS = ['huynhgiabao050204@gmail.com']

  // Hàm lấy danh sách các tuần trong tháng hiện tại
  const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const weeks = []
    let start = new Date(firstDay)
    while (start <= lastDay) {
      const end = new Date(start)
      end.setDate(start.getDate() + 6 - start.getDay()) // Đến hết thứ 7
      if (end > lastDay) end.setTime(lastDay.getTime())
      weeks.push({
        start: new Date(start),
        end: new Date(end),
        label: `${start.getDate().toString().padStart(2, '0')}/${(start.getMonth()+1).toString().padStart(2, '0')} - ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth()+1).toString().padStart(2, '0')}`
      })
      start = new Date(end)
      start.setDate(start.getDate() + 1)
    }
    return weeks
  }

  // Hàm tính toán dữ liệu giao dịch cho 1 tuần bất kỳ
  const calculateTransactionDataForWeek = (transactions: any[], week: {start: Date, end: Date}) => {
    const days: {date: string, amount: number, count: number}[] = []
    let d = new Date(week.start)
    d.setHours(0,0,0,0)
    while (d <= week.end) {
      const dayStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      const dayTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.created_at)
        txDate.setHours(0,0,0,0)
        return txDate.getTime() === d.getTime()
      })
      days.push({
        date: dayStr,
        amount: dayTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
        count: dayTransactions.length
      })
      d = new Date(d)
      d.setDate(d.getDate() + 1)
    }
    return days
  }

  // Hàm chuyển tháng
  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  // Hàm format tháng để hiển thị
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    // Cập nhật danh sách tuần khi load trang
    const now = new Date()
    setWeeksInMonth(getWeeksInMonth(now))
  }, [])

  // Khi selectedMonth thay đổi, cập nhật danh sách tuần
  useEffect(() => {
    const weeks = getWeeksInMonth(selectedMonth)
    setWeeksInMonth(weeks)
    
    // Tìm tuần có chứa ngày hiện tại
    const today = new Date()
    const currentWeekIndex = weeks.findIndex(week => {
      const weekStart = new Date(week.start)
      const weekEnd = new Date(week.end)
      weekStart.setHours(0, 0, 0, 0)
      weekEnd.setHours(23, 59, 59, 999)
      return today >= weekStart && today <= weekEnd
    })
    
    // Nếu tìm thấy tuần hiện tại trong tháng được chọn, chọn tuần đó
    // Nếu không tìm thấy (tháng khác), chọn tuần đầu tiên
    setSelectedWeek(currentWeekIndex >= 0 ? currentWeekIndex : 0)
  }, [selectedMonth])

  // Khi transactions hoặc selectedWeek thay đổi, cập nhật dữ liệu biểu đồ
  useEffect(() => {
    if (weeksInMonth.length && transactions.length) {
      const week = weeksInMonth[selectedWeek] || weeksInMonth[0]
      setWeeklyTransactionData(calculateTransactionDataForWeek(transactions, week))
    }
  }, [transactions, weeksInMonth, selectedWeek])

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Vui lòng đăng nhập')
        router.push('/login')
        return
      }

      // Kiểm tra quyền admin
      if (!ADMIN_EMAILS.includes(session.user.email || '')) {
        toast.error('Bạn không có quyền truy cập trang này')
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await fetchDashboardData(session.access_token)
    } catch (error) {
      console.error('Admin check error:', error)
      router.push('/dashboard')
    }
  }

  const fetchDashboardData = async (token: string) => {
    try {
      setRefreshing(true)
      setLoadingTx(true)

      // Fetch users from profiles (now includes email column)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('usersData:', usersData)
      console.log('usersError:', usersError)
      
      if (!usersError && usersData) {
        setUsers(usersData)
        const map: Record<string, any> = {}
        usersData.forEach((profile: any) => {
          map[profile.id] = profile
        })
        setProfilesMap(map)
      }

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, display_name')
      if (!plansError && plansData) {
        const planMap: Record<string, any> = {}
        plansData.forEach(plan => {
          planMap[plan.id] = plan.display_name
        })
        setPlansMap(planMap)
      }

      // Fetch reviews (không join profiles)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
      if (!reviewsError && reviewsData) {
        setReviews(reviewsData)
      }

      // Fetch transactions (không join profiles)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData)
        // Tính toán dữ liệu cho biểu đồ
        const weeklyData = calculateWeeklyTransactionData(transactionsData)
        setWeeklyTransactionData(weeklyData)
      }
      setLoadingTx(false)

    } catch (error) {
      console.error('Dashboard fetch error:', error)
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleReplyReview = async (reviewId: string, response: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_response: response })
        .eq('id', reviewId)

      if (error) throw error

      toast.success('Đã phản hồi đánh giá')

      // Refresh reviews
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchDashboardData(session.access_token)
      }
    } catch (error) {
      console.error('Reply error:', error)
      toast.error('Không thể phản hồi đánh giá')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const calculateWeeklyTransactionData = (transactions: any[]) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay()) // Bắt đầu từ Chủ nhật
    startOfWeek.setHours(0, 0, 0, 0)

    const weekDays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
    const weeklyData = weekDays.map((day, index) => {
      const dayStart = new Date(startOfWeek)
      dayStart.setDate(startOfWeek.getDate() + index)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)

      const dayTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.created_at)
        return txDate >= dayStart && txDate < dayEnd
      })

      const totalAmount = dayTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      const transactionCount = dayTransactions.length

      return {
        day,
        amount: totalAmount,
        count: transactionCount,
        date: dayStart.toLocaleDateString('vi-VN')
      }
    })

    return weeklyData
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const refreshData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await fetchDashboardData(session.access_token)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const getTransactionIcon = (description: string) => {
    if (description.includes('nạp')) {
      return <Clock className="w-4 h-4 text-green-500" />
    } else if (description.includes('thanh toán')) {
      return <MessageSquare className="w-4 h-4 text-red-500" />
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">HexaCloud Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Tổng số người dùng</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giao dịch</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
              <p className="text-xs text-muted-foreground">Tổng số giao dịch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
              <p className="text-xs text-muted-foreground">Tổng số đánh giá</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng tiền giao dịch</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0).toLocaleString('vi-VN')}đ
              </div>
              <p className="text-xs text-muted-foreground">Tổng số tiền của tất cả giao dịch</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Transaction Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Giao dịch theo ngày trong tuần</CardTitle>
            <CardDescription>
              Biểu đồ thể hiện số lượng và tổng tiền giao dịch từng ngày trong tuần
              <div className="mt-2 space-y-2">
                {/* Month Selector */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth('prev')}
                  >
                    ←
                  </Button>
                  <span className="font-medium min-w-[120px] text-center">
                    {formatMonthYear(selectedMonth)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changeMonth('next')}
                  >
                    →
                  </Button>
                  {selectedMonth.getMonth() !== new Date().getMonth() || selectedMonth.getFullYear() !== new Date().getFullYear() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMonth(new Date())}
                    >
                      Về tháng hiện tại
                    </Button>
                  ) : null}
                </div>
                {/* Week Selector */}
                <div>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-background"
                    value={selectedWeek}
                    onChange={e => setSelectedWeek(Number(e.target.value))}
                  >
                    {weeksInMonth.map((w, idx) => (
                      <option value={idx} key={w.label}>
                        Tuần {idx+1}: {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTransactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value.toLocaleString('vi-VN')}đ`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'Tổng tiền' 
                        ? `${Number(value).toLocaleString('vi-VN')}đ` 
                        : value,
                      name === 'Tổng tiền' ? 'Tổng tiền' : 'Số giao dịch'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone"
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Tổng tiền"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone"
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Số giao dịch"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Người dùng ({users.length})</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá ({reviews.length})</TabsTrigger>
            <TabsTrigger value="transactions">Giao dịch ({transactions.length})</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách người dùng</CardTitle>
                <CardDescription>Quản lý tất cả người dùng trong hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Họ tên</th>
                        <th className="text-left p-2">Ngày tham gia</th>
                        <th className="text-left p-2">Số dư ví</th>
                        <th className="text-left p-2">Gói đang sử dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice((currentPageUsers-1)*pageSize, currentPageUsers*pageSize).map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">{user.full_name || 'N/A'}</td>
                          <td className="p-2">{formatDate(user.created_at)}</td>
                          <td className="p-2">{formatCurrency(user.wallet_balance || 0)}</td>
                          <td className="p-2">
                            {user.current_plan_id && plansMap[user.current_plan_id]
                              ? plansMap[user.current_plan_id]
                              : 'Chưa đăng ký'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPageUsers === 1}
                    onClick={() => setCurrentPageUsers((p) => Math.max(1, p-1))}
                  >
                    Trang trước
                  </Button>
                  <span className="flex items-center px-3">
                    Trang {currentPageUsers} / {Math.ceil(users.length/pageSize) || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPageUsers === Math.ceil(users.length/pageSize) || users.length === 0}
                    onClick={() => setCurrentPageUsers((p) => Math.min(Math.ceil(users.length/pageSize), p+1))}
                  >
                    Trang sau
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá từ người dùng</CardTitle>
                <CardDescription>Danh sách đánh giá của người dùng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Chưa có đánh giá nào</p>
                ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full border-collapse">
                       <thead>
                         <tr className="border-b">
                           <th className="text-left p-2">Tên người dùng</th>
                           <th className="text-left p-2">Rating</th>
                           <th className="text-left p-2">Bình luận</th>
                           <th className="text-left p-2">Thời gian</th>
                         </tr>
                       </thead>
                       <tbody>
                         {reviews.slice((currentPageReviews-1)*pageSize, currentPageReviews*pageSize).map((review) => (
                           <tr key={review.id} className="border-b hover:bg-muted/50">
                             <td className="p-2">{profilesMap[review.user_id]?.full_name || 'N/A'}</td>
                             <td className="p-2">
                               <div className="flex items-center">
                                 {[...Array(5)].map((_, i) => (
                                   <Star
                                     key={i}
                                     className={`w-4 h-4 ${
                                       i < review.rating 
                                         ? 'fill-yellow-400 text-yellow-400' 
                                         : 'text-gray-300'
                                     }`}
                                   />
                                 ))}
                                 <span className="ml-2 font-medium">{review.rating}</span>
                               </div>
                             </td>
                             <td className="p-2">{review.comment}</td>
                             <td className="p-2">{formatDate(review.created_at)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   {/* Pagination */}
                   <div className="flex justify-center gap-2 mt-4">
                     <Button
                       variant="outline"
                       size="sm"
                       disabled={currentPageReviews === 1}
                       onClick={() => setCurrentPageReviews((p) => Math.max(1, p-1))}
                     >
                       Trang trước
                     </Button>
                     <span className="flex items-center px-3">
                       Trang {currentPageReviews} / {Math.ceil(reviews.length/pageSize) || 1}
                     </span>
                     <Button
                       variant="outline"
                       size="sm"
                       disabled={currentPageReviews === Math.ceil(reviews.length/pageSize) || reviews.length === 0}
                       onClick={() => setCurrentPageReviews((p) => Math.min(Math.ceil(reviews.length/pageSize), p+1))}
                     >
                       Trang sau
                     </Button>
                   </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch toàn hệ thống</CardTitle>
                <CardDescription>
                  Tất cả giao dịch nạp tiền và thanh toán của mọi người dùng
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTx ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Tên người dùng</th>
                          <th className="text-left p-2">Thời gian</th>
                          <th className="text-left p-2">Mô tả</th>
                          <th className="text-left p-2">Số tiền</th>
                          <th className="text-left p-2">Phương thức</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-muted-foreground py-8">
                              Không có giao dịch nào
                            </td>
                          </tr>
                        ) : (
                          transactions.slice((currentPageTransactions-1)*pageSize, currentPageTransactions*pageSize).map((tx) => (
                            <tr key={tx.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">{profilesMap[tx.user_id]?.full_name || 'N/A'}</td>
                              <td className="p-2">{formatDate(tx.created_at)}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  {getTransactionIcon ? getTransactionIcon(tx.description) : null}
                                  <span>{tx.description}</span>
                                </div>
                              </td>
                              <td className="p-2 font-medium">{tx.amount.toLocaleString('vi-VN')}đ</td>
                              <td className="p-2">{tx.payment_method || 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPageTransactions === 1}
                        onClick={() => setCurrentPageTransactions((p) => Math.max(1, p-1))}
                      >
                        Trang trước
                      </Button>
                      <span className="flex items-center px-3">
                        Trang {currentPageTransactions} / {Math.ceil(transactions.length/pageSize) || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPageTransactions === Math.ceil(transactions.length/pageSize) || transactions.length === 0}
                        onClick={() => setCurrentPageTransactions((p) => Math.min(Math.ceil(transactions.length/pageSize), p+1))}
                      >
                        Trang sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}