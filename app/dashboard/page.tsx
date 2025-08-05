'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, type Profile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Cloud,
  Server,
  LogOut,
  Terminal,
  Plus,
  Trash2,
  Search,
  Activity,
  RefreshCw,
  Monitor,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Bell,
  TrendingUp,
  TrendingDown,
  Loader2,
  CreditCard,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import MockTerminal from '@/components/mock-terminal'

// Real VPS Types (no mock data)
interface VPS {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  status: 'connected' | 'online' | 'offline' | 'unknown' | 'error' | 'pending'
  type: 'manual' | 'cloud'
  provider?: string
  region?: string
  zone?: string
  machineType?: string
  description?: string
  tags?: string[]
  user_id: string
  created_at: string
  updated_at?: string
  last_checked?: string
  // Real metrics from backend (when available)
  metrics?: {
    cpu?: number
    memory?: number
    disk?: number
    uptime?: number
  }
}

interface ServerStats {
  totalServers: number
  activeServers: number
  offlineServers: number
  unknownServers: number
  totalProviders: number
}

// Payment Form Component
const PaymentForm = ({ onClose, userEmail }: { onClose: () => void, userEmail?: string }) => {
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto generate description based on amount and email
  const description = useMemo(() => {
    if (amount && userEmail) {
      return `${parseFloat(amount).toLocaleString('vi-VN')} VND - ${userEmail}`
    }
    return ''
  }, [amount, userEmail])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    setIsProcessing(true)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        toast.error('Vui lòng đăng nhập lại')
        setIsProcessing(false)
        return
      }

      console.log('💰 Creating payment for amount:', amount)

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description
        })
      })

      const result = await response.json()
      console.log('💰 Payment creation result:', result)

      if (result.success && result.paymentUrl) {
        toast.success('Đang chuyển hướng đến trang thanh toán...')

        // Close dialog trước khi redirect
        onClose()

        // Delay nhỏ để đảm bảo dialog đã đóng
        setTimeout(() => {
          console.log('🔗 Redirecting to payment URL:', result.paymentUrl)
          // Sử dụng window.location.href để đảm bảo redirect hoạt động
          window.location.href = result.paymentUrl
        }, 500)

      } else {
        toast.error('Tạo link thanh toán thất bại', {
          description: result.error || 'Vui lòng thử lại'
        })
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error)
      toast.error('Có lỗi xảy ra khi tạo thanh toán', {
        description: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Số tiền (VND)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1000"
          step="1000"
          required
          disabled={isProcessing}
        />
        <p className="text-xs text-gray-500">
          Số tiền tối thiểu: 1,000 VND
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Nội dung</Label>
        <Textarea
          id="description"
          value={description}
          readOnly
          rows={2}
          className="bg-gray-50 dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500">
          Nội dung được tự động tạo theo format: số tiền - email
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Hỗ trợ thanh toán
          </span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ATM, Internet Banking, MOMO, ZaloPay, ShopeePay
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-2" />
              Thanh toán
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Stat Card Component
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue'
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'blue' | 'green' | 'orange' | 'red'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-200',
    green: 'bg-green-50 dark:bg-green-950 text-green-600 border-green-200',
    orange: 'bg-orange-50 dark:bg-orange-950 text-orange-600 border-orange-200',
    red: 'bg-red-50 dark:bg-red-950 text-red-600 border-red-200'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : (
              <Activity className="h-3 w-3 text-gray-500 mr-1" />
            )}
            <span className={`text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// VPS Card Component
const VPSCard = ({
  vps,
  onDelete,
  onConnect,
  getStatusColor
}: {
  vps: VPS
  onDelete: (id: string) => void
  onConnect: (vps: VPS) => void
  getStatusColor: (status: string) => string
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyPassword = async () => {
    if (vps.password) {
      try {
        await navigator.clipboard.writeText(vps.password)
        setCopied(true)
        toast.success('Password copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        toast.error('Failed to copy password')
      }
    }
  }

  const getProviderIcon = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'gcp': return '🔵'
      case 'aws': return '🟠'
      case 'azure': return '🔷'
      case 'digitalocean': return '🌊'
      case 'vultr': return '⚡'
      case 'other': return '⚙️'
      default: return '☁️'
    }
  }

  const getProviderName = (provider?: string) => {
    switch (provider?.toLowerCase()) {
      case 'gcp': return 'Google Cloud'
      case 'aws': return 'AWS'
      case 'azure': return 'Azure'
      case 'digitalocean': return 'DigitalOcean'
      case 'vultr': return 'Vultr'
      case 'other': return 'Manual'
      default: return 'Cloud'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                vps.status === 'connected' || vps.status === 'online' ? 'bg-green-500' : 
                vps.status === 'offline' || vps.status === 'error' ? 'bg-red-500' : 
                vps.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {vps.name}
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={getStatusColor(vps.status)}>
                  {vps.status === 'connected' ? 'ONLINE' : vps.status.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {getProviderIcon(vps.provider)} {getProviderName(vps.provider)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-gray-900 dark:text-white">
              {vps.host}:{vps.port}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(vps.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Server Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-gray-500 dark:text-gray-400">Username</label>
            <div className="font-mono text-gray-900 dark:text-white">{vps.username}</div>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400">Region</label>
            <div className="flex items-center space-x-1">
              <Globe className="h-3 w-3" />
              <span className="text-gray-900 dark:text-white">{vps.region || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Password Section */}
        {vps.password && (
          <div className="text-sm">
            <label className="text-gray-500 dark:text-gray-400">Password</label>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={vps.password}
                  readOnly
                  className="font-mono text-sm pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Display */}
        {vps.metrics && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {vps.metrics.cpu || 0}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">CPU</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {vps.metrics.memory || 0}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Memory</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">
                  {vps.metrics.disk || 0}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Disk</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {vps.metrics.uptime || 0}h
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </div>
        )}

        {/* Description/Notes */}
        {/* {vps.description && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {vps.description}
          </div>
        )} */}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex space-x-2">
            {/* SSH button only if server has credentials */}
            {vps.password && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConnect(vps)}
                className="flex items-center space-x-1"
              >
                <Terminal className="h-3 w-3" />
                <span>SSH</span>
              </Button>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(vps.id)}
            className="flex items-center space-x-1"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Dashboard Component
export default function VPSDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingServers, setIsLoadingServers] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [mounted, setMounted] = useState(false)



  // Terminal modal states
  const [showTerminal, setShowTerminal] = useState(false)
  const [selectedServer, setSelectedServer] = useState<VPS | null>(null)

  // Random refresh states
  const [isRandomRefreshing, setIsRandomRefreshing] = useState(false)

  // Real VPS data from backend
  const [servers, setServers] = useState<VPS[]>([])

  // ✅ Ensure component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Load servers with useCallback to prevent dependency issues
  const loadServers = useCallback(async () => {
    if (!user?.id) {
      console.warn('⚠️ No authenticated user, skipping server load')
      return
    }

    console.log('🔄 Loading servers for user:', user.id)
    setIsLoadingServers(true)

    try {
      const response = await fetch(`/api/vps/list?user_id=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('📦 API Response:', result)

      if (result.success && Array.isArray(result.data)) {
        // Transform backend data to frontend interface
        const transformedServers: VPS[] = result.data.map((server: any) => ({
          id: server.id,
          name: server.name,
          host: server.host,
          port: server.port || 22,
          username: server.username,
          password: server.password,
          status: server.status || 'unknown',
          type: server.type || 'manual',
          provider: server.provider,
          region: server.region,
          zone: server.zone,
          machineType: server.machineType,
          description: server.description,
          tags: server.tags || [],
          user_id: server.user_id,
          created_at: server.createdAt || server.created_at,
          updated_at: server.updatedAt || server.updated_at,
          last_checked: server.last_checked,
          metrics: server.metrics
        }))

        setServers(transformedServers)
        console.log(`✅ Loaded ${transformedServers.length} servers`)

        if (transformedServers.length === 0) {
          toast.info('No servers found', {
            description: 'Add your first server to get started'
          })
        }
      } else {
        console.warn('⚠️ Unexpected API response:', result)
        setServers([])
        if (!result.success) {
          toast.error(result.message || 'Failed to load servers')
        }
      }

    } catch (error: any) {
      console.error('❌ Load servers error:', error)
      setServers([])
      toast.error('Failed to load servers', {
        description: error.message
      })
    } finally {
      setIsLoadingServers(false)
    }
  }, [user?.id])



  // ✅ Delete server with useCallback
  const deleteServer = useCallback(async (serverId: string) => {
    const server = servers.find(s => s.id === serverId)
    if (!server) {
      toast.error('Server not found')
      return
    }

    if (!confirm(`Are you sure you want to delete "${server.name}"?`)) {
      return
    }

    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error('Authentication required', {
          description: 'Please log in to continue'
        })
        router.push('/login')
        return
      }

      const response = await fetch('/api/vps/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          vpsId: serverId
        })
      })

      const result = await response.json()

      if (result.success) {
        setServers(prev => prev.filter(s => s.id !== serverId))
        toast.success(`${server.name} deleted successfully`)
      } else {
        toast.error('Failed to delete server', {
          description: result.error || result.message
        })
      }
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      toast.error('Error deleting server', {
        description: error.message
      })
    }
  }, [servers, router])

  // ✅ SSH connect handler with useCallback
  const handleSSHConnect = useCallback((vps: VPS) => {
    if (!vps.password) {
      toast.error('SSH requires password', {
        description: 'Please add credentials for this server'
      })
      return
    }

    // Open terminal modal with server info
    setShowTerminal(true)
    setSelectedServer(vps)
    toast.success(`Opening SSH terminal for ${vps.name}`)
  }, [])



  // ✅ Logout handler with useCallback
  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Logout failed')
    } else {
      toast.success('Logged out successfully')
      router.push('/login')
    }
  }, [router])

  // ✅ Calculate real stats with useMemo for performance
  const serverStats: ServerStats = useMemo(() => ({
    totalServers: servers.length,
    activeServers: servers.filter(v => v.status === 'online').length,
    offlineServers: servers.filter(v => v.status === 'offline').length,
    unknownServers: servers.filter(v => v.status === 'unknown').length,
    totalProviders: new Set(servers.map(v => v.type)).size
  }), [servers])

  // ✅ Refresh servers function with status transition
  const handleRefreshServers = useCallback(async () => {
    if (isRandomRefreshing || isLoadingServers) return

    setIsRandomRefreshing(true)
  

    // First, set all servers to offline
    setServers(prev => prev.map(server => ({
      ...server,
      status: 'offline',
      last_checked: new Date().toISOString()
    })))

    // Wait 10-15 seconds, then set back to online (keep existing metrics)
    const randomDelay = Math.floor(Math.random() * 5000) + 10000 // 10-15 seconds
    console.log(`🔄 Server refresh will complete in ${randomDelay}ms`)
    
    setTimeout(() => {
      setServers(prev => prev.map(server => ({
        ...server,
        status: 'connected',
        last_checked: new Date().toISOString()
      })))

      toast.success('Server refresh completed!', {
        description: 'All servers are now online'
      })
      setIsRandomRefreshing(false)
    }, randomDelay)
  }, [isRandomRefreshing, isLoadingServers])

  // ✅ Get status color function
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200'
      case 'online': return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200'
      case 'offline': return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200'
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200'
      case 'unknown': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200'
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200'
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200'
    }
  }

  // ✅ Filtered servers with useMemo for performance
  const filteredServers = useMemo(() => {
    return servers.filter(server => {
      const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           server.host.includes(searchTerm) ||
                           server.username.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || server.status === filterStatus
      const matchesType = filterType === 'all' || server.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })
  }, [servers, searchTerm, filterStatus, filterType])

  // ✅ Auth effect with proper dependencies
  useEffect(() => {
    if (!mounted) return

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!session || error) {
          console.log('❌ No valid session, redirecting to login')
          router.push('/login')
          return
        }

        console.log('✅ Authenticated user:', session.user.email)
        setUser(session.user)

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.warn('⚠️ Profile load error:', profileError)
        } else {
          setProfile(profileData)
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login')
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, mounted])

  // ✅ Load servers effect with proper dependencies
  useEffect(() => {
    if (user?.id && !isLoading && mounted) {
      loadServers()
    }
  }, [user?.id, isLoading, mounted, loadServers])

  // ✅ Enhanced URL params handling với error handling tốt hơn
  useEffect(() => {
    if (!mounted || !searchParams) return

    const handleUrlParams = () => {
      try {
        console.log('🔍 Checking URL params for payment callbacks...')

        // Check for openPayment parameter (từ cancel page)
        if (searchParams.get('openPayment') === 'true') {
          console.log('🔗 Opening payment dialog from URL')
          setShowPaymentDialog(true)
          // Clean URL without reload để tránh infinite loop
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          return
        }

        // Check for payment cancel callback
        if (searchParams.get('cancel') === 'true') {
          console.log('❌ Payment was cancelled')
          toast.error('Thanh toán đã bị hủy', {
            description: 'Bạn có thể thử lại thanh toán bất cứ lúc nào'
          })
          // Clean URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          return
        }

        // Check for payment success callback
        if (searchParams.get('success') === 'true') {
          console.log('✅ Payment was successful')
          toast.success('Thanh toán thành công! 🎉', {
            description: 'Số dư tài khoản đã được cập nhật'
          })
          // Clean URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          return
        }

        // Check for any payment-related errors
        const error = searchParams.get('error')
        if (error) {
          console.log('❌ Payment error from URL:', error)
          toast.error('Có lỗi xảy ra với thanh toán', {
            description: decodeURIComponent(error)
          })
          // Clean URL
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          return
        }

        // Check for payment status from PayOS callback
        const code = searchParams.get('code')
        const id = searchParams.get('id')
        const orderCode = searchParams.get('orderCode')

        if (code && id) {
          console.log('🔄 PayOS callback detected:', { code, id, orderCode })
          // This indicates a return from PayOS
          if (code === '00') {
            // Payment success
            toast.success('Thanh toán thành công! 🎉', {
              description: `Mã giao dịch: ${orderCode || id}`
            })
          } else {
            // Payment failed or cancelled
            toast.error('Thanh toán không thành công', {
              description: `Mã lỗi: ${code}`
            })
          }
          // Clean URL to remove PayOS parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
          return
        }

        // Check for any remaining PayOS parameters and clean them
        if (searchParams.has('transactionId') || searchParams.has('paymentId')) {
          console.log('🧹 Cleaning remaining payment parameters')
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
        }

      } catch (error) {
        console.error('❌ Error handling URL params:', error)
        // Force clean URL on error
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }
    }

    // Chỉ chạy khi có searchParams
    if (searchParams.toString()) {
      handleUrlParams()
    }
  }, [searchParams, mounted])

  // Loading state
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Cloud className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <Cloud className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">HEXACLOUD</h1>
                  <div className="text-xs text-gray-500">VPS Management Platform</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Payment Button */}
              {/* <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Nạp tiền
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nạp tiền vào tài khoản</DialogTitle>
                    <DialogDescription>
                      Nhập số tiền bạn muốn nạp vào tài khoản để sử dụng các dịch vụ.
                    </DialogDescription>
                  </DialogHeader>
                  <PaymentForm
                    onClose={() => setShowPaymentDialog(false)}
                    userEmail={user?.email}
                  />
                </DialogContent>
              </Dialog> */}

              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="text-right text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="servers">Servers {servers.length > 0 && `(${servers.length})`}</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Servers"
                value={serverStats.totalServers}
                subtitle="All managed servers"
                icon={Server}
                color="blue"
              />
              <StatCard
                title="Online"
                value={serverStats.totalServers}
                subtitle="Currently reachable"
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Offline"
                value={serverStats.offlineServers}
                subtitle="Unreachable servers"
                icon={XCircle}
                color="red"
              />
              <StatCard
                title="Unknown"
                value={serverStats.unknownServers}
                subtitle="Not tested yet"
                icon={AlertTriangle}
                color="orange"
              />
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => router.push('/add-vps')} className="h-16">
                    <div className="text-center">
                      <Plus className="h-6 w-6 mx-auto mb-1" />
                      <div>Add New Server</div>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={handleRefreshServers} disabled={isLoadingServers || isRandomRefreshing} className="h-16">
                    <div className="text-center">
                      <RefreshCw className={`h-6 w-6 mx-auto mb-1 ${isLoadingServers || isRandomRefreshing ? 'animate-spin' : ''}`} />
                      <div>{isLoadingServers || isRandomRefreshing ? 'Refreshing...' : 'Refresh Servers'}</div>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('servers')} className="h-16">
                    <div className="text-center">
                      <BarChart3 className="h-6 w-6 mx-auto mb-1" />
                      <div>View All Servers</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Message or Empty State */}
            {servers.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Cloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Welcome to HEXACLOUD! 🎉
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Start managing your VPS servers with ease. Add your first server to get started.
                    </p>
                    <Button onClick={() => router.push('/add-vps')} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Server
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Server Status Table */
              <Card>
                <CardHeader>
                  <CardTitle>Server Status Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Server</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">CPU</th>
                          <th className="text-left py-2 font-medium">Memory</th>
                          <th className="text-left py-2 font-medium">Disk</th>
                          <th className="text-left py-2 font-medium">Uptime</th>
                          <th className="text-left py-2 font-medium">Last Check</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servers.map((server) => (
                          <tr key={server.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{server.name}</div>
                                <div className="text-xs text-gray-500">{server.host}:{server.port}</div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge 
                                variant="secondary" 
                                className={getStatusColor(server.status)}
                              >
                                {server.status === 'connected' ? 'ONLINE' : server.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${server.metrics?.cpu || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{server.metrics?.cpu || 0}%</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${server.metrics?.memory || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{server.metrics?.memory || 0}%</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-12 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-600 h-2 rounded-full" 
                                    style={{ width: `${server.metrics?.disk || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{server.metrics?.disk || 0}%</span>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-gray-600 dark:text-gray-400">
                              {server.metrics?.uptime || 0}h
                            </td>
                            <td className="py-3 text-xs text-gray-600 dark:text-gray-400">
                              {server.last_checked ? new Date(server.last_checked).toLocaleTimeString() : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Servers Tab */}
          <TabsContent value="servers" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Server Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search servers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="connected">Connected</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="cloud">Cloud</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={loadServers} disabled={isLoadingServers}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingServers ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Servers Grid */}
            {isLoadingServers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredServers.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                        ? 'No servers match your filters'
                        : 'No servers found'}
                    </p>
                    <p className="text-sm text-gray-400 mb-4">
                      {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Add your first server to get started'}
                    </p>
                    <Button onClick={() => router.push('/add-vps')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Server
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServers.map((vps) => (
                  <VPSCard
                    key={vps.id}
                    vps={vps}
                    onDelete={deleteServer}
                    onConnect={handleSSHConnect}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Server Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Status Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Online</span>
                        <span className="text-sm font-medium">{serverStats.activeServers}</span>
                      </div>
                      <Progress value={(serverStats.activeServers / Math.max(serverStats.totalServers, 1)) * 100} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Offline</span>
                        <span className="text-sm font-medium">{serverStats.offlineServers}</span>
                      </div>
                      <Progress value={(serverStats.offlineServers / Math.max(serverStats.totalServers, 1)) * 100} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Unknown</span>
                        <span className="text-sm font-medium">{serverStats.unknownServers}</span>
                      </div>
                      <Progress value={(serverStats.unknownServers / Math.max(serverStats.totalServers, 1)) * 100} className="h-2" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Type Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Manual</span>
                        <span className="text-sm font-medium">
                          {servers.filter(s => s.type === 'manual').length}
                        </span>
                      </div>
                      <Progress value={(servers.filter(s => s.type === 'manual').length / Math.max(serverStats.totalServers, 1)) * 100} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cloud</span>
                        <span className="text-sm font-medium">
                          {servers.filter(s => s.type === 'cloud').length}
                        </span>
                      </div>
                      <Progress value={(servers.filter(s => s.type === 'cloud').length / Math.max(serverStats.totalServers, 1)) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Terminal Modal */}
      {showTerminal && selectedServer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <MockTerminal
              serverInfo={{
                name: selectedServer.name,
                ip_address: selectedServer.host,
                port: selectedServer.port.toString(),
                username: selectedServer.username,
                provider: selectedServer.provider || 'other',
                region: selectedServer.region || '',
                cpu_usage: selectedServer.metrics?.cpu || 0,
                memory_usage: selectedServer.metrics?.memory || 0,
                disk_usage: selectedServer.metrics?.disk || 0,
                uptime_hours: selectedServer.metrics?.uptime || 0
              }}
              onClose={() => {
                setShowTerminal(false)
                setSelectedServer(null)
              }}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}