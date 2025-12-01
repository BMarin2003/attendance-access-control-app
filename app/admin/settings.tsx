import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, Button, Alert, ActivityIndicator, View, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { ConfigService } from '@/src/api/configService';
import { UpdateConfigRequest } from '@/src/types/config';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
    const { control, handleSubmit, setValue, watch } = useForm<UpdateConfigRequest & { simulationMode: boolean, simulatedDateTime: string }>();
    const [loading, setLoading] = useState(true);

    // Cargar configuración
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
            // 1. Guardar config normal
            await ConfigService.update({
                workStartTime: data.workStartTime,
                workEndTime: data.workEndTime,
                lateThresholdMinutes: parseInt(data.lateThresholdMinutes)
            });

            // 2. Manejar Simulación
            if (data.simulationMode) {
                const simTime = data.simulatedDateTime || new Date().toISOString().split('.')[0];
                await ConfigService.enableSimulation(simTime);
            } else {
                await ConfigService.disableSimulation();
            }

            Alert.alert("Éxito", "Configuración actualizada");
            loadConfig(); // Recargar para confirmar estado
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
            <ScrollView>
                <ThemedText type="title" style={styles.header}>Sistema</ThemedText>

                {/* Horarios */}
                <ThemedText style={styles.label}>Hora Entrada (HH:mm:ss)</ThemedText>
                <Controller control={control} name="workStartTime" render={({field:{onChange,value}})=>(
                    <TextInput style={styles.input} value={value} onChangeText={onChange} />
                )} />

                <ThemedText style={styles.label}>Hora Salida (HH:mm:ss)</ThemedText>
                <Controller control={control} name="workEndTime" render={({field:{onChange,value}})=>(
                    <TextInput style={styles.input} value={value} onChangeText={onChange} />
                )} />

                <ThemedText style={styles.label}>Tolerancia (min)</ThemedText>
                <Controller control={control} name="lateThresholdMinutes" render={({field:{onChange,value}})=>(
                    <TextInput style={styles.input} value={value?.toString()} onChangeText={onChange} keyboardType="numeric" />
                )} />

                {/* Simulación */}
                <View style={styles.box}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                        <ThemedText type="defaultSemiBold">Modo Simulación</ThemedText>
                        <Controller control={control} name="simulationMode" render={({field:{onChange,value}})=>(
                            <Switch value={value} onValueChange={onChange} />
                        )} />
                    </View>
                    {watch('simulationMode') && (
                        <>
                            <ThemedText style={{fontSize:12, marginTop:5}}>Fecha/Hora Simulada (ISO-8601)</ThemedText>
                            <Controller control={control} name="simulatedDateTime" render={({field:{onChange,value}})=>(
                                <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder="2025-10-31T08:15:00" />
                            )} />
                        </>
                    )}
                </View>

                <Button title="Guardar Todo" onPress={handleSubmit(onSave)} color="#0a7ea4" />

                <View style={styles.divider} />

                {/* Mantenimiento */}
                <ThemedText type="subtitle" style={{marginBottom: 10}}>Mantenimiento</ThemedText>
                <View style={{gap: 10}}>
                    <Button title="Diagnóstico Firebase" onPress={handleDiagnose} color="purple" />
                    <Button title="Limpiar Comandos" onPress={() => ConfigService.clearCommand()} color="orange" />
                    <Button title="FORMATEAR SENSOR" onPress={handleFormat} color="red" />
                </View>

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginVertical: 20 },
    label: { marginBottom: 5, fontWeight: '600' },
    input: { backgroundColor: 'white', padding: 10, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    box: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#ccc', marginVertical: 30 }
});