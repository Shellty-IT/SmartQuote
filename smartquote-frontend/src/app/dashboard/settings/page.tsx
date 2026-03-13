// src/app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import {
    User,
    Building2,
    Bell,
    Palette,
    Bot,
    Key,
    Shield,
    Mail,
    ChevronRight
} from 'lucide-react';
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
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" />, description: 'Dane osobowe i avatar' },
    { id: 'security', label: 'Bezpieczeństwo', icon: <Shield className="w-5 h-5" />, description: 'Hasło i zabezpieczenia' },
    { id: 'company', label: 'Firma', icon: <Building2 className="w-5 h-5" />, description: 'Dane firmy na dokumentach' },
    { id: 'notifications', label: 'Powiadomienia', icon: <Bell className="w-5 h-5" />, description: 'Email i przypomnienia' },
    { id: 'smtp', label: 'Skrzynka pocztowa', icon: <Mail className="w-5 h-5" />, description: 'Konfiguracja SMTP' },
    { id: 'appearance', label: 'Wygląd', icon: <Palette className="w-5 h-5" />, description: 'Motyw i język' },
    { id: 'ai', label: 'AI Asystent', icon: <Bot className="w-5 h-5" />, description: 'Konfiguracja AI' },
    { id: 'api-keys', label: 'Klucze API', icon: <Key className="w-5 h-5" />, description: 'Integracje zewnętrzne' },
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
                                    <ChevronRight className={`w-4 h-4 ${
                                        activeTab === tab.id ? 'text-cyan-500' : 'text-themed-muted opacity-40'
                                    }`} />
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