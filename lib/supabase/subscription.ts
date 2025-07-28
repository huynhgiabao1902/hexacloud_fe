import { supabase } from './client';
import type {
  SubscriptionPlan,
  UserSubscription,
  Transaction,
  Server,
  SubscriptionWithPlan,
  CreateSubscriptionRequest,
  CreateTransactionRequest,
  UpdateSubscriptionRequest
} from '@/types/subscription';

export class SubscriptionService {

  // ==================== SUBSCRIPTION PLANS ====================

  /**
   * Get all active subscription plans
   */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific plan by ID
   */
  static async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  // ==================== USER SUBSCRIPTIONS ====================

  /**
   * Get user's current subscription with plan details
   */
  static async getCurrentSubscription(userId: string | null): Promise<SubscriptionWithPlan | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Get all user's subscriptions with plan details
   */
  static async getUserSubscriptions(userId: string | null): Promise<SubscriptionWithPlan[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(
    userId: string,
    request: CreateSubscriptionRequest
  ): Promise<UserSubscription> {
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: request.plan_id,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
        auto_renew: request.auto_renew ?? true,
        metadata: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        auto_renew: request.auto_renew,
        metadata: request.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<UserSubscription> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Create a new transaction
   */
  static async createTransaction(
    userId: string,
    request: CreateTransactionRequest
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: request.amount,
        description: request.description,
        payment_method: request.payment_method,
        payment_id: '', // Will be updated after payment processing
        payment_url: null,
        qr_code: null,
        status: 'pending',
        metadata: request.metadata || {},
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's transactions
   */
  static async getUserTransactions(userId: string | null): Promise<Transaction[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(
    transactionId: string,
    status: Transaction['status'],
    paymentId?: string
  ): Promise<Transaction> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (paymentId) {
      updateData.payment_id = paymentId;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== SERVERS ====================

  /**
   * Get user's servers
   */
  static async getUserServers(userId: string | null): Promise<Server[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get server by subscription ID
   */
  static async getServerBySubscription(subscriptionId: string): Promise<Server | null> {
    const { data, error } = await supabase
      .from('servers')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string | null): Promise<boolean> {
    if (!userId) return false;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * Get subscription usage stats
   */
  static async getSubscriptionUsage(subscriptionId: string) {
    // This will be implemented when we have usage tracking
    return {
      storage_used: 0,
      cpu_usage: 0,
      ram_usage: 0,
      bandwidth_used: 0
    };
  }
}