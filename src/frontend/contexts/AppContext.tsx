import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PiNetworkService } from '../services/PiNetworkService';
import { ProjectService } from '../services/ProjectService';
import { useToast } from '@chakra-ui/react';

interface AppContextType {
    piNetworkService: PiNetworkService;
    projectService: ProjectService | null;
    isPiHolder: boolean;
    isAuthenticated: boolean;
    user: any;
    loading: boolean;
    error: string | null;
    authenticate: () => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const wallet = useWallet();
    const toast = useToast();
    const [projectService, setProjectService] = useState<ProjectService | null>(null);
    const [isPiHolder, setIsPiHolder] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize services
    const piNetworkService = new PiNetworkService();

    useEffect(() => {
        if (wallet.connected && wallet.publicKey) {
            try {
                setLoading(true);
                // Initialize project service with wallet connection
                // setProjectService(new ProjectService(...));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize services';
                setError(errorMessage);
                toast({
                    title: 'Initialization Error',
                    description: errorMessage,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        } else {
            setProjectService(null);
        }
    }, [wallet.connected, wallet.publicKey]);

    const authenticate = async () => {
        try {
            setLoading(true);
            setError(null);
            const auth = await piNetworkService.authenticate();
            setIsAuthenticated(true);
            setUser(auth.user);
            setIsPiHolder(true);
            toast({
                title: 'Authentication Successful',
                description: `Welcome back, ${auth.user.username}!`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
            setError(errorMessage);
            toast({
                title: 'Authentication Error',
                description: errorMessage,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setIsPiHolder(false);
        toast({
            title: 'Logged Out',
            description: 'You have been successfully logged out.',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
    };

    const clearError = () => setError(null);

    return (
        <AppContext.Provider
            value={{
                piNetworkService,
                projectService,
                isPiHolder,
                isAuthenticated,
                user,
                loading,
                error,
                authenticate,
                logout,
                clearError,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}; 