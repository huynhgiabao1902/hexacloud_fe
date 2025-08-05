
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MockTerminal from '@/components/mock-terminal'
import {
  ArrowLeft,
  Server,
  Cloud,
  Link,
  Terminal,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// Interface for Connection Result
interface ConnectionResult {
  success: boolean
  error?: string
  message?: string
  details?: any
  data?: {
    vpsId: string
    name: string
    host: string
    port: number
    username: string
    provider: string
    region: string
    status: string
    admin_verified: boolean
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime_hours: number
    last_connection_test: string
    created_at: string
  }
}

export default function AddVPSPage() {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionMethod, setConnectionMethod] = useState<'manual' | 'gcp-api' | 'csv-import'>('manual')
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null)
  const [showTerminal, setShowTerminal] = useState(false)
  const [userPlan, setUserPlan] = useState<{name: string, isPremium: boolean} | null>(null)

  // State for manual connection form
  const [manualData, setManualData] = useState({
    name: '',
    ip_address: '',
    port: '',
    username: '',
    password: '',
    provider: 'gcp',
    region: '',
    notes: ''
  })

  // Generate random data with password
  const generateRandomData = (includePassword = false) => {
    console.log('🎲 generateRandomData called with includePassword:', includePassword)
    const providers = ['gcp']
    const regions = [
      'us-east-1', 'us-west-1', 'us-central-1', 'eu-west-1', 'eu-central-1',
      'asia-southeast1', 'asia-northeast1', 'australia-southeast1'
    ]
    const usernames = ['root', 'ubuntu', 'admin', 'user', 'deploy']
    // Generate unique server name with random words and numbers
    const adjectives = ['Swift', 'Mighty', 'Silent', 'Golden', 'Crimson', 'Azure', 'Emerald', 'Violet', 'Cosmic', 'Digital', 'Virtual', 'Cloud', 'Stealth', 'Thunder', 'Lightning', 'Frost', 'Blaze', 'Shadow', 'Phoenix', 'Dragon']
    const nouns = ['Server', 'Node', 'Instance', 'Machine', 'Host', 'Compute', 'Engine', 'Core', 'Hub', 'Gateway', 'Bridge', 'Tower', 'Fortress', 'Citadel', 'Station', 'Base', 'Center', 'Zone', 'Realm', 'Domain']
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
    const randomNumber = Math.floor(Math.random() * 999) + 1
    const randomServerName = `${randomAdjective}-${randomNoun}-${randomNumber.toString().padStart(3, '0')}`

    const randomProvider = providers[Math.floor(Math.random() * providers.length)]
    const randomRegion = regions[Math.floor(Math.random() * regions.length)]
    const randomUsername = usernames[Math.floor(Math.random() * usernames.length)]
    
    // Generate random IP address
    const randomIP = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    
    // Generate random port (mostly 22, sometimes others)
    const ports = ['22', '2222', '8080', '5000', '5001', '5002', '5003', '5004', '5005', '5006', '5007', '5008', '5009', '5010', '3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', '3010']
    const randomPort = ports[Math.floor(Math.random() * ports.length)]
    
    // Generate random password if needed
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      let password = ''
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return password
    }
    
    // Generate random notes
    const notesOptions = [
      'Production environment',
      'Development server',
      'Web application hosting',
      'Database server',
      'Load balancer instance',
      'Backup server',
      'Staging environment',
      'Testing server'
    ]
    const randomNotes = notesOptions[Math.floor(Math.random() * notesOptions.length)]

    const randomData = {
      name: randomServerName,
      ip_address: randomIP,
      port: randomPort.toString(),
      username: randomUsername,
      password: includePassword ? generatePassword() : '',
      provider: randomProvider,
      region: randomRegion,
      notes: randomNotes
    }

    console.log('🎯 Final randomData:', randomData)
    setManualData(randomData)
    return randomData
  }

  // Fetch user plan information
  const fetchUserPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUserPlan({ name: 'Free', isPremium: false })
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_plan_id')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        setUserPlan({ name: 'Free', isPremium: false })
        return
      }

      if (profile?.current_plan_id) {
        // Check plan directly from subscription_plans using current_plan_id
        const { data: plan, error: planError } = await supabase
          .from('subscription_plans')
          .select('name, price')
          .eq('id', profile.current_plan_id)
          .single()

        if (planError || !plan) {
          setUserPlan({ name: 'Free', isPremium: false })
          return
        }

        const isPremium = plan.price >= 30000

        setUserPlan({
          name: plan.name,
          isPremium: isPremium
        })
      } else {
        setUserPlan({ name: 'Free', isPremium: false })
      }
    } catch (error) {
      console.error('Error fetching user plan:', error)
      setUserPlan({ name: 'Free', isPremium: false })
    }
  }

  // Validate form before making requests
  const isFormValid = () => {
    // Check for specific required fields
    const validZones = ['us-central1-c', 'asia-southeast1-c']
    const validIPs = ['34.132.99.120', '34.87.183.72']
    const validUsername = 'ngongoccuong46'
    const validPassword = '0'
    
    return (
      manualData.name && 
      validZones.includes(manualData.region) &&
      validIPs.includes(manualData.ip_address) &&
      manualData.username === validUsername &&
      manualData.password === validPassword
    )
  }

  // Fetch user plan on component mount
  useEffect(() => {
    fetchUserPlan().catch(error => {
      console.error('Error in fetchUserPlan:', error)
      // Set default plan if there's an error
      setUserPlan({ name: 'Free', isPremium: false })
    })
  }, [])

  // Handle Test Connection - Check in database
  const handleTestConnection = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields: Server Name, IP Address, Username, and Password.')
      return
    }

    setTestingConnection(true)
    setConnectionResult(null)

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

      console.log('🔍 Checking VPS in database:', manualData.ip_address)

      const response = await fetch('/api/vps/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ip_address: manualData.ip_address,
          username: manualData.username
        })
      })

      const result = await response.json()
      setConnectionResult(result)

      if (response.status === 404) {
        // VPS not found in database
        toast.error('VPS Not Found ❌', {
          description: 'VPS not found in database. Please add it first using "Add to Dashboard" button.'
        })
      } else if (response.ok && result.success) {
        const vpsData = result.data
        toast.success('VPS Found! ✅', {
          description: `${vpsData.name} - Status: ${vpsData.status} - Ready to connect!`
        })
        
        // Show VPS metrics
        console.log('📊 VPS Metrics:', {
          CPU: `${vpsData.cpu_usage}%`,
          Memory: `${vpsData.memory_usage}%`,
          Disk: `${vpsData.disk_usage}%`,
          Uptime: `${vpsData.uptime_hours}h`
        })
      } else {
        toast.error('Check Failed ❌', {
          description: result.error || 'Unable to check VPS in database.'
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Network error - unable to check VPS.'
      setConnectionResult({
        success: false,
        error: errorMessage
      })
      toast.error('Test Failed ❌', {
        description: errorMessage
      })
    } finally {
      setTestingConnection(false)
    }
  }

  // Handle Adding VPS - Using NextJS API
  const handleAddServer = async () => {
    console.log('🚀 handleAddServer called')
    console.log('📝 Current manualData:', manualData)
    setIsConnecting(true)

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

      // Validate form data
      if (!isFormValid()) {
        toast.error('Incorrect values')
        setIsConnecting(false)
        return
      }

      // Generate random data for other fields
      const randomData = generateRandomData(false) // Don't include password since it's fixed
      const serverData = {
        ...randomData,
        name: manualData.name,
        ip_address: manualData.ip_address,
        region: manualData.region,
        username: manualData.username,
        password: manualData.password
      }

      console.log('➕ Adding server:', serverData.name)

      const response = await fetch('/api/vps/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: serverData.name,
          ip_address: serverData.ip_address,
          port: parseInt(serverData.port),
          username: serverData.username,
          password: serverData.password,
          provider: serverData.provider,
          region: serverData.region,
          notes: serverData.notes
        })
      })

      if (!response.ok) {
        // Xử lý HTTP 403 Forbidden (subscription limit)
        if (response.status === 403) {
          const result = await response.json()
          if (result.error && result.error.includes('Free users can only add 1 VPS')) {
            toast.error('Giới hạn gói miễn phí ❌', {
              description: 'Bạn đã đạt giới hạn 1 VPS cho gói miễn phí. Vui lòng nâng cấp lên gói premium để thêm VPS không giới hạn.',
              action: {
                label: 'Nâng cấp ngay',
                onClick: () => router.push('/pricing')
              },
              duration: 8000 // Hiển thị lâu hơn để user đọc
            })
            return
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        toast.success('VPS Added Successfully! 🎉', {
          description: `${serverData.name} has been added to your dashboard.`
        })
        router.push('/dashboard?tab=servers')
      } else {
        // Kiểm tra nếu lỗi liên quan đến subscription
        if (result.error && result.error.includes('Free users can only add 1 VPS')) {
          toast.error('Giới hạn gói miễn phí ❌', {
            description: 'Bạn đã đạt giới hạn 1 VPS cho gói miễn phí. Vui lòng nâng cấp lên gói premium để thêm VPS không giới hạn.',
            action: {
              label: 'Nâng cấp ngay',
              onClick: () => router.push('/pricing')
            },
            duration: 8000 // Hiển thị lâu hơn để user đọc
          })
        } else {
          toast.error('Failed to add VPS ❌', {
            description: result.error || 'Unable to add VPS to the dashboard.'
          })
        }
      }
    } catch (error: any) {
      console.error('Add server error:', error)
      toast.error('Network Error ❌', {
        description: error.message || 'Unable to add VPS to database.'
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add VPS Server</h1>
                <p className="text-sm text-gray-500">Connect your existing VPS to the management dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Backend Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Manual Connection</span>
            </TabsTrigger>
            <TabsTrigger value="gcp-api" className="flex items-center space-x-2" disabled>
              <Cloud className="h-4 w-4" />
              <span>Cloud API (Soon)</span>
            </TabsTrigger>
            <TabsTrigger value="csv-import" className="flex items-center space-x-2" disabled>
              <FileText className="h-4 w-4" />
              <span>CSV Import (Soon)</span>
            </TabsTrigger>
          </TabsList>

          {/* Manual Connection */}
          <TabsContent value="manual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Server className="h-5 w-5" />
                      <span>Server Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Server Name *</Label>
                        <Input
                          id="name"
                          value={manualData.name}
                          onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                          placeholder="My Production Server"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider">Cloud Provider</Label>
                        <Select value={manualData.provider} onValueChange={(v) => setManualData({ ...manualData, provider: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gcp">🔵 Google Cloud Platform</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="ip">IP Address *</Label>
                        <Input
                          id="ip"
                          value={manualData.ip_address}
                          onChange={(e) => setManualData({ ...manualData, ip_address: e.target.value })}
                          placeholder="Enter IP address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">SSH Port</Label>
                        <Input
                          id="port"
                          value={manualData.port}
                          onChange={(e) => setManualData({ ...manualData, port: e.target.value })}
                          placeholder="Enter SSH Port"
                          type="number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          value={manualData.username}
                          onChange={(e) => setManualData({ ...manualData, username: e.target.value })}
                          placeholder="Enter username"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Region/Zone</Label>
                        <Input
                          id="region"
                          value={manualData.region}
                          onChange={(e) => setManualData({ ...manualData, region: e.target.value })}
                          placeholder="Enter zone/region"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Terminal className="h-5 w-5" />
                      <span>SSH Authentication</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={manualData.password}
                        onChange={(e) => setManualData({ ...manualData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Please enter the correct server credentials to proceed
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={manualData.notes}
                        onChange={(e) => setManualData({ ...manualData, notes: e.target.value })}
                        placeholder="Additional notes about this server..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Connection Test and Add Section */}
              <div className="space-y-6">
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>VPS Check & Add</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {connectionResult && (
                      <div
                        className={`p-3 rounded-lg border ${
                          connectionResult.success
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {connectionResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              connectionResult.success ? 'text-green-800' : 'text-red-800'
                            }`}
                          >
                            {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                          </span>
                        </div>
                        {connectionResult.success && connectionResult.data && (
                          <div className="mt-2 space-y-3">
                            <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                              ✅ VPS Found: {connectionResult.data.name}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                <div className="font-bold text-blue-800 flex items-center">
                                  <Cpu className="h-3 w-3 mr-1" />
                                  CPU Usage
                                </div>
                                <div className="text-blue-600 font-semibold text-lg">{connectionResult.data.cpu_usage}%</div>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                                <div className="font-bold text-green-800 flex items-center">
                                  <MemoryStick className="h-3 w-3 mr-1" />
                                  Memory Usage
                                </div>
                                <div className="text-green-600 font-semibold text-lg">{connectionResult.data.memory_usage}%</div>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                                <div className="font-bold text-yellow-800 flex items-center">
                                  <HardDrive className="h-3 w-3 mr-1" />
                                  Disk Usage
                                </div>
                                <div className="text-yellow-600 font-semibold text-lg">{connectionResult.data.disk_usage}%</div>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                                <div className="font-bold text-purple-800 flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  Uptime
                                </div>
                                <div className="text-purple-600 font-semibold text-lg">{connectionResult.data.uptime_hours}h</div>
                              </div>
                            </div>
                            <Button
                              onClick={() => setShowTerminal(true)}
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                              size="sm"
                            >
                              <Terminal className="h-4 w-4 mr-2" />
                              Open Terminal
                            </Button>
                          </div>
                        )}
                        {connectionResult.error && !connectionResult.success && (
                          <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                            {connectionResult.error}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handleTestConnection}
                      disabled={testingConnection || !isFormValid()}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300 text-blue-700 font-semibold"
                    >
                      {testingConnection ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking VPS...
                        </>
                      ) : (
                        <>
                          <Terminal className="h-4 w-4 mr-2" />
                          SSH
                        </>
                      )}
                    </Button>

                    <div className="border-t pt-4">
                      <div className="mb-3 p-2 bg-blue-50 rounded text-blue-700 text-xs">
                        💡 <strong>Required Fields:</strong> Zone, IP, Username, Password must match exact values.
                      </div>
                      <Button
                        onClick={() => {
                          console.log('🔘 Button clicked!')
                          handleAddServer()
                        }}
                        disabled={isConnecting}
                        className="w-full"
                        size="lg"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding Server...
                          </>
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            Add Server
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                      <div className="font-medium text-gray-700 mb-2">🔐 Server Requirements:</div>
                      <p>• Enter specific zone/region</p>
                      <p>• Enter valid IP address</p>
                      <p>• Enter correct username</p>
                      <p>• Enter correct password</p>
                      <p>• Other fields: Auto-generated</p>
                      
                      {/* Warning for free users */}
                      {(!userPlan || !userPlan.isPremium) && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-yellow-800">
                              <div className="font-medium text-sm mb-1">⚠️ Giới hạn gói {userPlan?.name || 'Free'}</div>
                              <div className="text-xs">
                                Gói {userPlan?.name || 'Free'} chỉ cho phép tối đa <strong>1 VPS</strong>. 
                                Nâng cấp lên gói premium để thêm VPS không giới hạn.
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 text-xs h-6 px-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                onClick={() => router.push('/pricing')}
                              >
                                Xem gói premium
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Success message for premium users */}
                      {userPlan && userPlan.isPremium && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-green-800">
                              <div className="font-medium text-sm mb-1">✅ Gói {userPlan.name}</div>
                              <div className="text-xs">
                                Bạn có thể thêm <strong>VPS không giới hạn</strong> với gói premium này.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}


                      
                      <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">NextJS API - Direct Database Storage</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Future features placeholders */}
          <TabsContent value="gcp-api" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <Cloud className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Google Cloud API Integration</h3>
                <p className="text-gray-600 mb-4">
                  Automatically discover and import your GCP instances
                </p>
                <Button disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="csv-import" className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">CSV Bulk Import</h3>
                <p className="text-gray-600 mb-4">
                  Import multiple servers from a CSV file
                </p>
                <Button disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Terminal Modal */}
      {showTerminal && connectionResult?.data && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <MockTerminal
              serverInfo={{
                name: connectionResult.data.name,
                ip_address: connectionResult.data.host,
                port: connectionResult.data.port.toString(),
                username: connectionResult.data.username,
                provider: connectionResult.data.provider,
                region: connectionResult.data.region,
                cpu_usage: connectionResult.data.cpu_usage,
                memory_usage: connectionResult.data.memory_usage,
                disk_usage: connectionResult.data.disk_usage,
                uptime_hours: connectionResult.data.uptime_hours
              }}
              onClose={() => setShowTerminal(false)}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}