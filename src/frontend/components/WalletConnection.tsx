import { FC, useMemo } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Box, useColorModeValue } from '@chakra-ui/react';

require('@solana/wallet-adapter-react-ui/styles.css');

export const WalletConnection: FC = () => {
    // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
    const network = 'devnet';
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TorusWalletAdapter(),
        ],
        []
    );

    const buttonBg = useColorModeValue('white', 'gray.800');

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <Box
                    sx={{
                        '& .wallet-adapter-button': {
                            bg: buttonBg,
                            color: 'brand.primary',
                            fontWeight: 'bold',
                            borderRadius: 'lg',
                            _hover: {
                                bg: 'brand.primary',
                                color: 'white',
                            },
                        },
                    }}
                >
                    <WalletMultiButton />
                </Box>
            </WalletProvider>
        </ConnectionProvider>
    );
}; 