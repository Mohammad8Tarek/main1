import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { systemSettingsApi, logActivity } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

interface Settings {
    default_language: 'en' | 'ar';
    ai_suggestions: 'true' | 'false';
    [key: string]: string;
}

const SettingsPage: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await systemSettingsApi.getSettings();
                setSettings(data as Settings);
            } catch (error) {
                showToast(t('errors.fetchFailed'), 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [showToast, t]);

    const handleToggleChange = (key: keyof Settings) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [key]: settings[key] === 'true' ? 'false' : 'true',
        });
    };

    const handleSelectChange = (key: keyof Settings, value: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [key]: value,
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        setIsSubmitting(true);
        try {
            await systemSettingsApi.updateSettings(settings);
            logActivity(user!.username, 'Updated system settings');
            showToast(t('settingsPage.saveSuccess'), 'success');
        } catch (error) {
            showToast(t('errors.generic'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">{t('loading')}...</div>;
    }
    
    if (!settings) {
        return <div className="p-4 text-center text-red-500">{t('errors.fetchFailed')}</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('settingsPage.title')}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settingsPage.description')}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white border-b pb-3 dark:border-slate-700">{t('settingsPage.general.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1">
                            <label htmlFor="default_language" className="font-medium text-slate-700 dark:text-slate-300">{t('settingsPage.general.languageLabel')}</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('settingsPage.general.languageDesc')}</p>
                        </div>
                        <div className="md:col-span-2">
                            <select
                                id="default_language"
                                value={settings.default_language}
                                onChange={(e) => handleSelectChange('default_language', e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full max-w-xs p-2.5 dark:bg-slate-700 dark:border-slate-600"
                            >
                                <option value="en">English</option>
                                <option value="ar">العربية (Arabic)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Feature Flags */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white border-b pb-3 dark:border-slate-700">{t('settingsPage.features.title')}</h2>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div className="md:col-span-1">
                            <label htmlFor="ai_suggestions" className="font-medium text-slate-700 dark:text-slate-300">{t('settingsPage.features.aiSuggestionsLabel')}</label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('settingsPage.features.aiSuggestionsDesc')}</p>
                        </div>
                        <div className="md:col-span-2">
                             <label htmlFor="ai_suggestions" className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="ai_suggestions"
                                    checked={settings.ai_suggestions === 'true'}
                                    onChange={() => handleToggleChange('ai_suggestions')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-primary-600 text-white font-medium text-sm rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 disabled:opacity-50"
                    >
                        {isSubmitting ? `${t('saving')}...` : t('settingsPage.saveButton')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
