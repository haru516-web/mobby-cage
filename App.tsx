import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavBar, type Tab } from './src/NavBar';
import { MyCagesScreen } from './src/MyCagesScreen';
import { DEFAULT_STYLE_ID, findStyle } from './src/cageStyles';
import { loadStyleId, saveStyleId } from './src/cageStore';
import { CageStylesScreen } from './src/CageStylesScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('mine');
  const [styleId, setStyleId] = useState(DEFAULT_STYLE_ID);

  useEffect(() => {
    loadStyleId().then((id) => id && setStyleId(findStyle(id).id));
  }, []);

  const selectStyle = (id: string) => {
    setStyleId(id);
    saveStyleId(id);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === 'mine' && <MyCagesScreen styleId={styleId} />}
          {tab === 'styles' && <CageStylesScreen styleId={styleId} onSelect={selectStyle} />}
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
