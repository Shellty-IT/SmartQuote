// src/app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui';

import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import CompanySection from './components/CompanySection';
import NotificationsSection from './components/NotificationsSection';
import SmtpSection from './components/SmtpSection';
import AppearanceSection from './components/AppearanceSection';
import AISection from './components/AISection';
import ApiKeysSection from './components/ApiKeysSection';

type SettingsTab = 'profile' | 'security' | 'company' | 'notifications' | 'smtp' | 'appearance' | 'ai' | 'api-keys';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
    {
        id: 'profile',
        label: 'Profil',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        description: 'Dane osobowe i avatar'
    },
    {
        id: 'security',
        label: 'Bezpieczeństwo',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        description: 'Hasło i zabezpieczenia'
    },
    {
        id: 'company',
        label: 'Firma',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        description: 'Dane firmy na dokumentach'
    },
    {
        id: 'notifications',
        label: 'Powiadomienia',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        description: 'Email i przypomnienia'
    },
    {
        id: 'smtp',
        label: 'Skrzynka pocztowa',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
        description: 'Konfiguracja SMTP'
    },
    {
        id: 'appearance',
        label: 'Wygląd',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
        ),
        description: 'Motyw i język'
    },
    {
        id: 'ai',
        label: 'AI Asystent',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        description: 'Konfiguracja AI'
    },
    {
        id: 'api-keys',
        label: 'Klucze API',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
        description: 'Integracje zewnętrzne'
    },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const { settings, isLoading, error, refetch, ...actions } = useSettings();

    if (isLoading) {
        return <PageLoader />;
    }

    if (error) {
        return (
            <div className="p-4 sm:p-8">
                <Card className="p-6 text-center card-themed">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={refetch}
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                        Spróbuj ponownie
                    </button>
                </Card>
            </div>
        );
    }

    if (!settings) {
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSection profile={settings.profile} onUpdate={actions.updateProfile} />;
            case 'security':
                return <SecuritySection onChangePassword={actions.changePassword} />;
            case 'company':
                return <CompanySection company={settings.companyInfo} onUpdate={actions.updateCompany} />;
            case 'notifications':
                return <NotificationsSection settings={settings.settings} onUpdate={actions.updatePreferences} />;
            case 'smtp':
                return <SmtpSection />;
            case 'appearance':
                return <AppearanceSection settings={settings.settings} onUpdate={actions.updatePreferences} />;
            case 'ai':
                return <AISection settings={settings.settings} onUpdate={actions.updatePreferences} />;
            case 'api-keys':
                return (
                    <ApiKeysSection
                        apiKeys={settings.apiKeys}
                        onCreate={actions.createApiKey}
                        onToggle={actions.toggleApiKey}
                        onDelete={actions.deleteApiKey}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-themed">Ustawienia</h1>
                <p className="text-themed-muted mt-1">Zarządzaj swoim kontem i preferencjami</p>
            </div>

            <div className="hidden md:flex gap-8">
                <div className="w-72 flex-shrink-0">
                    <div className="card-themed rounded-2xl border overflow-hidden shadow-sm">
                        <nav className="divide-y divider-themed">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-cyan-500/10 border-l-4 border-cyan-500'
                                            : 'hover-themed border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className={`${
                                        activeTab === tab.id ? 'text-cyan-500' : 'text-themed-muted'
                                    }`}>
                                        {tab.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${
                                            activeTab === tab.id ? 'text-cyan-600' : 'text-themed'
                                        }`}>
                                            {tab.label}
                                        </p>
                                        <p className="text-xs text-themed-muted truncate">
                                            {tab.description}
                                        </p>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 ${
                                            activeTab === tab.id ? 'text-cyan-500' : 'text-themed-muted opacity-40'
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </div>

            <div className="md:hidden space-y-4">
                <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                    : 'card-themed border text-themed-muted'
                            }`}
                        >
                            <span className={activeTab === tab.id ? 'text-white' : ''}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}