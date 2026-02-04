import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { App } from 'antd';

const LoginPage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [workId, setWorkId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ workId: '', password: '' });
  
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = { workId: '', password: '' };
    let isValid = true;

    if (!workId.trim()) {
      newErrors.workId = 'Work ID is required';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await login(workId, password);
      message.success('Access granted. Welcome to Triverse Systems.');
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error.response?.data?.message || 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    leftPanel: {
      width: '65%',
      background: 'linear-gradient(135deg, #4c1d95 0%, #312e81 50%, #0f0f0f 100%)',
      position: 'relative' as const,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      padding: '64px',
    },
    noiseOverlay: {
      position: 'absolute' as const,
      inset: 0,
      opacity: 0.02,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
      pointerEvents: 'none' as const,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 10,
    },
    logoBox: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      color: 'white',
      fontSize: '24px',
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    mainHeading: {
      fontSize: '56px',
      fontWeight: 700,
      color: 'white',
      lineHeight: 1.2,
      marginBottom: '24px',
      letterSpacing: '-1px',
      maxWidth: '600px',
    },
    subHeading: {
      fontSize: '20px',
      color: '#9ca3af',
      letterSpacing: '0.5px',
    },
    footer: {
      fontSize: '14px',
      color: '#6b7280',
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '32px',
    },
    card: {
      width: '100%',
      maxWidth: '450px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '40px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    cardTitle: {
      fontSize: '30px',
      fontWeight: 700,
      color: 'white',
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    },
    cardSubtitle: {
      fontSize: '14px',
      color: '#9ca3af',
      marginBottom: '32px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 500,
      color: '#d1d5db',
      marginBottom: '8px',
    },
    inputWrapper: {
      position: 'relative' as const,
      marginBottom: '24px',
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      color: 'white',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    inputError: {
      borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    inputPassword: {
      paddingRight: '48px',
    },
    toggleButton: {
      position: 'absolute' as const,
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
    },
    errorText: {
      fontSize: '12px',
      color: '#f87171',
      marginTop: '6px',
    },
    button: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: '0 10px 30px rgba(147, 51, 234, 0.3)',
    } as React.CSSProperties,
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    secureText: {
      textAlign: 'center' as const,
      marginTop: '32px',
      fontSize: '12px',
      color: '#6b7280',
    },
  };

  return (
    <div style={styles.container}>
      {/* LEFT PANEL */}
      <div style={styles.leftPanel}>
        <div style={styles.noiseOverlay} />
        
        <div style={styles.logo}>
          <div style={styles.logoBox}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>T</span>
          </div>
          <span style={styles.logoText}>Triverse Solutions LLP</span>
        </div>

        <div style={{ zIndex: 10 }}>
          <h1 style={styles.mainHeading}>
            Empowering Digital Excellence
          </h1>
          <p style={styles.subHeading}>
            Tech • SaaS • Automation • Digital Marketing
          </p>
        </div>

        <div style={styles.footer}>
          Triverse Solutions LLP © 2025
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Access Triverse Systems</h2>
          <p style={styles.cardSubtitle}>Secure workspace for authorized teams</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputWrapper}>
              <label htmlFor="workId" style={styles.label}>Work ID</label>
              <input
                id="workId"
                type="text"
                value={workId}
                onChange={(e) => {
                  setWorkId(e.target.value);
                  setErrors({ ...errors, workId: '' });
                }}
                style={{
                  ...styles.input,
                  ...(errors.workId ? styles.inputError : {}),
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Enter your work ID"
                autoComplete="username"
              />
              {errors.workId && <p style={styles.errorText}>{errors.workId}</p>}
            </div>

            <div style={styles.inputWrapper}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: '' });
                  }}
                  style={{
                    ...styles.input,
                    ...styles.inputPassword,
                    ...(errors.password ? styles.inputError : {}),
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleButton}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.color = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.color = '#9ca3af';
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p style={styles.errorText}>{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 15px 40px rgba(147, 51, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 10px 30px rgba(147, 51, 234, 0.3)';
              }}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"></circle>
                    <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" opacity="0.75"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Workspace</span>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p style={styles.secureText}>
            Protected by Triverse Secure Stack™
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
