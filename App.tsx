import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavBar, type Tab } from './src/NavBar';
import { MyCagesScreen } from './src/MyCagesScreen';
import { CageStylesScreen } from './src/CageStylesScreen';
import { Tutorial } from './src/Tutorial';

const TUTORIAL_KEY = 'tutorialSeen';

export default function App() {
  const [tab, setTab] = useState<Tab>('mine');
  const [tutorial, setTutorial] = useState(false);

  // 初回起動時だけ使い方を出す
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_KEY)
      .then((seen) => !seen && setTutorial(true))
      .catch(() => {});
  }, []);

  const closeTutorial = () => {
    setTutorial(false);
    AsyncStorage.setItem(TUTORIAL_KEY, '1').catch(() => {});
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === 'mine' && <MyCagesScreen onHelp={() => setTutorial(true)} />}
          {tab === 'styles' && <CageStylesScreen />}
        </View>
        <NavBar tab={tab} onChange={setTab} />
        <Tutorial visible={tutorial} onClose={closeTutorial} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a' },
  content: { flex: 1 },
});
