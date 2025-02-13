import React from 'react';
import { Box, Container, useBreakpointValue } from '@chakra-ui/react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { loading, error, clearError } = useApp();
    const containerWidth = useBreakpointValue({ base: '100%', md: '90%', lg: '80%', xl: '1200px' });

    return (
        <Box minH="100vh" display="flex" flexDirection="column">
            <Header />
            <Container
                as="main"
                maxW={containerWidth}
                flex="1"
                py={{ base: 4, md: 8 }}
                px={{ base: 4, md: 6 }}
            >
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <ErrorAlert
                        message={error}
                        onClose={clearError}
                    />
                ) : (
                    children
                )}
            </Container>
            <Footer />
        </Box>
    );
}; 