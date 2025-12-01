import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Alert, Modal, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
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

    // Modales
    const [rfidModalVisible, setRfidModalVisible] = useState(false);
    const [fpModalVisible, setFpModalVisible] = useState(false);

    // Datos Auxiliares
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [manualFpId, setManualFpId] = useState('');

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

    useEffect(() => { if (id) fetchWorker(); }, [id]);

    // --- Acciones de Estado ---
    const toggleStatus = async () => {
        if (!worker) return;
        try {
            if (worker.status === 'ACTIVE') {
                await WorkerService.deactivate(worker.id);
                Alert.alert("Desactivado", "El trabajador ha sido desactivado.");
            } else {
                await WorkerService.activate(worker.id);
                Alert.alert("Activado", "El trabajador ha sido activado.");
            }
            fetchWorker();
        } catch (e) { Alert.alert("Error", "No se pudo cambiar el estado"); }
    };

    const toggleAccess = async () => {
        if (!worker) return;
        try {
            if (worker.hasRestrictedAreaAccess) {
                await WorkerService.revokeAccess(worker.id);
                Alert.alert("Revocado", "Acceso restringido revocado.");
            } else {
                await WorkerService.grantAccess(worker.id);
                Alert.alert("Concedido", "Acceso restringido concedido.");
            }
            fetchWorker();
        } catch (e) { Alert.alert("Error", "No se pudo cambiar el permiso"); }
    };

    // --- RFID ---
    const handleOpenAssignModal = async () => {
        setRfidModalVisible(true);
        try {
            const tags = await WorkerService.getUnassignedTags();
            setAvailableTags(tags);
        } catch (e) { Alert.alert("Error", "Fallo al obtener tags"); }
    };

    const handleAssignTag = async (tag: string) => {
        try {
            await WorkerService.assignRfid(Number(id), tag);
            setRfidModalVisible(false);
            fetchWorker();
        } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Error"); }
    };

    const handleUnlinkTag = async (tag: string) => {
        try {
            await WorkerService.removeRfid(Number(id), tag);
            fetchWorker();
        } catch (e) { Alert.alert("Error", "No se pudo desvincular"); }
    };

    // --- Huella Manual ---
    const handleManualFp = async () => {
        if (!manualFpId) return;
        try {
            await WorkerService.assignManualFingerprint(Number(id), parseInt(manualFpId));
            setFpModalVisible(false);
            setManualFpId('');
            fetchWorker();
            Alert.alert("Éxito", "Huella asignada manualmente");
        } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Error"); }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0a7ea4" />;
    if (!worker) return null;

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                <View style={styles.headerRow}>
                    <ThemedText type="title" style={{flex: 1}}>{worker.fullName}</ThemedText>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/worker/edit', params: { id: worker.id } } as any)}>
                        <IconSymbol name="square.and.pencil" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                </View>

                {/* Estado y Acciones Rápidas */}
                <View style={[styles.card, { borderLeftColor: worker.status === 'ACTIVE' ? 'green' : 'red', borderLeftWidth: 4 }]}>
                    <ThemedText>Estado: <ThemedText type="defaultSemiBold">{worker.status}</ThemedText></ThemedText>
                    <ThemedText>Acceso Restringido: <ThemedText type="defaultSemiBold">{worker.hasRestrictedAreaAccess ? 'SÍ' : 'NO'}</ThemedText></ThemedText>

                    <View style={styles.buttonRow}>
                        <Button title={worker.status === 'ACTIVE' ? "Desactivar" : "Activar"} onPress={toggleStatus} color={worker.status === 'ACTIVE' ? "orange" : "green"} />
                        <Button title={worker.hasRestrictedAreaAccess ? "Revocar Acceso" : "Dar Acceso"} onPress={toggleAccess} />
                    </View>
                </View>

                {/* Info Personal */}
                <View style={styles.card}>
                    <ThemedText type="subtitle">Datos Personales</ThemedText>
                    <ThemedText>DNI: {worker.documentNumber}</ThemedText>
                    <ThemedText>Email: {worker.email || '-'}</ThemedText>
                    <ThemedText>Teléfono: {worker.phoneNumber || '-'}</ThemedText>
                </View>

                {/* Biometría */}
                <View style={styles.card}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <ThemedText type="subtitle">Huella Digital</ThemedText>
                        <TouchableOpacity onPress={() => setFpModalVisible(true)}>
                            <ThemedText style={{color:'#0a7ea4'}}>Manual</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ThemedText>ID Sensor: {worker.fingerprintId || 'No asignada'}</ThemedText>
                </View>

                {/* RFID */}
                <View style={styles.card}>
                    <ThemedText type="subtitle">Tarjetas RFID</ThemedText>
                    {worker.rfidTags.length === 0 ? (
                        <ThemedText style={{ fontStyle: 'italic', color: '#888', marginVertical: 5 }}>Sin tarjetas</ThemedText>
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
                    <Button title="Vincular Tarjeta" onPress={handleOpenAssignModal} />
                </View>

                <View style={{ marginTop: 20, marginBottom: 40 }}>
                    <Button title="Eliminar Trabajador" color="red" onPress={async () => {
                        Alert.alert("Confirmar", "Eliminar?", [{ text: "Sí", style: 'destructive', onPress: async () => {
                                await WorkerService.delete(Number(id)); router.back();
                            }}, { text: "No" }]);
                    }} />
                </View>
            </ScrollView>

            {/* Modal RFID */}
            <Modal visible={rfidModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalView}>
                    <ThemedText type="subtitle">Seleccionar Tarjeta</ThemedText>
                    <FlatList
                        data={availableTags}
                        keyExtractor={(item) => item}
                        ListEmptyComponent={<ThemedText style={{margin:10}}>Escanee tarjeta nueva...</ThemedText>}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => handleAssignTag(item)}>
                                <ThemedText>{item}</ThemedText>
                                <IconSymbol name="plus.circle.fill" size={24} color="green" />
                            </TouchableOpacity>
                        )}
                    />
                    <View style={styles.modalButtons}>
                        <Button title="Refrescar" onPress={handleOpenAssignModal} />
                        <Button title="Cerrar" color="red" onPress={() => setRfidModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            {/* Modal Huella Manual */}
            <Modal visible={fpModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalView}>
                    <ThemedText type="subtitle">Asignar ID Manual</ThemedText>
                    <ThemedText style={{fontSize:12, marginBottom:10}}>Solo usar si el registro automático falló y conoce el ID interno del sensor.</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="ID (ej: 12)"
                        keyboardType="numeric"
                        value={manualFpId}
                        onChangeText={setManualFpId}
                    />
                    <View style={styles.modalButtons}>
                        <Button title="Asignar" onPress={handleManualFp} />
                        <Button title="Cancelar" color="red" onPress={() => setFpModalVisible(false)} />
                    </View>
                </View>
            </Modal>

        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
    tagRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5, marginBottom: 5 },
    tagText: { fontFamily: 'monospace' },
    modalView: { margin: 20, marginTop: 100, backgroundColor: 'white', borderRadius: 20, padding: 25, shadowColor: '#000', elevation: 5 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, width: '100%' }
});