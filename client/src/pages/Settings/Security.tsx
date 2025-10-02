import React from 'react';
import SettingsLayout from '@/components/layout/SettingsLayout';
import SecuritySettings from '@/components/auth/SecuritySettings';

const SecurityPage: React.FC = () => {
    return (
        <SettingsLayout>
            <SecuritySettings />
        </SettingsLayout>
    );
};

export default SecurityPage;