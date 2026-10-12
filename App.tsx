import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CHARACTERS, findCharacter } from './src/characters';
import { loadSelectedId, saveSelectedId } from './src/selection';
import { NavBar, type Tab } from './src/NavBar';
import { CageScreen } from './src/CageScreen';
import { CharaScreen } from './src/CharaScreen';
import { ItemScreen } from './src/ItemScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('cage');
  const [selectedId, setSelectedId] = useState<string>(CHARACTERS[0].id);

  useEffect(() => {
    loadSelectedId().then((id) => id && setSelectedId(findCharacter(id).id));
  }, []);

  const select = (id: string) => {
    setSelectedId(id);
    saveSelectedId(id); // ウィジェットにも反映
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === 'cage' && <CageScreen character={findCharacter(selectedId)} />}
          {tab === 'chara' && <CharaScreen selectedId={selectedId} onSelect={select} />}
          {tab === 'item' && <ItemScreen />}
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
