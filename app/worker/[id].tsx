import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkerService } from '@/src/api/workerService';
import { Worker } from '@/src/types/worker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function WorkerDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [worker, setWorker] = useState<Worker | null>(null);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const [rfidModalVisible, setRfidModalVisible] = useState(false);
    const [fpModalVisible, setFpModalVisible] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const [manualFpId, setManualFpId] = useState('');

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

    // SE ELIMINÓ toggleStatus y toggleAccess

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

    const handleUnlinkTag = async (tag: string) => {
        const performUnlink = async () => {
            try {
                await WorkerService.removeRfid(Number(id), tag);
                fetchWorker();
            } catch (e) { showMessage("Error", "No se pudo desvincular"); }
        };

        if (Platform.OS === 'web') {
            if (confirm(`¿Quitar tarjeta ${tag}?`)) {
                performUnlink();
            }
        } else {
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Detalle del Trabajador</ThemedText>
                <TouchableOpacity onPress={() => router.push({ pathname: '/worker/edit', params: { id: worker.id } } as any)}>
                    <IconSymbol name="square.and.pencil" size={22} color="#0a7ea4" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.workerName}>{worker.fullName}</ThemedText>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText style={styles.sectionTitle}>Información Personal</ThemedText>
                    <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>DNI</ThemedText>
                        <ThemedText style={styles.infoValue}>{worker.documentNumber}</ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>Email</ThemedText>
                        <ThemedText style={styles.infoValue}>{worker.email || '-'}</ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemedText style={styles.infoLabel}>Teléfono</ThemedText>
                        <ThemedText style={styles.infoValue}>{worker.phoneNumber || '-'}</ThemedText>
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Huella Digital</ThemedText>
                        <TouchableOpacity onPress={() => setFpModalVisible(true)}>
                            <ThemedText style={styles.linkText}>Manual</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={styles.infoValue}>
                        ID Sensor: {worker.fingerprintId ? `#${worker.fingerprintId}` : 'No asignada'}
                    </ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ThemedText style={styles.sectionTitle}>Tarjetas RFID</ThemedText>
                    {worker.rfidTags.length === 0 ? (
                        <ThemedText style={styles.emptyText}>Sin tarjetas vinculadas</ThemedText>
                    ) : (
                        worker.rfidTags.map(tag => (
                            <View key={tag} style={[styles.tagRow, { borderColor: colors.border }]}>
                                <ThemedText style={styles.tagText}>{tag}</ThemedText>
                                <TouchableOpacity onPress={() => handleUnlinkTag(tag)} style={styles.tagDeleteButton}>
                                    <IconSymbol name="trash.fill" size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    <TouchableOpacity style={styles.linkButton} onPress={handleOpenAssignModal}>
                        <ThemedText style={styles.linkButtonText}>+ Vincular Tarjeta</ThemedText>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteWorker}>
                    <ThemedText style={styles.deleteButtonText}>Eliminar Trabajador</ThemedText>
                </TouchableOpacity>
            </ScrollView>

            {/* Modales se mantienen igual */}
            <Modal visible={rfidModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>Tarjetas Disponibles</ThemedText>
                        <ThemedText style={styles.modalSubtitle}>
                            Escanea una tarjeta nueva y presiona refrescar.
                        </ThemedText>

                        {loadingTags ? <ActivityIndicator size="large" color="#0a7ea4" /> : (
                            <FlatList
                                data={availableTags}
                                keyExtractor={(item) => item}
                                style={styles.modalList}
                                ListEmptyComponent={<ThemedText style={styles.modalEmpty}>No se encontraron tarjetas.</ThemedText>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={[styles.modalItem, { borderColor: colors.border }]} onPress={() => handleAssignTag(item)}>
                                        <ThemedText style={styles.modalItemText}>{item}</ThemedText>
                                        <IconSymbol name="plus.circle.fill" size={24} color="#22c55e" />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.primaryButton]} onPress={handleOpenAssignModal}>
                                <ThemedText style={styles.modalButtonText}>Refrescar</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.dangerButton]} onPress={() => setRfidModalVisible(false)}>
                                <ThemedText style={styles.modalButtonText}>Cerrar</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={fpModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>Huella Manual</ThemedText>
                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                            placeholder="ID (0-127)"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={manualFpId}
                            onChangeText={setManualFpId}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.primaryButton]} onPress={handleManualFp}>
                                <ThemedText style={styles.modalButtonText}>Guardar</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.dangerButton]} onPress={() => setFpModalVisible(false)}>
                                <ThemedText style={styles.modalButtonText}>Cancelar</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    workerName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    cardRowBorder: {
        borderTopWidth: 1,
        borderTopColor: '#3a3a3a',
        marginTop: 12,
        paddingTop: 16,
    },
    cardLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 15,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
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
        fontSize: 13,
        fontWeight: '600',
    },
    // Estilos de botones de acción eliminados ya que no se usan
    primaryButton: {
        backgroundColor: '#0a7ea4',
    },
    dangerButton: {
        backgroundColor: '#ef4444',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    linkText: {
        color: '#0a7ea4',
        fontSize: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        color: '#888',
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
    },
    emptyText: {
        fontStyle: 'italic',
        color: '#888',
        marginBottom: 12,
    },
    tagRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    tagText: {
        fontFamily: 'monospace',
        fontWeight: '600',
    },
    tagDeleteButton: {
        padding: 4,
    },
    linkButton: {
        marginTop: 8,
    },
    linkButtonText: {
        color: '#0a7ea4',
        fontWeight: '600',
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#ef4444',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    deleteButtonText: {
        color: '#ef4444',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '85%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalList: {
        maxHeight: 200,
        width: '100%',
    },
    modalEmpty: {
        textAlign: 'center',
        margin: 20,
        color: '#888',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontFamily: 'monospace',
    },
    modalInput: {
        borderWidth: 1,
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginTop: 8,
        textAlign: 'center',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '600',
    },
});