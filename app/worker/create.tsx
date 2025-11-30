import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Button, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { WorkerService } from '@/src/api/workerService';
import { CreateWorkerRequest } from '@/src/types/worker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CreateWorkerScreen() {
    const { control, handleSubmit, formState: { errors } } = useForm<CreateWorkerRequest>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const onSubmit = async (data: CreateWorkerRequest) => {
        setIsSubmitting(true);
        Alert.alert(
            "Modo Registro Activado",
            "El sensor de huella está activo. Por favor, indique al trabajador que coloque su dedo en el sensor AHORA. (Timeout: 40s)"
        );

        try {
            await WorkerService.create(data);
            Alert.alert("Éxito", "Trabajador creado y huella registrada correctamente.");
            router.back();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Error al crear trabajador o timeout en sensor.";
            Alert.alert("Error", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                <ThemedText type="title" style={styles.header}>Nuevo Trabajador</ThemedText>

                <TextLabel label="Nombre *" />
                <Controller
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Ej: Juan" />
                    )}
                    name="firstName"
                />
                {errors.firstName && <TextError />}

                <TextLabel label="Apellido *" />
                <Controller
                    control={control}
                    rules={{ required: true }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="Ej: Pérez" />
                    )}
                    name="lastName"
                />
                {errors.lastName && <TextError />}

                <TextLabel label="DNI *" />
                <Controller
                    control={control}
                    rules={{ required: true, pattern: /^[0-9]{8}$/ }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="8 dígitos" keyboardType="numeric" />
                    )}
                    name="documentNumber"
                />
                {errors.documentNumber && <TextError text="DNI inválido (8 números)" />}

                <TextLabel label="Email" />
                <Controller
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} placeholder="juan@empresa.com" keyboardType="email-address" autoCapitalize="none" />
                    )}
                    name="email"
                />

                <View style={styles.switchContainer}>
                    <ThemedText>Acceso Restringido</ThemedText>
                    <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Switch value={value} onValueChange={onChange} />
                        )}
                        name="hasRestrictedAreaAccess"
                    />
                </View>

                <View style={styles.footer}>
                    {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0a7ea4" />
                            <ThemedText style={{marginTop: 10, textAlign: 'center'}}>Esperando huella en el dispositivo...</ThemedText>
                        </View>
                    ) : (
                        <Button title="Iniciar Registro Biométrico" onPress={handleSubmit(onSubmit)} color="#0a7ea4" />
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const TextLabel = ({ label }: { label: string }) => (
    <ThemedText style={{ marginBottom: 5, marginTop: 10, fontWeight: '600' }}>{label}</ThemedText>
);

const TextError = ({ text = "Campo requerido" }) => (
    <ThemedText style={{ color: 'red', fontSize: 12 }}>{text}</ThemedText>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20, marginTop: 20 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5
    },
    footer: { marginTop: 30, marginBottom: 50 },
    loadingContainer: { alignItems: 'center' }
});