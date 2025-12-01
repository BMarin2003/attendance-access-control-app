import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Platform, Alert, Modal, FlatList, TouchableOpacity, ScrollView, TextInput } from 'react-native';
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

    const [rfidModalVisible, setRfidModalVisible] = useState(false);
    const [fpModalVisible, setFpModalVisible] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [manualFpId, setManualFpId] = useState('');

    // Helper para mostrar alertas compatibles con Web y Móvil
    const showMessage = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const fetchWorker = async () => {
        try {
            const data = await WorkerService.getById(Number(id));
            setWorker(data);
        } catch (error) {
            showMessage("Error", "No se pudo cargar el trabajador");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (id) fetchWorker(); }, [id]);

    const toggleStatus = async () => {
        if (!worker) return;
        try {
            if (worker.status === 'ACTIVE') {
                await WorkerService.deactivate(worker.id);
            } else {
                await WorkerService.activate(worker.id);
            }
            fetchWorker();
        } catch (e) { showMessage("Error", "No se pudo cambiar el estado"); }
    };

    const toggleAccess = async () => {
        if (!worker) return;
        try {
            if (worker.hasRestrictedAreaAccess) {
                await WorkerService.revokeAccess(worker.id);
                showMessage("Éxito", "Acceso revocado");
            } else {
                await WorkerService.grantAccess(worker.id);
                showMessage("Éxito", "Acceso concedido");
            }
            fetchWorker();
        } catch (e) { showMessage("Error", "No se pudo cambiar el permiso"); }
    };

    const handleOpenAssignModal = async () => {
        setRfidModalVisible(true);
        setLoadingTags(true);
        try {
            const tags = await WorkerService.getUnassignedTags();
            setAvailableTags(tags);
        } catch (e) { showMessage("Error", "Fallo al obtener tags"); }
        finally { setLoadingTags(false); }
    };

    const handleAssignTag = async (tag: string) => {
        try {
            await WorkerService.assignRfid(Number(id), tag);
            setRfidModalVisible(false);
            fetchWorker();
        } catch (e: any) { showMessage("Error", e.response?.data?.message || "Error"); }
    };

    // --- CORREGIDO PARA WEB: handleUnlinkTag ---
    const handleUnlinkTag = async (tag: string) => {
        const performUnlink = async () => {
            try {
                await WorkerService.removeRfid(Number(id), tag);
                fetchWorker();
            } catch (e) { showMessage("Error", "No se pudo desvincular"); }
        };

        if (Platform.OS === 'web') {
            // Confirmación nativa del navegador
            if (confirm(`¿Quitar tarjeta ${tag}?`)) {
                performUnlink();
            }
        } else {
            // Alerta nativa de Móvil
            Alert.alert("Desvincular", `¿Quitar tarjeta ${tag}?`, [
                { text: "Cancelar" },
                { text: "Quitar", style: 'destructive', onPress: performUnlink }
            ]);
        }
    };

    const handleManualFp = async () => {
        if (!manualFpId) return;
        try {
            await WorkerService.assignManualFingerprint(Number(id), parseInt(manualFpId));
            setFpModalVisible(false);
            setManualFpId('');
            fetchWorker();
        } catch (e: any) { showMessage("Error", e.response?.data?.message || "Error"); }
    };

    // --- CORREGIDO PARA WEB: handleDeleteWorker ---
    const handleDeleteWorker = async () => {
        const performDelete = async () => {
            try {
                await WorkerService.delete(Number(id));
                router.back();
            } catch (e) {
                showMessage("Error", "No se pudo eliminar");
            }
        };

        if (Platform.OS === 'web') {
            if (confirm("¿Estás seguro de eliminar este trabajador permanentemente?")) {
                performDelete();
            }
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de eliminar este trabajador permanentemente?",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: performDelete }
                ]
            );
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0a7ea4" />;
    if (!worker) return null;

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Encabezado */}
                <View style={styles.headerRow}>
                    <ThemedText type="title" style={{flex: 1}}>{worker.fullName}</ThemedText>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/worker/edit', params: { id: worker.id } } as any)}>
                        <IconSymbol name="square.and.pencil" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                </View>

                {/* Panel de Estado y Accesos */}
                <View style={[styles.card, { borderLeftColor: worker.status === 'ACTIVE' ? 'green' : 'red', borderLeftWidth: 4 }]}>
                    <View style={styles.row}>
                        <ThemedText>Estado: <ThemedText type="defaultSemiBold" style={{color: worker.status === 'ACTIVE'?'green':'red'}}>{worker.status}</ThemedText></ThemedText>
                        <Button
                            title={worker.status === 'ACTIVE' ? "Desactivar" : "Activar"}
                            onPress={toggleStatus}
                            color={worker.status === 'ACTIVE' ? "orange" : "green"}
                        />
                    </View>

                    <View style={[styles.row, {marginTop: 15}]}>
                        <ThemedText>Área Restringida: <ThemedText type="defaultSemiBold">{worker.hasRestrictedAreaAccess ? '✅ SÍ' : '🚫 NO'}</ThemedText></ThemedText>
                        <Button
                            title={worker.hasRestrictedAreaAccess ? "Revocar" : "Conceder"}
                            onPress={toggleAccess}
                            color={worker.hasRestrictedAreaAccess ? "red" : "#0a7ea4"}
                        />
                    </View>
                </View>

                {/* Datos */}
                <View style={styles.card}>
                    <ThemedText type="subtitle" style={styles.cardTitle}>Información</ThemedText>
                    <ThemedText>DNI: {worker.documentNumber}</ThemedText>
                    <ThemedText>Email: {worker.email || '-'}</ThemedText>
                    <ThemedText>Teléfono: {worker.phoneNumber || '-'}</ThemedText>
                </View>

                {/* Biometría */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <ThemedText type="subtitle" style={styles.cardTitle}>Huella Digital</ThemedText>
                        <TouchableOpacity onPress={() => setFpModalVisible(true)}>
                            <ThemedText style={{color:'#0a7ea4', fontSize: 12}}>Manual</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ThemedText>ID Sensor: {worker.fingerprintId ? `#${worker.fingerprintId}` : 'No asignada'}</ThemedText>
                </View>

                {/* RFID */}
                <View style={styles.card}>
                    <ThemedText type="subtitle" style={styles.cardTitle}>Tarjetas RFID</ThemedText>
                    {worker.rfidTags.length === 0 ? (
                        <ThemedText style={{ fontStyle: 'italic', color: '#888', marginVertical: 10 }}>Sin tarjetas</ThemedText>
                    ) : (
                        worker.rfidTags.map(tag => (
                            <View key={tag} style={styles.tagRow}>
                                <ThemedText style={styles.tagText}>{tag}</ThemedText>
                                {/* BOTÓN DESVINCULAR */}
                                <TouchableOpacity onPress={() => handleUnlinkTag(tag)} style={{padding: 5}}>
                                    <IconSymbol name="trash.fill" size={24} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    <Button title="Vincular Tarjeta" onPress={handleOpenAssignModal} />
                </View>

                <View style={{ marginTop: 20 }}>
                    <Button
                        title="Eliminar Trabajador"
                        color="red"
                        onPress={handleDeleteWorker}
                    />
                </View>
            </ScrollView>

            {/* Modal RFID */}
            <Modal visible={rfidModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ThemedText type="subtitle">Tarjetas Disponibles</ThemedText>
                        <ThemedText style={{fontSize: 12, color:'#666', marginBottom: 10, textAlign:'center'}}>
                            Escanea una tarjeta nueva y presiona refrescar.
                        </ThemedText>

                        {loadingTags ? <ActivityIndicator size="large" color="#0a7ea4" /> : (
                            <FlatList
                                data={availableTags}
                                keyExtractor={(item) => item}
                                style={{maxHeight: 200, width: '100%'}}
                                ListEmptyComponent={<ThemedText style={{textAlign:'center', margin:20, color:'#999'}}>No se encontraron tarjetas.</ThemedText>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.modalItem} onPress={() => handleAssignTag(item)}>
                                        <ThemedText style={{fontFamily:'monospace'}}>{item}</ThemedText>
                                        <IconSymbol name="plus.circle.fill" size={24} color="green" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                        <View style={styles.modalButtons}>
                            <Button title="Refrescar" onPress={handleOpenAssignModal} />
                            <Button title="Cerrar" color="red" onPress={() => setRfidModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Huella Manual */}
            <Modal visible={fpModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <ThemedText type="subtitle">Huella Manual</ThemedText>
                        <TextInput style={styles.input} placeholder="ID (0-127)" keyboardType="numeric" value={manualFpId} onChangeText={setManualFpId} />
                        <View style={styles.modalButtons}>
                            <Button title="Guardar" onPress={handleManualFp} />
                            <Button title="Cancelar" color="red" onPress={() => setFpModalVisible(false)} />
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardTitle: { marginBottom: 10, fontSize: 16, fontWeight: 'bold' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f8f9fa', borderRadius: 5, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
    tagText: { fontFamily: 'monospace', fontWeight: 'bold', color: '#333' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalView: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderColor: '#eee', width: '100%' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%', gap: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, width: '100%', marginTop: 15, textAlign: 'center' }
});