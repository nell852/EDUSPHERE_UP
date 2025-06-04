
import { useEffect } from 'react';
import { StyleSheet, View, Image, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import SplashAnimation from '@/components/splash/SplashAnimation';
import { StatusBar } from 'expo-status-bar';
import 'react-native-url-polyfill/auto';


export default function SplashScreen() {
  useEffect(() => {
    // Simulate loading time, then navigate to authentication or main app
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 4000); // Splash animation duration
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SplashAnimation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.white,
  },
});