import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { expenseApi } from '../api/expenseApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = useCallback(async (filters = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      const [expensesRes, summaryRes] = await Promise.all([
        expenseApi.getExpenses(filters),
        expenseApi.getSummary(filters),
      ]);
      const expenseData = expensesRes.data.data || expensesRes.data;
      const summaryData = summaryRes.data.data || summaryRes.data;
      setExpenses(expenseData || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    } else {
      setExpenses([]);
      setSummary(null);
    }
  }, [user, fetchExpenses]);

  const addExpense = async (expense) => {
    const response = await expenseApi.createExpense(expense);
    const newExpense = response.data.data || response.data;
    setExpenses((prev) => [newExpense, ...prev]);
    await fetchExpenses();
    return newExpense;
  };

  const updateExpense = async (id, updatedExpense) => {
    const response = await expenseApi.updateExpense(id, updatedExpense);
    const updated = response.data.data || response.data;
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    await fetchExpenses();
    return updated;
  };

  const deleteExpense = async (id) => {
    await expenseApi.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetchExpenses();
  };

  const getExpenseById = (id) => expenses.find((e) => e.id === id);

  const getTotalExpenses = () => summary?.total ?? expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const getExpensesByCategory = () => summary?.byCategory ?? {};

  const value = {
    expenses,
    summary,
    loading,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    getTotalExpenses,
    getExpensesByCategory,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
