import React, { useState } from 'react';
import { getApiUrl } from '../config/api';

interface LoginModalProps {
  isOpen: boolean;
  onLogin: (token: string, user: any) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('prefer-not-to-say');
  const [favoriteBetType, setFavoriteBetType] = useState('RED');
  const [riskTolerance, setRiskTolerance] = useState('medium');
  const [preferredBetAmount, setPreferredBetAmount] = useState('50');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (!isLogin && !username.trim())) return;

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          ...(isLogin ? {} : { 
            username: username.trim(),
            age: parseInt(age),
            country: country.trim(),
            gender,
            bettingPreferences: {
              favoriteBetType,
              riskTolerance,
              preferredBetAmount: parseInt(preferredBetAmount),
              favoriteNumbers: []
            }
          }),
          referralCode: referralCode.trim() || undefined
        })
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.token, data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onClose();
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setAge('');
    setCountry('');
    setGender('prefer-not-to-say');
    setFavoriteBetType('RED');
    setRiskTolerance('medium');
    setPreferredBetAmount('50');
    setReferralCode('');
    setShowReferral(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 p-8 rounded-2xl border border-yellow-400/20 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <span className="text-3xl">🎰</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join Covies Casino'}
          </h2>
          <p className="text-gray-400">🇿🇦 South Africa's Premier Roulette</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
              disabled={isLoading}
              autoFocus
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose username"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="mb-4">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
                  disabled={isLoading}
                  min="18"
                  max="120"
                  required
                />
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Enter your country"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="mb-4">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none transition-colors"
                  disabled={isLoading}
                >
                  <option value="prefer-not-to-say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Betting Preferences (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={favoriteBetType}
                    onChange={(e) => setFavoriteBetType(e.target.value)}
                    className="px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                    disabled={isLoading}
                  >
                    <option value="RED">Red</option>
                    <option value="BLACK">Black</option>
                    <option value="STRAIGHT">Straight</option>
                    <option value="EVEN">Even</option>
                    <option value="ODD">Odd</option>
                  </select>
                  
                  <select
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(e.target.value)}
                    className="px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white text-sm focus:border-yellow-400 focus:outline-none transition-colors"
                    disabled={isLoading}
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>
                
                <input
                  type="number"
                  value={preferredBetAmount}
                  onChange={(e) => setPreferredBetAmount(e.target.value)}
                  placeholder="Preferred bet amount"
                  className="w-full mt-2 px-3 py-2 bg-black/50 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
                  disabled={isLoading}
                  min="1"
                  max="1000"
                />
              </div>
            </>
          )}

          <div className="mb-4 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 pr-12 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none transition-colors"
              disabled={isLoading}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Referral Code Section - Removed as per request */}


          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-2 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black text-sm font-bold rounded-lg transition-all disabled:opacity-50"
              disabled={isLoading || !email.trim() || !password.trim() || (!isLogin && (!username.trim() || !age.trim() || !country.trim()))}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          🇿🇦 {isLogin ? 'Welcome back!' : 'New players start with R5,000 welcome bonus + 10 free spins!'}
        </p>
      </div>
    </div>
  );
};