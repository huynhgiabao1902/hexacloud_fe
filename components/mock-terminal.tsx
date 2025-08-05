'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Terminal as TerminalIcon,
  X,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Loader2,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'

interface MockTerminalProps {
  serverInfo: {
    name: string
    ip_address: string
    port: string
    username: string
    provider: string
    region: string
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime_hours: number
  }
  onClose?: () => void
  className?: string
}

export default function MockTerminal({
  serverInfo,
  onClose,
  className = ''
}: MockTerminalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [isConnected, setIsConnected] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Focus input when connected
  useEffect(() => {
    if (isConnected && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isConnected])

  // Generate fake system info based on provider
  const getSystemInfo = () => {
    const providers = {
      gcp: {
        os: 'Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-1047-gcp',
        arch: 'x86_64',
        hostname: 'gcp-instance-1',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.20GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      },
      aws: {
        os: 'Amazon Linux 2023',
        kernel: '5.15.0-1047.aws',
        arch: 'x86_64',
        hostname: 'aws-ec2-instance',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.50GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      },
      azure: {
        os: 'Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-1047-azure',
        arch: 'x86_64',
        hostname: 'azure-vm-1',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.40GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      },
      digitalocean: {
        os: 'Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-1047-generic',
        arch: 'x86_64',
        hostname: 'droplet-1',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.20GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      },
      vultr: {
        os: 'Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-1047-generic',
        arch: 'x86_64',
        hostname: 'vultr-instance',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.20GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      },
      other: {
        os: 'Ubuntu 22.04.3 LTS',
        kernel: '5.15.0-1047-generic',
        arch: 'x86_64',
        hostname: 'server-1',
        cpu: 'Intel(R) Xeon(R) CPU @ 2.20GHz',
        cores: '2 cores',
        memory: '4GB RAM',
        disk: '20GB SSD'
      }
    }
    return providers[serverInfo.provider as keyof typeof providers] || providers.other
  }

  // Start mock connection
  const startMockConnection = useCallback(() => {
    console.log('🎮 Mock Terminal: Starting connection...')

    const systemInfo = getSystemInfo()
    const currentTime = new Date().toLocaleString()
    const hostname = systemInfo.hostname

    const connectionMessages = [
      '╔══════════════════════════════════════════════════════════════╗',
      '║                    HEXACLOUD SSH TERMINAL                    ║',
      '╚══════════════════════════════════════════════════════════════╝',
      '',
      `🔌 Connecting to ${serverInfo.ip_address}:${serverInfo.port}...`,
      '✅ SSH connection established successfully!',
      '',
      `Welcome to ${serverInfo.name} - ${serverInfo.provider.toUpperCase()} Server`,
      `Last login: ${currentTime} from ${serverInfo.ip_address}`,
      '',
      `📊 Current System Metrics:`,
      `  CPU Usage: ${serverInfo.cpu_usage}%`,
      `  Memory Usage: ${serverInfo.memory_usage}%`,
      `  Disk Usage: ${serverInfo.disk_usage}%`,
      `  Uptime: ${serverInfo.uptime_hours} hours`,
      '',
      `System Information:`,
      `  OS: ${systemInfo.os}`,
      `  Kernel: ${systemInfo.kernel} ${systemInfo.arch}`,
      `  Hostname: ${hostname}`,
      `  CPU: ${systemInfo.cpu} (${systemInfo.cores})`,
      `  Memory: ${systemInfo.memory}`,
      `  Disk: ${systemInfo.disk}`,
      `  Provider: ${serverInfo.provider.toUpperCase()}`,
      `  Region: ${serverInfo.region || 'Unknown'}`,
      '',
      '🚀 Available commands:',
      '• ls, ls -la        - list directory contents',
      '• pwd               - print working directory',
      '• whoami            - print current user',
      '• clear             - clear screen',
      '• date              - current date and time',
      '• uname -a          - system information',
      '• htop              - system monitor (simulated)',
      '• ps aux            - list running processes',
      '• df -h             - disk space usage',
      '• free -m           - memory usage',
      '• cat /etc/os-release - OS information',
      '• mkdir [dir]       - create directory',
      '• touch [file]      - create file',
      '• echo [text]       - print text',
      '• history           - command history',
      '• exit              - close terminal',
      '',
      `${serverInfo.username}@${hostname}:~$ `
    ]

    setOutput(connectionMessages)
    setIsConnected(true)
    setIsConnecting(false)
    setConnectionStatus('connected')

    toast.success(`Terminal Connected - ${serverInfo.name}`, {
      description: `${serverInfo.provider.toUpperCase()} Server (Interactive Mode)`
    })
  }, [serverInfo])

  // Initialize terminal
  useEffect(() => {
    console.log('🚀 Mock Terminal: Initializing connection...')

    setConnectionStatus('connecting')
    setIsConnecting(true)

    // Start mock connection after short delay
    const initTimer = setTimeout(() => {
      startMockConnection()
    }, 1500)

    return () => {
      clearTimeout(initTimer)
    }
  }, [startMockConnection])

  // Handle command input
  const handleCommand = useCallback((command: string) => {
    if (!command.trim()) return

    // Add to command history
    const newHistory = [...commandHistory, command]
    setCommandHistory(newHistory)
    setHistoryIndex(-1)

    const systemInfo = getSystemInfo()
    const hostname = systemInfo.hostname
    const currentTime = new Date().toLocaleString()

    const newOutput = [...output]
    newOutput.push(`${serverInfo.username}@${hostname}:~$ ${command}`)

    // Mock command responses
    const cmd = command.trim().toLowerCase()
    const args = cmd.split(' ')

    switch (args[0]) {
      case 'ls':
        if (args.includes('-la')) {
          newOutput.push('total 40')
          newOutput.push('drwxr-xr-x  4 root root 4096 Dec 15 10:30 .')
          newOutput.push('drwxr-xr-x  3 root root 4096 Dec 15 10:30 ..')
          newOutput.push('-rw-r--r--  1 root root  220 Dec 15 10:30 .bash_logout')
          newOutput.push('-rw-r--r--  1 root root 3771 Dec 15 10:30 .bashrc')
          newOutput.push('-rw-r--r--  1 root root  807 Dec 15 10:30 .profile')
          newOutput.push('drwxr-xr-x  2 root root 4096 Dec 15 10:30 .ssh')
          newOutput.push('-rw-r--r--  1 root root    0 Dec 15 10:30 test.txt')
        } else {
          newOutput.push('.bash_logout  .bashrc  .profile  .ssh  test.txt')
        }
        break

      case 'pwd':
        newOutput.push('/root')
        break

      case 'whoami':
        newOutput.push(serverInfo.username)
        break

      case 'clear':
        setOutput([])
        return

      case 'date':
        newOutput.push(currentTime)
        break

      case 'uname':
        if (args.includes('-a')) {
          newOutput.push(`${systemInfo.hostname} ${systemInfo.kernel} ${systemInfo.arch} GNU/Linux`)
        } else {
          newOutput.push('Linux')
        }
        break

      case 'htop':
        newOutput.push('🎮 Simulated htop output:')
        newOutput.push('  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND')
        newOutput.push('  1234 root      20   0  123456  12345  1234 S   2.5   0.3   0:01.23 systemd')
        newOutput.push('  1235 root      20   0  234567  23456  2345 S   1.2   0.6   0:00.45 sshd')
        newOutput.push('  1236 root      20   0  345678  34567  3456 S   0.8   0.9   0:00.23 bash')
        newOutput.push('  1237 root      20   0  456789  45678  4567 S   0.3   1.2   0:00.12 htop')
        break

      case 'ps':
        if (args.includes('aux')) {
          newOutput.push('  PID TTY      STAT   TIME COMMAND')
          newOutput.push('    1 ?        Ss     0:01 /sbin/init')
          newOutput.push('  123 ?        Ss     0:00 /lib/systemd/systemd-journald')
          newOutput.push('  456 ?        Ss     0:00 /lib/systemd/systemd-udevd')
          newOutput.push('  789 ?        Ss     0:00 /usr/sbin/sshd -D')
          newOutput.push(' 1234 pts/0    Ss     0:00 -bash')
          newOutput.push(' 1235 pts/0    R+     0:00 ps aux')
        }
        break

      case 'df':
        if (args.includes('-h')) {
          newOutput.push('Filesystem      Size  Used Avail Use% Mounted on')
          newOutput.push('/dev/sda1        20G  2.1G   17G  11% /')
          newOutput.push('tmpfs           2.0G     0  2.0G   0% /dev/shm')
          newOutput.push('tmpfs           2.0G  8.6M  2.0G   1% /run')
          newOutput.push('tmpfs           2.0G     0  2.0G   0% /sys/fs/cgroup')
        }
        break

      case 'free':
        if (args.includes('-m')) {
          newOutput.push('              total        used        free      shared  buff/cache   available')
          newOutput.push('Mem:           4096         512        3072         128         511        3456')
          newOutput.push('Swap:             0           0           0')
        }
        break

      case 'cat':
        if (args[1] === '/etc/os-release') {
          newOutput.push('NAME="Ubuntu"')
          newOutput.push('VERSION="22.04.3 LTS (Jammy Jellyfish)"')
          newOutput.push('ID=ubuntu')
          newOutput.push('ID_LIKE=debian')
          newOutput.push('PRETTY_NAME="Ubuntu 22.04.3 LTS"')
          newOutput.push('VERSION_ID="22.04"')
          newOutput.push('HOME_URL="https://www.ubuntu.com/"')
          newOutput.push('SUPPORT_URL="https://help.ubuntu.com/"')
          newOutput.push('BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"')
          newOutput.push('PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"')
          newOutput.push('VERSION_CODENAME=jammy')
          newOutput.push('UBUNTU_CODENAME=jammy')
        } else if (args[1]) {
          newOutput.push(`cat: ${args[1]}: No such file or directory`)
        }
        break

      case 'mkdir':
        if (args[1]) {
          newOutput.push(`✅ Directory '${args[1]}' created successfully`)
        } else {
          newOutput.push('mkdir: missing operand')
          newOutput.push("Try 'mkdir --help' for more information.")
        }
        break

      case 'touch':
        if (args[1]) {
          newOutput.push(`✅ File '${args[1]}' created successfully`)
        } else {
          newOutput.push('touch: missing file operand')
          newOutput.push("Try 'touch --help' for more information.")
        }
        break

      case 'echo':
        const text = args.slice(1).join(' ')
        newOutput.push(text || '')
        break

      case 'history':
        commandHistory.forEach((cmd, index) => {
          newOutput.push(`${(index + 1).toString().padStart(4)} ${cmd}`)
        })
        break

      case 'exit':
        newOutput.push('Logout')
        newOutput.push(`Connection to ${serverInfo.ip_address} closed.`)
        newOutput.push('')
        setIsConnected(false)
        setConnectionStatus('disconnected')
        if (onClose) {
          setTimeout(onClose, 1500)
        }
        return

      default:
        if (cmd.startsWith('cd ')) {
          const dir = args[1] || '~'
          newOutput.push(`Changed to ${dir === '~' ? '/root' : dir}`)
        } else {
          newOutput.push(`bash: ${args[0]}: command not found`)
        }
        break
    }

    newOutput.push(`${serverInfo.username}@${hostname}:~$ `)
    setOutput(newOutput)
    setInput('')
  }, [output, commandHistory, serverInfo, onClose])

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setInput(commandHistory[newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1)
          setInput('')
        } else {
          setHistoryIndex(newIndex)
          setInput(commandHistory[newIndex])
        }
      }
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="h-3 w-3" />
      case 'connecting': return <Loader2 className="h-3 w-3 animate-spin" />
      case 'error': return <WifiOff className="h-3 w-3" />
      default: return <WifiOff className="h-3 w-3" />
    }
  }

  return (
    <Card className={`${className} ${isMaximized ? 'fixed inset-4 z-50' : ''} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-2xl`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TerminalIcon className="h-5 w-5 text-green-400" />
              <CardTitle className="text-sm text-white font-bold">{serverInfo.name}</CardTitle>
            </div>
            <Badge variant="secondary" className={`text-xs ${getStatusColor()} text-white font-semibold`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="capitalize">{connectionStatus}</span>
              </div>
            </Badge>
            {connectionStatus === 'connected' && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-400 bg-green-900/20">
                {serverInfo.username}@{serverInfo.ip_address}
              </Badge>
            )}
            <div className="flex items-center space-x-1 text-xs text-gray-300">
              <Server className="h-3 w-3" />
              <span className="font-medium">{serverInfo.provider.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-300 hover:text-white hover:bg-gray-700/50"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-300 hover:text-red-400 hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div
          className={`${isMaximized ? 'h-[calc(100vh-8rem)]' : 'h-96'} bg-black rounded-lg p-4 font-mono text-sm overflow-hidden flex flex-col border border-gray-700 shadow-inner`}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Terminal Output */}
          <div
            ref={outputRef}
            className="flex-1 overflow-y-auto text-green-400 space-y-1 mb-2 pr-2"
            style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
          >
            {output.map((line, index) => (
              <div
                key={index}
                className={
                  line.includes(`${serverInfo.username}@`) ? 'text-blue-400 font-bold' :
                  line.includes('ERROR') || line.includes('❌') || line.includes('bash:') ? 'text-red-400' :
                  line.includes('✅') || line.includes('SUCCESS') || line.includes('created') ? 'text-yellow-400' :
                  line.includes('🎮') || line.includes('Demo') ? 'text-cyan-400' :
                  line.includes('╔') || line.includes('║') || line.includes('╚') ? 'text-cyan-400' :
                  line.includes('System Information:') || line.includes('Available commands:') || line.includes('Current System Metrics:') ? 'text-cyan-400' :
                  line.includes('OS:') || line.includes('Kernel:') || line.includes('Hostname:') || 
                  line.includes('CPU:') || line.includes('Memory:') || line.includes('Disk:') || 
                  line.includes('Provider:') || line.includes('Region:') || line.includes('Usage:') || line.includes('Uptime:') ? 'text-yellow-400' :
                  'text-green-400'
                }
              >
                {line}
              </div>
            ))}
          </div>

          {/* Input Line */}
          {isConnected && (
            <div className="flex items-center bg-gray-900 rounded px-2 py-1 border border-gray-600">
              <span className="text-blue-400 mr-2 whitespace-nowrap font-bold">
                {serverInfo.username}@{getSystemInfo().hostname}:~$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="bg-transparent text-green-400 border-none outline-none flex-1 font-mono"
                style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
                placeholder="Enter command..."
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}

          {/* Connecting State */}
          {isConnecting && !isConnected && (
            <div className="flex items-center justify-center text-yellow-400 py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
              <span className="text-lg">Connecting to {serverInfo.ip_address}:{serverInfo.port}...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 