// src/app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { ChevronRight, User, Shield, Building2, Bell, Mail, Sparkles, Key } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';

import ProfileSection from './components/ProfileSection';
import SecuritySection from './components/SecuritySection';
import CompanySection from './components/CompanySection';
import NotificationsSection from './components/NotificationsSection';
import EmailProviderTab from './components/EmailProviderTab';
import AISection from './components/AISection';
import ApiKeysSection from './components/ApiKeysSection';

type SettingsTab = 'profile' | 'security' | 'company' | 'notifications' | 'smtp' | 'ai' | 'api-keys';

const TAB_ICONS: Record<SettingsTab, React.ElementType> = {
    profile: User,
    security: Shield,
    company: Building2,
    notifications: Bell,
    smtp: Mail,
    ai: Sparkles,
    'api-keys': Key,
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const { settings, isLoading, error, refetch, ...actions } = useSettings();
    const tr = useTranslations('settings');
    const commonTr = useTranslations('common');

    const TABS = [
        { id: 'profile' as SettingsTab,       ...tr.tabs.profile },
        { id: 'security' as SettingsTab,      ...tr.tabs.security },
        { id: 'company' as SettingsTab,       ...tr.tabs.company },
        { id: 'notifications' as SettingsTab, ...tr.tabs.notifications },
        { id: 'smtp' as SettingsTab,          ...tr.tabs.smtp },
        { id: 'ai' as SettingsTab,            ...tr.tabs.ai },
        { id: 'api-keys' as SettingsTab,      ...tr.tabs.apiKeys },
    ];

    if (isLoading) return <PageLoader />;

    if (error) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                    <p className="mb-4 text-destructive">{error}</p>
                    <button onClick={refetch} className="text-sm font-semibold text-primary hover:underline">
                        {commonTr.retry}
                    </button>
                </div>
            </div>
        );
    }

    if (!settings) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':       return <ProfileSection profile={settings.profile} onUpdate={actions.updateProfile} />;
            case 'security':      return <SecuritySection onChangePassword={actions.changePassword} />;
            case 'company':       return <CompanySection company={settings.companyInfo} onUpdate={actions.updateCompany} />;
            case 'notifications': return <NotificationsSection settings={settings.settings} onUpdate={actions.updatePreferences} />;
            case 'smtp':          return <EmailProviderTab emailProvider={settings.settings.emailProvider} onProviderChange={(emailProvider) => actions.updatePreferences({ emailProvider })} />;
            case 'ai':            return <AISection settings={settings.settings} onUpdate={actions.updatePreferences} />;
            case 'api-keys':      return <ApiKeysSection apiKeys={settings.apiKeys} onCreate={actions.createApiKey} onToggle={actions.toggleApiKey} onDelete={actions.deleteApiKey} />;
            default:              return null;
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tr.breadcrumb}</div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{tr.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{tr.subtitle}</p>
            </div>

            {/* Desktop: sidebar + content */}
            <div className="hidden md:flex gap-6">
                {/* Sidebar nav */}
                <div className="w-64 shrink-0">
                    <nav className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                        {TABS.map((tab) => {
                            const Icon = TAB_ICONS[tab.id];
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'group relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-border last:border-0',
                                        active
                                            ? 'bg-primary/8 border-l-[3px] border-l-primary'
                                            : 'border-l-[3px] border-l-transparent hover:bg-secondary/60',
                                    )}
                                >
                                    <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} strokeWidth={2} />
                                    <div className="min-w-0 flex-1">
                                        <p className={cn('text-sm font-semibold', active ? 'text-primary' : 'text-foreground')}>{tab.label}</p>
                                        <p className="truncate text-xs text-muted-foreground">{tab.description}</p>
                                    </div>
                                    <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-colors', active ? 'text-primary' : 'text-muted-foreground/40')} />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">{renderContent()}</div>
            </div>

            {/* Mobile: horizontal tab bar */}
            <div className="md:hidden space-y-4">
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
                    {TABS.map((tab) => {
                        const Icon = TAB_ICONS[tab.id];
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all',
                                    active
                                        ? 'bg-gradient-primary text-white shadow-glow ring-1 ring-white/15'
                                        : 'border border-border bg-card text-muted-foreground hover:bg-secondary',
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <div>{renderContent()}</div>
            </div>
        </div>
    );
}
