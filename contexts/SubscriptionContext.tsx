'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useCurrentSubscription, useSubscriptionPlans, useSubscriptionActions } from '@/hooks/useSubscription';
import type { SubscriptionPlan, SubscriptionWithPlan, CreateSubscriptionRequest, CreateTransactionRequest } from '@/types/subscription';

interface SubscriptionContextType {
  // Current subscription
  subscription: SubscriptionWithPlan | null;
  subscriptionLoading: boolean;
  subscriptionError: string | null;

  // Available plans
  plans: SubscriptionPlan[];
  plansLoading: boolean;
  plansError: string | null;

  // Actions
  createSubscription: (request: CreateSubscriptionRequest) => Promise<any>;
  createTransaction: (request: CreateTransactionRequest) => Promise<any>;
  cancelSubscription: (subscriptionId: string) => Promise<any>;
  actionsLoading: boolean;
  actionsError: string | null;

  // Utility functions
  isSubscribed: boolean;
  canUpgrade: boolean;
  getCurrentPlan: () => SubscriptionPlan | null;
  getAvailableUpgrades: () => SubscriptionPlan[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  userId: string | null;
}

export function SubscriptionProvider({ children, userId }: SubscriptionProviderProps) {
  const { subscription, loading: subscriptionLoading, error: subscriptionError } = useCurrentSubscription(userId);
  const { plans, loading: plansLoading, error: plansError } = useSubscriptionPlans();
  const {
    createSubscription,
    createTransaction,
    cancelSubscription,
    loading: actionsLoading,
    error: actionsError
  } = useSubscriptionActions(userId);

  const isSubscribed = subscription !== null && subscription.status === 'active';
  const canUpgrade = isSubscribed && plans.length > 0;

  const getCurrentPlan = (): SubscriptionPlan | null => {
    if (!subscription) return null;
    return subscription.plan || null;
  };

  const getAvailableUpgrades = (): SubscriptionPlan[] => {
    if (!subscription) return plans;

    const currentPlan = getCurrentPlan();
    if (!currentPlan) return plans;

    return plans.filter(plan =>
      plan.price > currentPlan.price &&
      plan.billing_cycle === currentPlan.billing_cycle
    );
  };

  const value: SubscriptionContextType = {
    subscription,
    subscriptionLoading,
    subscriptionError,

    plans,
    plansLoading,
    plansError,

    createSubscription,
    createTransaction,
    cancelSubscription,
    actionsLoading,
    actionsError,

    isSubscribed,
    canUpgrade,
    getCurrentPlan,
    getAvailableUpgrades
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}