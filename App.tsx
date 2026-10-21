import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavBar, type Tab } from './src/NavBar';
import { MyCagesScreen } from './src/MyCagesScreen';
import { CageStylesScreen } from './src/CageStylesScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('mine');

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === 'mine' && <MyCagesScreen />}
          {tab === 'styles' && <CageStylesScreen />}
        </View>
        <NavBar tab={tab} onChange={setTab} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14131a' },
  content: { flex: 1 },
});
