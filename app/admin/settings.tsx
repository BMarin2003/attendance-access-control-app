import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ConfigService } from '@/src/api/configService';
import { SystemConfig } from '@/src/types/config';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [tolerance, setTolerance] = useState('');
    const [simMode, setSimMode] = useState(false);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await ConfigService.getConfig();
            setConfig(data);
            setStartTime(data.workStartTime);
            setEndTime(data.workEndTime);
            setTolerance(data.lateThresholdMinutes.toString());
            setSimMode(data.simulationMode);
        } catch (e: any) {
            if (e.response?.status === 404) {
                setConfig(null);
            } else {
                Alert.alert("Error", "No se pudo cargar la configuración");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadConfig(); }, []);

    const handleInitialize = async () => {
        setSaving(true);
        try {
            await ConfigService.initializeConfig();
            Alert.alert("Éxito", "Sistema inicializado correctamente con valores por defecto.");
            loadConfig();
        } catch (e) {
            Alert.alert("Error", "No se pudo inicializar el sistema.");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await ConfigService.updateConfig({
                workStartTime: startTime,
                workEndTime: endTime,
                lateThresholdMinutes: parseInt(tolerance),
                simulationMode: simMode
            });
            Alert.alert("Éxito", "Configuración actualizada correctamente");
            loadConfig();
        } catch (e) {
            Alert.alert("Error", "Revise el formato de horas (HH:mm:ss)");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0a7ea4" />;

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedText type="title" style={styles.header}>Configuración</ThemedText>

                {!config ? (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center' }]}>
                        <ThemedText style={styles.initTitle}>Sistema Nuevo detectado</ThemedText>
                        <ThemedText style={styles.initText}>
                            No se encontró ninguna configuración activa. Es necesario inicializar el sistema para comenzar a registrar asistencias.
                        </ThemedText>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleInitialize} disabled={saving}>
                            {saving ? <ActivityIndicator color="white" /> : <ThemedText style={styles.buttonText}>Inicializar Sistema Ahora</ThemedText>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>Jornada Laboral</ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Hora Entrada (HH:mm:ss)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="08:00:00"
                                    placeholderTextColor="#888"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Hora Salida (HH:mm:ss)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="17:00:00"
                                    placeholderTextColor="#888"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.label}>Tolerancia (minutos)</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                    value={tolerance}
                                    onChangeText={setTolerance}
                                    keyboardType="numeric"
                                    placeholderTextColor="#888"
                                />
                            </View>

                            <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator color="white" /> : <ThemedText style={styles.buttonText}>Guardar Cambios</ThemedText>}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 20, marginTop: 40 },
    card: {
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    initTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    initText: {
        marginBottom: 24,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: { marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { marginBottom: 6, fontSize: 13, color: '#888', fontWeight: '500' },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});