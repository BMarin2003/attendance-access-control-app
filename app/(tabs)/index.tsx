import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkerService } from '@/src/api/workerService';
import { Worker } from '@/src/types/worker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function WorkerListScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

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

  useFocusEffect(
    useCallback(() => {
      fetchWorkers();
    }, [])
  );

  const renderItem = ({ item }: { item: Worker }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: '/worker/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardContent}>
        <ThemedText style={styles.workerName}>{item.fullName}</ThemedText>
        <ThemedText style={styles.subText}>DNI: {item.documentNumber}</ThemedText>
        <View style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge]}>
          <ThemedText style={styles.statusText}>
            {item.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
          </ThemedText>
        </View>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.icon} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Gestión de{"\n"}Personal</ThemedText>
      </View>

      <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#0a7ea4" style={styles.loader} />
        ) : (
          <FlatList
            data={workers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchWorkers} tintColor={colors.text} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No hay trabajadores registrados.</ThemedText>
              </View>
            }
            contentContainerStyle={workers.length === 0 ? styles.emptyList : undefined}
          />
        )}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/worker/create')}>
        <ThemedText style={styles.addButtonText}>Añadir Nuevo Personal</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  },
  listContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});