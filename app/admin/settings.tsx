import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ConfigService } from '@/src/api/configService';
import { UpdateConfigRequest } from '@/src/types/config';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const { control, handleSubmit, setValue, watch } = useForm<UpdateConfigRequest & { simulationMode: boolean, simulatedDateTime: string }>();
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const loadConfig = async () => {
        try {
            const config = await ConfigService.get();
            setValue('workStartTime', config.workStartTime);
            setValue('workEndTime', config.workEndTime);
            setValue('lateThresholdMinutes', config.lateThresholdMinutes as any);
            setValue('simulationMode', config.simulationMode);
            if (config.simulatedDateTime) setValue('simulatedDateTime', config.simulatedDateTime);
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadConfig(); }, []);

    const onSave = async (data: any) => {
        try {
            await ConfigService.update({
                workStartTime: data.workStartTime,
                workEndTime: data.workEndTime,
                lateThresholdMinutes: parseInt(data.lateThresholdMinutes)
            });

            if (data.simulationMode) {
                const simTime = data.simulatedDateTime || new Date().toISOString().split('.')[0];
                await ConfigService.enableSimulation(simTime);
            } else {
                await ConfigService.disableSimulation();
            }

            Alert.alert("Éxito", "Configuración actualizada");
            loadConfig();
        } catch (e) { Alert.alert("Error", "Fallo al guardar"); }
    };

    const handleDiagnose = async () => {
        try {
            const res = await ConfigService.diagnose();
            Alert.alert("Diagnóstico", JSON.stringify(res.data, null, 2));
        } catch(e) { Alert.alert("Error", "Falló diagnóstico"); }
    };

    const handleFormat = () => {
        Alert.alert("PELIGRO", "Se borrarán TODAS las huellas del sensor. ¿Seguro?", [
            { text: "Cancelar" },
            { text: "BORRAR", style: 'destructive', onPress: async () => {
                    try { await ConfigService.formatSensor(); Alert.alert("Enviado", "Formateando..."); }
                    catch(e) { Alert.alert("Error"); }
                }}
        ]);
    };

    if (loading) return <ActivityIndicator style={{flex:1}} />;

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Sistema</ThemedText>

                    <ThemedText style={styles.label}>Hora Entrada (HH:mm:ss)</ThemedText>
                    <Controller control={control} name="workStartTime" render={({field:{onChange,value}})=>(
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                            value={value}
                            onChangeText={onChange}
                            placeholderTextColor="#888"
                        />
                    )} />

                    <ThemedText style={styles.label}>Hora Salida (HH:mm:ss)</ThemedText>
                    <Controller control={control} name="workEndTime" render={({field:{onChange,value}})=>(
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                            value={value}
                            onChangeText={onChange}
                            placeholderTextColor="#888"
                        />
                    )} />

                    <ThemedText style={styles.label}>Tolerancia (min)</ThemedText>
                    <Controller control={control} name="lateThresholdMinutes" render={({field:{onChange,value}})=>(
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                            value={value?.toString()}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            placeholderTextColor="#888"
                        />
                    )} />

                    <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
                        <ThemedText style={styles.switchLabel}>Modo Simulación</ThemedText>
                        <Controller control={control} name="simulationMode" render={({field:{onChange,value}})=>(
                            <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{ false: '#3a3a3a', true: '#0a7ea4' }}
                                thumbColor={value ? '#fff' : '#888'}
                            />
                        )} />
                    </View>

                    {watch('simulationMode') && (
                        <>
                            <ThemedText style={styles.label}>Fecha/Hora Simulada (ISO-8601)</ThemedText>
                            <Controller control={control} name="simulatedDateTime" render={({field:{onChange,value}})=>(
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="2025-10-31T08:15:00"
                                    placeholderTextColor="#888"
                                />
                            )} />
                        </>
                    )}

                    <TouchableOpacity style={styles.saveButton} onPress={handleSubmit(onSave)}>
                        <ThemedText style={styles.saveButtonText}>GUARDAR TODO</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Mantenimiento</ThemedText>

                    <TouchableOpacity style={[styles.maintenanceButton, { backgroundColor: '#8b5cf6' }]} onPress={handleDiagnose}>
                        <ThemedText style={styles.maintenanceButtonText}>DIAGNÓSTICO FIREBASE</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.maintenanceButton, { backgroundColor: '#f97316' }]} onPress={() => ConfigService.clearCommand()}>
                        <ThemedText style={styles.maintenanceButtonText}>LIMPIAR COMANDOS</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.maintenanceButton, { backgroundColor: '#ef4444' }]} onPress={handleFormat}>
                        <ThemedText style={styles.maintenanceButtonText}>FORMATEAR SENSOR</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        color: '#888',
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    label: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        marginBottom: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    switchLabel: {
        fontSize: 15,
    },
    saveButton: {
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    maintenanceButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    maintenanceButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
});