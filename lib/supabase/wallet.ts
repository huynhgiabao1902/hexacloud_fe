
import { supabase } from './client';

export interface WalletData {
  balance: number;
  totalSpent: number;
  currentPlan: any;
  activeSubscription: any;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  status: string;
  payment_method: string;
  created_at: string;
  completed_at: string | null;
}

export class WalletService {
  /**
   * Get user's wallet data from backend API
   */
  static async getWalletData(userId: string): Promise<WalletData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch wallet data');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to get wallet data');
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Return default data if API fails
      return {
        balance: 0,
        totalSpent: 0,
        currentPlan: null,
        activeSubscription: null
      };
    }
  }

  /**
   * Get balance only (for quick checks)
   */
  static async getBalance(userId: string): Promise<number> {
    try {
      const walletData = await this.getWalletData(userId);
      return walletData.balance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  /**
   * Get wallet transactions from backend API
   */
  static async getTransactions(userId: string, page = 1, limit = 10): Promise<{
    transactions: WalletTransaction[];
    pagination: {
      page: number;
      totalPages: number;
      total: number;
    };
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/history?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to get transactions');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        transactions: [],
        pagination: {
          page: 1,
          totalPages: 1,
          total: 0
        }
      };
    }
  }

  /**
   * Process payment (deduct from wallet)
   */
  static async processPayment(
    userId: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          description
        })
      });

      if (!response.ok) throw new Error('Payment failed');

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Create deposit transaction
   */
  static async createDeposit(
    userId: string,
    amount: number,
    description: string
  ): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          description
        })
      });

      if (!response.ok) throw new Error('Failed to create deposit');

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  /**
   * Cancel pending transaction
   */
  static async cancelTransaction(transactionId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/wallet/cancel-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          transactionId,
          status: 'cancelled'
        })
      });

      if (!response.ok) throw new Error('Failed to cancel transaction');

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      throw error;
    }
  }
}