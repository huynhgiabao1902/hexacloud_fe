export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  features: Record<string, any>;
  limits: {
    storage_gb: number;
    cpu_cores: number;
    ram_gb: number;
    max_servers: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  server_id: string | null;
  transaction_id: string | null;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  payment_id: string;
  payment_method: string;
  payment_url: string | null;
  qr_code: string | null;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expired_at: string | null;
}

export interface Server {
  id: string;
  user_id: string;
  subscription_id: string;
  plan_id: string;
  name: string;
  status: 'creating' | 'active' | 'stopped' | 'terminated';
  gcp_instance_id: string | null;
  gcp_zone: string;
  gcp_machine_type: string;
  external_ip: string | null;
  internal_ip: string | null;
  ssh_port: number | null;
  ssh_username: string | null;
  storage_gb: number;
  cpu_cores: number;
  ram_gb: number;
  created_at: string;
  activated_at: string | null;
  stopped_at: string | null;
  terminated_at: string | null;
  last_health_check: string | null;
  metrics_data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  company: string | null;
  avatar_url: string | null;
  wallet_balance: number;
  current_plan_id: string | null;
  total_spent: number;
  email_notifications: boolean;
  sms_notifications: boolean;
  security_notifications: boolean;
  marketing_notifications: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Response types
export interface SubscriptionWithPlan extends UserSubscription {
  plan: SubscriptionPlan;
}

export interface ServerWithSubscription extends Server {
  subscription: UserSubscription;
}

// Request types
export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method: string;
  auto_renew?: boolean;
}

export interface CreateTransactionRequest {
  amount: number;
  description: string;
  payment_method: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  auto_renew?: boolean;
  metadata?: Record<string, any>;
}