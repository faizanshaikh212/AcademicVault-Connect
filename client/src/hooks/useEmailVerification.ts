import { useState } from 'react';
import { useAuth } from './useAuth';

export const useEmailVerification = () => {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [featureName, setFeatureName] = useState('this feature');

    const requireEmailVerification = (feature: string = 'this feature'): boolean => {
        if (!user) return false;

        if (!user.isEmailVerified) {
            setFeatureName(feature);
            setShowModal(true);
            return false;
        }

        return true;
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return {
        isEmailVerified: user?.isEmailVerified || false,
        requireEmailVerification,
        showModal,
        closeModal,
        featureName
    };
};