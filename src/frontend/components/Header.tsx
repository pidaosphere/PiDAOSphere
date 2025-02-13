import React from 'react';
import {
  Box,
  Flex,
  Button,
  Image,
  HStack,
  useColorModeValue,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { WalletConnection } from './WalletConnection';
import { useApp } from '../contexts/AppContext';
import { FiUser, FiChevronDown } from 'react-icons/fi';

export const Header: React.FC = () => {
  const { isAuthenticated, user, authenticate, logout } = useApp();
  const location = useLocation();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'Proposals', path: '/proposals' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <Box
      as="header"
      position="fixed"
      w="100%"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      zIndex="sticky"
    >
      <Container maxW="container.xl">
        <Flex h="16" alignItems="center" justifyContent="space-between">
          <RouterLink to="/">
            <Image src="/logo.svg" h="8" alt="PiDAOSphere" />
          </RouterLink>

          <HStack spacing="8">
            {navItems.map((item) => (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                variant="ghost"
                colorScheme={location.pathname === item.path ? 'purple' : undefined}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          <HStack spacing="4">
            <WalletConnection />
            
            {isAuthenticated ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<FiChevronDown />}
                  leftIcon={<FiUser />}
                  variant="outline"
                >
                  {user?.username}
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/dashboard">
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={logout}>
                    Logout
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                colorScheme="purple"
                onClick={authenticate}
                leftIcon={<FiUser />}
              >
                Connect Pi
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}; 