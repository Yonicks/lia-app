import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DevStorageProbe } from '../src/testing/DevStorageProbe';
import { testIds } from '../src/testing/testIds';

export default function Bootstrap() {
  return (
    <SafeAreaView style={styles.root} testID={testIds.bootstrap.root}>
      <View style={styles.center}>
        <Text style={styles.title} testID={testIds.bootstrap.title}>
          Talki Native Migration
        </Text>
        <Text style={styles.subtitle}>Phase 1</Text>
        <DevStorageProbe />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
});
