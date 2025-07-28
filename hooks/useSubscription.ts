'use client';

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionService } from '@/lib/supabase/subscription';
import type {
  SubscriptionPlan,
  SubscriptionWithPlan,
  Transaction,
  Server,
  CreateSubscriptionRequest,
  CreateTransactionRequest
} from '@/types/subscription';

// Hook for subscription plans
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        const data = await SubscriptionService.getPlans();
        setPlans(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  return { plans, loading, error };
}

// Hook for current user subscription
export function useCurrentSubscription(userId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await SubscriptionService.getCurrentSubscription(userId);
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
}

// Hook for user transactions
export function useUserTransactions(userId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    async function fetchTransactions() {
      try {
        setLoading(true);
        const data = await SubscriptionService.getUserTransactions(userId);
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [userId]);

  return { transactions, loading, error };
}

// Hook for user servers
export function useUserServers(userId: string | null) {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setServers([]);
      setLoading(false);
      return;
    }

    async function fetchServers() {
      try {
        setLoading(true);
        const data = await SubscriptionService.getUserServers(userId);
        setServers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch servers');
      } finally {
        setLoading(false);
      }
    }

    fetchServers();
  }, [userId]);

  return { servers, loading, error };
}

// Hook for subscription actions
export function useSubscriptionActions(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async (request: CreateSubscriptionRequest) => {
    if (!userId) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const subscription = await SubscriptionService.createSubscription(userId, request);
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (request: CreateTransactionRequest) => {
    if (!userId) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const transaction = await SubscriptionService.createTransaction(userId, request);
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await SubscriptionService.cancelSubscription(subscriptionId);
      return subscription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createSubscription,
    createTransaction,
    cancelSubscription,
    loading,
    error
  };
}

// Hook to check if user has active subscription
export function useHasActiveSubscription(userId: string | null) {
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasActive(false);
      setLoading(false);
      return;
    }

    async function checkActiveSubscription() {
      try {
        setLoading(true);
        const active = await SubscriptionService.hasActiveSubscription(userId);
        setHasActive(active);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check subscription status');
      } finally {
        setLoading(false);
      }
    }

    checkActiveSubscription();
  }, [userId]);

  return { hasActive, loading, error };
}