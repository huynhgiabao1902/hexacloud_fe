// app/wallet/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, Wallet, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Transaction {
  id: string
  amount: number
  description: string
  status: string
  payment_method: string
  created_at: string
  completed_at: string | null
}

interface WalletData {
  balance: number
  totalSpent: number
  currentPlan: any
  activeSubscription: any
}

export default function WalletPage() {
  const router = useRouter()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTx, setLoadingTx] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPlanName, setCurrentPlanName] = useState<string>('')
  const [currentPlanDetail, setCurrentPlanDetail] = useState<any>(null)
  const [hasCurrentPlan, setHasCurrentPlan] = useState<boolean>(false)
  const [expanded, setExpanded] = useState(false)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session:', session)
    if (!session) {
      toast.error('Vui lòng đăng nhập')
      router.push('/login')
      return
    }

    setSessionUser(session.user)
    fetchWalletData(session.access_token, session.user)
    fetchTransactions(session.access_token)

    // Lấy current_plan_id từ bảng profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_plan_id')
      .eq('id', session.user.id)
      .single()
    const currentPlanId = profile?.current_plan_id
    console.log('Current Plan ID:', currentPlanId)
    if (currentPlanId) {
      fetchCurrentPlan(currentPlanId, session.access_token)
    }
  }

  // Thêm state để lưu session user
  const [sessionUser, setSessionUser] = useState<any>(null)

  // Sửa fetchWalletData để nhận thêm user
  const fetchWalletData = async (token: string, user: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      console.log('Wallet data:', response)

      if (!response.ok) {
        console.error('Wallet fetch failed:', response.status, response.statusText)
        throw new Error('Failed to fetch wallet data')
      }

      const result = await response.json()
      console.log('Wallet data:', result)

      // Nếu thiếu trường, lấy từ session user hoặc gán mặc định
      if (result.success) {
        setWalletData({
          balance: result.data.balance ?? 0,
          totalSpent: result.data.totalSpent ?? 0,
          currentPlan: result.data.currentPlan ?? null,
          activeSubscription: result.data.activeSubscription ?? {
            subscription_plans: {
              display_name: user?.user_metadata?.full_name ? `Gói của ${user.user_metadata.full_name}` : 'Chưa có'
            }
          }
        })
      }

      // Fetch total spent (mua gói)
      const { data: spentData, error: spentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'subscription_purchase')
      if (!spentError && spentData) {
        const total = spentData.reduce((sum, tx) => sum + (tx.amount || 0), 0)
        setTotalSpent(total)
      } else {
        setTotalSpent(0)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
      toast.error('Không thể tải thông tin ví')
      // Nếu lỗi, vẫn fill thông tin cơ bản từ session user
      setWalletData({
        balance: 0,
        totalSpent: 0,
        currentPlan: null,
        activeSubscription: {
          subscription_plans: {
            display_name: sessionUser?.user_metadata?.full_name ? `Gói của ${sessionUser.user_metadata.full_name}` : 'Chưa có'
          }
        }
      })
      setTotalSpent(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (token: string, page = 1) => {
    try {
      setLoadingTx(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/wallet/history?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        console.error('Transaction fetch failed:', response.status, response.statusText)
        throw new Error('Failed to fetch transactions')
      }

      const result = await response.json()
      console.log('Transaction data:', result)

      if (result.success) {
        setTransactions(result.data.transactions || [])
        setTotalPages(result.data.pagination?.totalPages || 1)
        setCurrentPage(result.data.pagination?.page || 1)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Không thể tải lịch sử giao dịch')
    } finally {
      setLoadingTx(false)
    }
  }

  // Hàm lấy thông tin gói hiện tại
  const fetchCurrentPlan = async (planId: string, token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscription/detail?planId=${planId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.display_name) {
          setCurrentPlanDetail(result.data)
          setHasCurrentPlan(true)
        } else {
          setCurrentPlanDetail(null)
          setHasCurrentPlan(false)
        }
      }
    } catch (error) {
      console.error('Error fetching current plan:', error)
      setCurrentPlanDetail(null)
      setHasCurrentPlan(false)
    }
  }

  const handleDeposit = () => {
    router.push('/wallet/deposit')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Đang xử lý' },
      completed: { variant: 'success', label: 'Thành công' },
      failed: { variant: 'destructive', label: 'Thất bại' },
      cancelled: { variant: 'outline', label: 'Đã hủy' },
      expired: { variant: 'outline', label: 'Hết hạn' }
    }

    const config = statusMap[status] || { variant: 'outline', label: status }

    return (
      <Badge variant={config.variant as any}>
        {config.label}
      </Badge>
    )
  }

  const getTransactionIcon = (description: string) => {
    if (description.toLowerCase().includes('nạp tiền')) {
      return <ArrowDownRight className="h-4 w-4 text-green-500" />
    }
    if (description.toLowerCase().includes('mua gói')) {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />
    }
    return <Clock className="h-4 w-4 text-gray-500" />
  }

  // Lấy danh sách trạng thái thực tế từ transactions
  const transactionStatuses = Array.from(new Set(transactions.map(tx => tx.status)));
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Ví của tôi</h1>

        {/* Wallet Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(walletData?.balance || 0).toLocaleString('vi-VN')}đ
              </div>
              <Button
                className="mt-4 w-full"
                onClick={handleDeposit}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nạp tiền
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSpent.toLocaleString('vi-VN')}đ
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Tổng tiền đã dùng để mua gói
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gói hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCurrentPlan && currentPlanDetail ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{currentPlanDetail.display_name}</div>
                      <div className="text-base font-semibold text-muted-foreground">{currentPlanDetail.price.toLocaleString('vi-VN')}đ/tháng</div>
                    </div>
                    <button
                      className="text-xs underline ml-2"
                      onClick={() => setExpanded((v) => !v)}
                      aria-label={expanded ? 'Thu gọn' : 'Xem chi tiết'}
                    >
                      {expanded ? 'Thu gọn' : 'Xem chi tiết'}
                    </button>
                  </div>
                  {expanded && (
                    <div className="pt-2 space-y-1">
                      {currentPlanDetail.features?.vps && (
                        <div>VPS: <span className="font-medium">{currentPlanDetail.features.vps}</span></div>
                      )}
                      {currentPlanDetail.features?.description && (
                        <div>Mô tả: <span className="font-medium">{currentPlanDetail.features.description}</span></div>
                      )}
                    
                    </div>
                  )}
                </div>
              ) : (
                <Button className="w-full" onClick={() => router.push('/pricing')}>Nâng cấp gói</Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>
              Tất cả giao dịch nạp tiền và thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Phương thức</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Không có giao dịch nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {formatDate(tx.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.description)}
                            <span>{tx.description}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.amount.toLocaleString('vi-VN')}đ
                        </TableCell>
                        <TableCell>{tx.payment_method || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                      fetchTransactions(session.access_token, currentPage - 1)
                    }
                  }}
                >
                  Trang trước
                </Button>
                <span className="flex items-center px-3">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={async () => {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                      fetchTransactions(session.access_token, currentPage + 1)
                    }
                  }}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}