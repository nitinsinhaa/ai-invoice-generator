import { useState, useEffect } from 'react';
import { User, Building, Lock, Bell, DollarSign } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/authApi';
import { notificationApi } from '../api/notificationApi';
import { applyTheme } from '../utils/theme';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { updateCurrency, updateTheme } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zip_code: '',
  });
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    tax_id: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailTesting, setEmailTesting] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    currency: 'INR',
    theme: 'light',
    tax_type: 'GST',
    gst_rate: 18,
    cgst_rate: 9,
    sgst_rate: 9,
    igst_rate: 18,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India',
        zip_code: user.zip_code || '',
      });
      setCompanyForm({
        company_name: user.company_name || '',
        tax_id: user.tax_id || '',
      });
      setPreferences({
        email_notifications: user.email_notifications ?? true,
        currency: user.currency || 'INR',
        theme: user.theme || 'light',
        tax_type: user.tax_type || 'GST',
        gst_rate: user.gst_rate || 18,
        cgst_rate: user.cgst_rate || 9,
        sgst_rate: user.sgst_rate || 9,
        igst_rate: user.igst_rate || 18,
      });
      
      applyTheme(user.theme || 'light');
    }
  }, [user]);

  useEffect(() => {
    const loadEmailStatus = async () => {
      try {
        const res = await notificationApi.getStatus();
        setEmailStatus(res.data.data || res.data);
      } catch {
        setEmailStatus({ ok: false, message: 'Could not check email status' });
      }
    };
    if (user) loadEmailStatus();
  }, [user]);

  const handleTestEmail = async () => {
    setEmailTesting(true);
    try {
      const res = await notificationApi.sendTest();
      const data = res.data.data || res.data;
      if (data?.previewUrl) {
        toast.success('Test sent! Open preview URL from API response or backend logs.');
        window.open(data.previewUrl, '_blank');
      } else {
        toast.success(res.data.message || 'Test email sent to your account email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setEmailTesting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.updateProfile(profileForm);
      updateUser(response.data.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.updateProfile(companyForm);
      updateUser(response.data.data);
      toast.success('Company information updated!');
    } catch (error) {
      toast.error('Failed to update company information');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.updateProfile({ password: passwordForm.new_password });
      toast.success('Password updated successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only send fields that exist in database
      const preferencesData = {
        email_notifications: preferences.email_notifications,
        currency: preferences.currency,
        theme: preferences.theme,
        tax_type: preferences.tax_type,
        cgst_rate: preferences.cgst_rate,
        sgst_rate: preferences.sgst_rate,
        igst_rate: preferences.igst_rate,
        gst_rate: preferences.gst_rate,
      };
      
      const response = await authApi.updateProfile(preferencesData);
      const updatedUser = response.data.data;

      updateUser(updatedUser);
      updateCurrency(preferences.currency);
      updateTheme(preferences.theme);
      applyTheme(preferences.theme);

      toast.success('Preferences updated!');
    } catch (error) {
      console.error('Preferences update error:', error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'company', label: 'Company', icon: Building },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell },
  ];

  return (
    <div>
      <Header title="Settings" />

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="card">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3 card">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <h2 className="text-xl font-semibold text-heading mb-4">Profile Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Full Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                    <p className="text-xs text-muted mt-1">
                      Used for login and for emails sent <em>to you</em> (test, paid-invoice alerts).
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Country</label>
                    <select
                      className="input-field"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    >
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Address</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">City</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">State</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Zip Code</label>
                    <input
                      type="text"
                      className="input-field"
                      value={profileForm.zip_code}
                      onChange={(e) => setProfileForm({ ...profileForm, zip_code: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'company' && (
              <form onSubmit={handleCompanyUpdate} className="space-y-6">
                <h2 className="text-xl font-semibold text-heading mb-4">Company Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Company Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={companyForm.company_name}
                      onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Tax ID / GSTIN</label>
                    <input
                      type="text"
                      className="input-field"
                      value={companyForm.tax_id}
                      onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <h2 className="text-xl font-semibold text-heading mb-4">Change Password</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Current Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="input-field"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}

            {activeTab === 'preferences' && (
              <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                <h2 className="text-xl font-semibold text-heading mb-4">Preferences</h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <p className="font-medium text-heading">Email system (SMTP)</p>
                    <p className="text-sm text-muted">
                      Node.js has no built-in email — this app uses <strong>Nodemailer</strong> with
                      Gmail or any SMTP server configured in <code>backend/.env</code>.
                    </p>
                    {emailStatus && (
                      <p
                        className={`text-sm ${emailStatus.ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {emailStatus.message}
                        {emailStatus.mode === 'ethereal' && ' — dev test inbox only'}
                      </p>
                    )}
                    <p className="text-sm text-heading">
                      <strong>Emails sent to you:</strong>{' '}
                      <span className="text-primary-600 dark:text-primary-400">{user?.email}</span>
                      <span className="text-muted block text-xs mt-1">
                        Change this in Profile → Email. Test &amp; paid-invoice alerts use that address.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={handleTestEmail}
                      disabled={emailTesting}
                      className="btn-secondary text-sm"
                    >
                      {emailTesting ? 'Sending…' : `Send test email to ${user?.email || 'my account'}`}
                    </button>
                    <ul className="text-xs text-muted list-disc pl-4 space-y-1">
                      <li>Invoice → Send Email button (PDF attached)</li>
                      <li>Mark invoice paid → receipt to customer + alert to you</li>
                      <li>Register → welcome email (if notifications on)</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-heading">Email Notifications</p>
                      <p className="text-sm text-muted">Turn off to stop automated emails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.email_notifications}
                        onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Currency</label>
                    <select
                      className="input-field"
                      value={preferences.currency}
                      onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    >
                      <option value="INR">INR - Indian Rupee (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-heading mb-2">Theme</label>
                    <select
                      className="input-field"
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-heading mb-4">Tax Configuration</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-heading mb-2">Tax Type</label>
                        <select
                          className="input-field"
                          value={preferences.tax_type}
                          onChange={(e) => setPreferences({ ...preferences, tax_type: e.target.value })}
                        >
                          <option value="GST">GST (India)</option>
                          <option value="VAT">VAT (Europe/UK)</option>
                          <option value="SALES_TAX">Sales Tax (USA)</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>

                      {preferences.tax_type === 'GST' && (
                        <div className="settings-subpanel grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              CGST Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field"
                              value={preferences.cgst_rate}
                              onChange={(e) => setPreferences({ ...preferences, cgst_rate: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              SGST Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field"
                              value={preferences.sgst_rate}
                              onChange={(e) => setPreferences({ ...preferences, sgst_rate: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                              IGST Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="input-field"
                              value={preferences.igst_rate}
                              onChange={(e) => setPreferences({ ...preferences, igst_rate: parseFloat(e.target.value) })}
                            />
                          </div>
                        </div>
                      )}

                      {(preferences.tax_type === 'VAT' || preferences.tax_type === 'SALES_TAX' || preferences.tax_type === 'CUSTOM') && (
                        <div>
                          <label className="block text-sm font-medium text-heading mb-2">Tax Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={preferences.gst_rate}
                            onChange={(e) => setPreferences({ ...preferences, gst_rate: parseFloat(e.target.value) })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
