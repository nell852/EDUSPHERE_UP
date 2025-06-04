const tintColorLight = '#FFD700'; // Gold
const tintColorDark = '#FFD700';  // Gold

export default {
  light: {
    text: '#000',
    textDark: '#333333',
    textLight: '#777777',
    background: '#F5F5F5',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    white: '#FFFFFF',
    gold: '#DAA520',    // Darker gold for better contrast
    lightGold: '#F4DFA8', // Light gold for backgrounds
    lightGray: '#E5E5E5',
    darkGray: '#888888',
  },
  dark: {
    text: '#fff',
    textDark: '#F5F5F5',
    textLight: '#BBBBBB',
    background: '#121212',
    tint: tintColorDark,
    tabIconDefault: '#888',
    tabIconSelected: tintColorDark,
    white: '#1E1E1E',   // Dark mode "white" is actually dark
    gold: '#FFD700',    // Brighter gold for dark mode
    lightGold: '#3A3000', // Dark gold for backgrounds
    lightGray: '#333333',
    darkGray: '#AAAAAA',
  },
};