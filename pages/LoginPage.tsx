
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        const rememberedUsername = localStorage.getItem('rememberedUser');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!username || !password) {
            setError(t('login.fillFields'));
            setLoading(false);
            return;
        }

        try {
            const { user, token } = await authApi.login({ username, password });
            login(user, token, rememberMe);
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
            } else {
                localStorage.removeItem('rememberedUser');
            }
        } catch (err: any) {
            setError(err.message || t('login.invalidCredentials'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-4 font-sans">
            
            {/* Logo and Title */}
            <div className="text-center mb-8 animate-fade-in-up">
                <div className="inline-block">
                     <svg width="80" height="25" viewBox="0 0 80 25" xmlns="http://www.w3.org/2000/svg" className="text-amber-400 fill-current drop-shadow-lg">
                        <path d="M0 0 L80 0 L70 20 L10 20 Z" />
                    </svg>
                </div>
                <h1 className="text-5xl font-bold text-white tracking-wider mt-4">
                    Tal Avenue
                </h1>
                <p className="text-lg text-slate-400 tracking-widest mt-1 uppercase">
                    Staff Housing
                </p>
            </div>


            {/* Login Form Container */}
            <div className="w-full max-w-sm bg-slate-800 rounded-lg shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-bold text-white text-center mb-6 tracking-[0.2em]">{t('login.title')}</h2>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-slate-400">
                            {t('login.username')}
                        </label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 placeholder-slate-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Default: admin"
                            required
                            aria-label={t('login.username')}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block mb-2 text-sm font-medium text-slate-400"
                        >
                            {t('login.password')}
                        </label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 placeholder-slate-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Default: admin123"
                            required
                            aria-label={t('login.password')}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex items-center h-5">
                                <input 
                                    id="remember" 
                                    aria-describedby="remember" 
                                    type="checkbox" 
                                    className="w-4 h-4 border-slate-600 rounded bg-slate-700 focus:ring-3 focus:ring-primary-600 ring-offset-slate-800" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                            </div>
                            <div className="mx-2 text-sm">
                                <label htmlFor="remember" className="text-slate-400">{t('login.rememberMe')}</label>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsForgotPasswordModalOpen(true)} className="text-sm font-medium text-primary-500 hover:underline">{t('login.forgotPassword')}</button>
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-800 font-medium rounded-lg text-sm px-5 py-3 text-center disabled:opacity-60 transition-colors duration-300"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                                {t('loading')}...
                            </>
                        ) : (
                            t('login.loginButton')
                        )}
                    </button>
                </form>
            </div>
            
            <footer className="absolute bottom-4 text-center w-full z-10">
                <p className="text-sm text-slate-500">Implemented by: Mohamed Tarek</p>
            </footer>
        </div>
        {isForgotPasswordModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
                        <i className="fa-solid fa-key text-2xl text-primary-600 dark:text-primary-400"></i>
                    </div>
                    <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-white mb-2">{t('login.forgotPasswordModal.title')}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('login.forgotPasswordModal.message')}</p>
                    <button
                        type="button"
                        onClick={() => setIsForgotPasswordModalOpen(false)}
                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        {t('login.forgotPasswordModal.close')}
                    </button>
                 </div>
            </div>
        )}
        </>
    );
};

export default LoginPage;
