import React from 'react';
import { Spinner, Box, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
    return (
        <VStack spacing={4} justify="center" align="center" h="200px">
            <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
            />
            <Text color="gray.600" fontSize="lg">
                {message}
            </Text>
        </VStack>
    );
}; 