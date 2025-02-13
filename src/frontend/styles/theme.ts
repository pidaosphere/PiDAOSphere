import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      primary: '#6B3D9E',
      secondary: '#FFB347',
      accent: '#FFE066',
      background: '#1A1A1A',
      text: '#FFFFFF',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'brand.background',
        color: 'brand.text',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'brand.primary',
          color: 'white',
          _hover: {
            bg: 'brand.secondary',
          },
        },
        outline: {
          border: '2px solid',
          borderColor: 'brand.primary',
          color: 'brand.primary',
          _hover: {
            bg: 'brand.primary',
            color: 'white',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        bg: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 'xl',
        p: 6,
        backdropFilter: 'blur(10px)',
      },
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
});

export default theme; 