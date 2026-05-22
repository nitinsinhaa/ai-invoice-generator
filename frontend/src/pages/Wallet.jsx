import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, Minus, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import Header from '../components/Header';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import { walletApi } from '../api/walletApi';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { currency } = useApp();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [bankForm, setBankForm] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    routing_number: '',
    account_type: 'checking',
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes, bankRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions({ limit: 50 }),
        walletApi.getBankAccounts(),
      ]);

      const walletData = walletRes.data.data || walletRes.data;
      const txData = txRes.data.data || txRes.data;
      const bankData = bankRes.data.data || bankRes.data;

      setWallet(walletData);
      setTransactions(Array.isArray(txData) ? txData : []);
      setBankAccounts(Array.isArray(bankData) ? bankData : []);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      toast.error('Failed to load wallet data');
      setWallet({ balance: 0, currency: currency || 'INR' });
      setTransactions([]);
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    try {
      await walletApi.addFunds({ amount: parseFloat(amount), description });
      toast.success('Funds added successfully!');
      setShowAddFunds(false);
      setAmount('');
      setDescription('');
      fetchWalletData();
    } catch {
      toast.error('Failed to add funds');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    try {
      await walletApi.withdrawFunds({ amount: parseFloat(amount), description });
      toast.success('Withdrawal successful!');
      setShowWithdraw(false);
      setAmount('');
      setDescription('');
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to withdraw funds');
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    try {
      await walletApi.addBankAccount(bankForm);
      toast.success('Bank account added!');
      setShowAddBank(false);
      setBankForm({
        account_name: '',
        account_number: '',
        bank_name: '',
        routing_number: '',
        account_type: 'checking',
      });
      fetchWalletData();
    } catch {
      toast.error('Failed to add bank account');
    }
  };

  const totalDeposits = transactions
    .filter((t) => t.transaction_type === 'deposit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawals = transactions
    .filter((t) => t.transaction_type === 'withdrawal')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  if (loading) return <LoadingSpinner />;

  const displayCurrency = wallet?.currency || currency || 'INR';

  return (
    <div>
      <Header title="My Wallet" />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted mb-1">Current Balance</p>
                <h2 className="text-4xl font-bold text-heading">
                  {formatCurrency(wallet?.balance ?? 0, displayCurrency)}
                </h2>
              </div>
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                <WalletIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddFunds(true)}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                <Plus className="w-4 h-4" />
                Add Funds
              </button>
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="btn-secondary flex items-center gap-2 flex-1"
              >
                <Minus className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-heading mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="wallet-stat-deposit">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-heading">Total Deposits</span>
                </div>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(totalDeposits, displayCurrency)}
                </span>
              </div>
              <div className="wallet-stat-withdraw">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-heading">Total Withdrawals</span>
                </div>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(totalWithdrawals, displayCurrency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-heading mb-4">Recent Transactions</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="wallet-txn-item">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          transaction.transaction_type === 'deposit'
                            ? 'bg-green-100 dark:bg-green-900/50'
                            : 'bg-red-100 dark:bg-red-900/50'
                        }`}
                      >
                        {transaction.transaction_type === 'deposit' ? (
                          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-heading">{transaction.description}</p>
                        <p className="text-xs text-muted">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.transaction_type === 'deposit'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.transaction_type === 'deposit' ? '+' : '-'}
                        {formatCurrency(transaction.amount, displayCurrency)}
                      </p>
                      <p className="text-xs text-muted">
                        Balance: {formatCurrency(transaction.balance_after, displayCurrency)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-8">No transactions yet</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-heading">Bank Accounts</h3>
              <button
                type="button"
                onClick={() => setShowAddBank(true)}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </button>
            </div>
            <div className="space-y-3">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((account) => (
                  <div key={account.id} className="wallet-bank-item">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-heading">{account.account_name}</p>
                        <p className="text-sm text-muted">{account.bank_name}</p>
                        <p className="text-xs text-muted">
                          ****{account.account_number.slice(-4)}
                        </p>
                      </div>
                    </div>
                    {account.is_primary && <Badge status="active" text="Primary" />}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-8">No bank accounts added</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} title="Add Funds">
        <form onSubmit={handleAddFunds} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Description</label>
            <input
              type="text"
              className="input-field"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Add Funds
          </button>
        </form>
      </Modal>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              required
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Description</label>
            <input
              type="text"
              className="input-field"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Withdraw
          </button>
        </form>
      </Modal>

      <Modal isOpen={showAddBank} onClose={() => setShowAddBank(false)} title="Add Bank Account">
        <form onSubmit={handleAddBankAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Account Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={bankForm.account_name}
              onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Bank Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={bankForm.bank_name}
              onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Account Number</label>
            <input
              type="text"
              required
              className="input-field"
              value={bankForm.account_number}
              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Routing Number</label>
            <input
              type="text"
              className="input-field"
              value={bankForm.routing_number}
              onChange={(e) => setBankForm({ ...bankForm, routing_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">Account Type</label>
            <select
              className="input-field"
              value={bankForm.account_type}
              onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            Add Bank Account
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Wallet;
