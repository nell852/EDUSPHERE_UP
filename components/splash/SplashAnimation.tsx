import { useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Animated, Easing } from 'react-native';
import Colors from '@/constants/Colors';

const SCHOOL_LOGOS = [
  require('@/assets/images/keyce_logo-removebg-preview.png'),
  require('@/assets/images/DC.png'),
  require('@/assets/images/PS.jpeg'),
  require('@/assets/images/Logo-Upsilon.png'),
  require('@/assets/images/Ascencia.png'),
  require('@/assets/images/ecema.png'),
  require('@/assets/images/archi.png'),
];

export default function SplashAnimation() {
  const mainLogoScale = useRef(new Animated.Value(0)).current;
  const mainLogoOpacity = useRef(new Animated.Value(0)).current;
  const schoolLogosScale = useRef(SCHOOL_LOGOS.map(() => new Animated.Value(0))).current;
  const schoolLogosOpacity = useRef(SCHOOL_LOGOS.map(() => new Animated.Value(0))).current;
  const schoolLogosPosition = useRef(SCHOOL_LOGOS.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const finalLogoScale = useRef(new Animated.Value(0)).current;
  const finalLogoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mainLogoAnimation = Animated.parallel([
      Animated.timing(mainLogoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(mainLogoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    const schoolLogosEmergence = Animated.stagger(
      100,
      SCHOOL_LOGOS.map((_, index) =>
        Animated.parallel([
          Animated.timing(schoolLogosScale[index], {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(schoolLogosOpacity[index], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    );

    const orbitAnimations = SCHOOL_LOGOS.map((_, index) => {
      const angle = (2 * Math.PI * index) / SCHOOL_LOGOS.length;
      const radius = 120;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      return Animated.timing(schoolLogosPosition[index], {
        toValue: { x, y },
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
    });

    const convergeAnimations = SCHOOL_LOGOS.map((_, index) => {
      return Animated.timing(schoolLogosPosition[index], {
        toValue: { x: 0, y: 0 },
        duration: 600,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      });
    });

    const fadeOutAnimations = Animated.parallel([
      ...SCHOOL_LOGOS.map((_, index) =>
        Animated.timing(schoolLogosOpacity[index], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ),
      Animated.timing(mainLogoScale, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    const finalLogoAnimation = Animated.parallel([
      Animated.timing(finalLogoScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(finalLogoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([
      mainLogoAnimation,
      Animated.delay(300),
      schoolLogosEmergence,
      Animated.delay(200),
      Animated.parallel(orbitAnimations),
      Animated.delay(800),
      Animated.parallel(convergeAnimations),
      Animated.delay(200),
      fadeOutAnimations,
      Animated.delay(200),
      finalLogoAnimation,
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Main logo */}
      <Animated.View
        style={[
          styles.mainLogoContainer,
          {
            opacity: mainLogoOpacity,
            transform: [{ scale: mainLogoScale }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/CDP-logo-dore-PNG-1536x658.png')}
          style={styles.mainLogo}
          resizeMode="cover"
        />
      </Animated.View>

      {/* School logos */}
      {SCHOOL_LOGOS.map((logo, index) => (
        <Animated.View
          key={index}
          style={[
            styles.schoolLogoContainer,
            {
              opacity: schoolLogosOpacity[index],
              transform: [
                { translateX: schoolLogosPosition[index].x },
                { translateY: schoolLogosPosition[index].y },
                { scale: schoolLogosScale[index] },
              ],
            },
          ]}
        >
          <Image source={logo} style={styles.schoolLogo} resizeMode="cover" />
        </Animated.View>
      ))}

      {/* Final logo */}
      <Animated.View
        style={[
          styles.finalLogoContainer,
          {
            opacity: finalLogoOpacity,
            transform: [{ scale: finalLogoScale }],
          },
        ]}
      >
        <Image
          source={{
            uri: '@/assets/images/CDP-logo-dore-PNG-1536x658.png',
          }}
          style={styles.finalLogo}
          resizeMode="cover"
        />
      </Animated.View>
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
  mainLogoContainer: {
    position: 'absolute',
    zIndex: 2,
  },
  mainLogo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  schoolLogoContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  schoolLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  finalLogoContainer: {
    position: 'absolute',
    zIndex: 3,
  },
  finalLogo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: Colors.light.gold,
  },
});
