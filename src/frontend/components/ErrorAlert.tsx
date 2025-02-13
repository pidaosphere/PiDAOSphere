import React from 'react';
import { Alert, AlertIcon, AlertTitle, AlertDescription, Button, VStack } from '@chakra-ui/react';

interface ErrorAlertProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
    title = 'Error',
    message,
    onRetry,
    onClose,
}) => {
    return (
        <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="md"
            bg="red.50"
        >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
                {title}
            </AlertTitle>
            <AlertDescription maxWidth="sm" mb={4}>
                {message}
            </AlertDescription>
            <VStack spacing={2}>
                {onRetry && (
                    <Button colorScheme="red" onClick={onRetry}>
                        Try Again
                    </Button>
                )}
                {onClose && (
                    <Button variant="ghost" onClick={onClose}>
                        Dismiss
                    </Button>
                )}
            </VStack>
        </Alert>
    );
}; 