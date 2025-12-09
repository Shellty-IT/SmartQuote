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
    ChevronRight
} from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui';

import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import CompanySection from './components/CompanySection';
import NotificationsSection from './components/NotificationsSection';
import AppearanceSection from './components/AppearanceSection';
import AISection from './components/AISection';
import ApiKeysSection from './components/ApiKeysSection';

type SettingsTab = 'profile' | 'security' | 'company' | 'notifications' | 'appearance' | 'ai' | 'api-keys';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" />, description: 'Dane osobowe i avatar' },
    { id: 'security', label: 'Bezpieczeństwo', icon: <Shield className="w-5 h-5" />, description: 'Hasło i zabezpieczenia' },
    { id: 'company', label: 'Firma', icon: <Building2 className="w-5 h-5" />, description: 'Dane firmy na dokumentach' },
    { id: 'notifications', label: 'Powiadomienia', icon: <Bell className="w-5 h-5" />, description: 'Email i przypomnienia' },
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
            <div className="p-8">
                <Card className="p-6 text-center">
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
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Ustawienia</h1>
                <p className="text-slate-500 mt-1">Zarządzaj swoim kontem i preferencjami</p>
            </div>

            <div className="flex gap-8">
                {/* Sidebar Navigation */}
                <div className="w-72 flex-shrink-0">
                    <Card padding="none" className="overflow-hidden">
                        <nav className="divide-y divide-slate-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-cyan-50 border-l-4 border-cyan-500'
                                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className={`${
                                        activeTab === tab.id ? 'text-cyan-600' : 'text-slate-400'
                                    }`}>
                                        {tab.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${
                                            activeTab === tab.id ? 'text-cyan-900' : 'text-slate-900'
                                        }`}>
                                            {tab.label}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {tab.description}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${
                                        activeTab === tab.id ? 'text-cyan-500' : 'text-slate-300'
                                    }`} />
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}