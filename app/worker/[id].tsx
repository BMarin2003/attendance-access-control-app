import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Alert, Modal, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkerService } from '@/src/api/workerService';
import { Worker } from '@/src/types/worker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WorkerDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);

    // RFID Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);

    const fetchWorker = async () => {
        try {
            const data = await WorkerService.getById(Number(id));
            setWorker(data);
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar el trabajador");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchWorker();
    }, [id]);

    const handleDelete = async () => {
        Alert.alert("Confirmar", "¿Eliminar trabajador?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: async () => {
                    try {
                        await WorkerService.delete(Number(id));
                        router.back();
                    } catch(e) { Alert.alert("Error", "No se pudo eliminar"); }
                }
            }
        ]);
    };

    const handleOpenAssignModal = async () => {
        setModalVisible(true);
        setLoadingTags(true);
        try {
            // Polling manual: pedir al backend qué tarjetas están libres
            const tags = await WorkerService.getUnassignedTags();
            setAvailableTags(tags);
        } catch (e) {
            Alert.alert("Error", "No se pudieron obtener tarjetas disponibles");
        } finally {
            setLoadingTags(false);
        }
    };

    const handleAssignTag = async (tag: string) => {
        try {
            await WorkerService.assignRfid(Number(id), tag);
            setModalVisible(false);
            fetchWorker(); // Recargar para ver la nueva tarjeta
            Alert.alert("Éxito", "Tarjeta vinculada");
        } catch (e: any) {
            Alert.alert("Error", e.response?.data?.message || "Falló la asignación");
        }
    };

    const handleUnlinkTag = async (tag: string) => {
        try {
            await WorkerService.removeRfid(Number(id), tag);
            fetchWorker();
        } catch (e) {
            Alert.alert("Error", "No se pudo desvincular");
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (!worker) return null;

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">{worker.fullName}</ThemedText>
            <ThemedText style={styles.subtitle}>ID Huella: {worker.fingerprintId || 'No asignada'}</ThemedText>

            <View style={styles.infoSection}>
                <ThemedText>DNI: {worker.documentNumber}</ThemedText>
                <ThemedText>Email: {worker.email || '-'}</ThemedText>
                <ThemedText>Estado: {worker.status}</ThemedText>
            </View>

            <View style={styles.rfidSection}>
                <ThemedText type="subtitle">Tarjetas RFID</ThemedText>
                {worker.rfidTags.length === 0 ? (
                    <ThemedText style={{ fontStyle: 'italic', color: '#888', marginVertical: 10 }}>Sin tarjetas asignadas</ThemedText>
                ) : (
                    worker.rfidTags.map(tag => (
                        <View key={tag} style={styles.tagRow}>
                            <ThemedText style={styles.tagText}>{tag}</ThemedText>
                            <TouchableOpacity onPress={() => handleUnlinkTag(tag)}>
                                <IconSymbol name="trash.fill" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <Button title="Vincular Tarjeta Disponible" onPress={handleOpenAssignModal} />
            </View>

            <View style={{ marginTop: 40 }}>
                <Button title="Eliminar Trabajador" color="red" onPress={handleDelete} />
            </View>

            {/* Modal para seleccionar RFID del pool */}
            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalView}>
                    <ThemedText type="subtitle" style={{marginBottom: 10}}>Seleccionar Tarjeta</ThemedText>
                    <ThemedText style={{marginBottom: 10, fontSize: 12}}>Escanee una tarjeta nueva si la lista está vacía y pulse refrescar.</ThemedText>

                    {loadingTags ? <ActivityIndicator /> : (
                        <FlatList
                            data={availableTags}
                            keyExtractor={(item) => item}
                            ListEmptyComponent={<ThemedText>No hay tarjetas libres escaneadas.</ThemedText>}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => handleAssignTag(item)}>
                                    <ThemedText>{item}</ThemedText>
                                    <IconSymbol name="plus.circle.fill" size={24} color="green" />
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <Button title="Refrescar" onPress={handleOpenAssignModal} />
                        <Button title="Cerrar" color="red" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, marginTop: 30 },
    subtitle: { color: '#666', marginBottom: 20 },
    infoSection: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 20 },
    rfidSection: { marginTop: 10 },
    tagRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#e6f7ff', padding: 10, marginBottom: 5, borderRadius: 5, borderWidth: 1, borderColor: '#bae7ff'
    },
    tagText: { fontFamily: 'monospace', fontWeight: 'bold' },
    modalView: {
        margin: 20, marginTop: 100, backgroundColor: 'white', borderRadius: 20, padding: 35,
        alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, maxHeight: '60%'
    },
    modalItem: {
        flexDirection: 'row', justifyContent: 'space-between', width: 250,
        padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'
    }
});