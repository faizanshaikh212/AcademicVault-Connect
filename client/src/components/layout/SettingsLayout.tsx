import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Shield, Monitor } from 'lucide-react';

interface SettingsLayoutProps {
    children: React.ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
    const location = useLocation();

    const settingsNavItems = [
        {
            name: 'Profile',
            href: '/settings',
            icon: User,
            description: 'Manage your profile information'
        },
        {
            name: 'Security',
            href: '/settings/security',
            icon: Shield,
            description: '2FA, password, and security settings'
        },
        {
            name: 'Sessions',
            href: '/settings/sessions',
            icon: Monitor,
            description: 'Manage your active sessions'
        }
    ];

    const isActive = (href: string) => {
        if (href === '/settings') {
            return location.pathname === '/settings';
        }
        return location.pathname.startsWith(href);
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 pt-30">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <nav className="space-y-2">
                            {settingsNavItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <div>
                                            <div>{item.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {item.description}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SettingsLayout;