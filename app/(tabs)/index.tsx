import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { WorkerService } from '@/src/api/workerService';
import { Worker } from '@/src/types/worker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WorkerListScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await WorkerService.getAll();
      setWorkers(data);
    } catch (error) {
      console.error("Error fetching workers:", error);
      alert("Error conectando con la API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const renderItem = ({ item }: { item: Worker }) => (
      <TouchableOpacity
          style={styles.card}
          onPress={() => router.push({ pathname: '/worker/[id]', params: { id: item.id } })}
      >
        <View>
          <ThemedText type="defaultSemiBold">{item.fullName}</ThemedText>
          <ThemedText style={styles.subText}>DNI: {item.documentNumber}</ThemedText>
          <ThemedText style={[styles.status, item.status === 'ACTIVE' ? styles.active : styles.inactive]}>
            {item.status}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={20} color="#ccc" />
      </TouchableOpacity>
  );

  return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title">Personal</ThemedText>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/worker/create')}>
            <ThemedText style={styles.addButtonText}>+ Nuevo</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#0a7ea4" style={{marginTop: 20}} />
        ) : (
            <FlatList
                data={workers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWorkers} />}
                ListEmptyComponent={<Text style={styles.empty}>No hay trabajadores registrados.</Text>}
            />
        )}
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  subText: { color: '#666', fontSize: 14 },
  status: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  active: { color: 'green' },
  inactive: { color: 'red' },
  addButton: { backgroundColor: '#0a7ea4', padding: 10, borderRadius: 5 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 20, color: '#999' }
});