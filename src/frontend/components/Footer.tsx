import React from 'react';
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiGithub, FiTwitter, FiSlack, FiBook } from 'react-icons/fi';

export const Footer: React.FC = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const socialLinks = [
    { label: 'GitHub', icon: FiGithub, href: 'https://github.com/pidaosphere' },
    { label: 'Twitter', icon: FiTwitter, href: 'https://twitter.com/pidaosphere' },
    { label: 'Slack', icon: FiSlack, href: 'https://pidaosphere.slack.com' },
    { label: 'Docs', icon: FiBook, href: 'https://docs.pidaosphere.com' },
  ];

  const footerLinks = [
    { label: 'About', href: '/about' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <Box
      as="footer"
      bg={bg}
      borderTop="1px"
      borderColor={borderColor}
      py="8"
      mt="auto"
    >
      <Container maxW="container.xl">
        <Stack spacing="8">
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={{ base: '6', md: '8' }}
            align="center"
            justify="space-between"
          >
            <Stack direction="row" spacing="4">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  isExternal
                  color="gray.500"
                  _hover={{ color: 'purple.500' }}
                >
                  <Icon as={link.icon} boxSize="5" />
                </Link>
              ))}
            </Stack>

            <Stack direction="row" spacing="4">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  color="gray.500"
                  _hover={{ color: 'purple.500' }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Stack>

          <Divider />

          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            fontSize="sm"
            color="gray.500"
          >
            <Text>
              © {new Date().getFullYear()} PiDAOSphere. All rights reserved.
            </Text>
            <Text>
              Built with ❤️ by the PiDAOSphere Team
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}; 