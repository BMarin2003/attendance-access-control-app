import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Button, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkerService } from '@/src/api/workerService';
import { UpdateWorkerRequest } from '@/src/types/worker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function EditWorkerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<UpdateWorkerRequest>();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadWorker = async () => {
            try {
                const worker = await WorkerService.getById(Number(id));
                setValue('firstName', worker.firstName);
                setValue('lastName', worker.lastName);
                setValue('email', worker.email || '');
                setValue('phoneNumber', worker.phoneNumber || '');
                setValue('hasRestrictedAreaAccess', worker.hasRestrictedAreaAccess);
            } catch (error) {
                Alert.alert("Error", "No se pudo cargar la información del trabajador");
                router.back();
            } finally {
                setLoading(false);
            }
        };
        if (id) loadWorker();
    }, [id]);

    const onSubmit = async (data: UpdateWorkerRequest) => {
        setIsSubmitting(true);
        try {
            await WorkerService.update(Number(id), data);
            Alert.alert("Éxito", "Trabajador actualizado correctamente");
            router.back();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Error al actualizar";
            Alert.alert("Error", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0a7ea4" />;

    return (
        <ThemedView style={styles.container}>
            <ScrollView>
                <ThemedText type="title" style={styles.header}>Editar Trabajador</ThemedText>

                <TextLabel label="Nombre" />
                <Controller
                    control={control}
                    rules={{ required: true, minLength: 2 }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} />
                    )}
                    name="firstName"
                />
                {errors.firstName && <TextError />}

                <TextLabel label="Apellido" />
                <Controller
                    control={control}
                    rules={{ required: true, minLength: 2 }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} />
                    )}
                    name="lastName"
                />
                {errors.lastName && <TextError />}

                <TextLabel label="Email" />
                <Controller
                    control={control}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} keyboardType="email-address" autoCapitalize="none" />
                    )}
                    name="email"
                />

                <TextLabel label="Teléfono" />
                <Controller
                    control={control}
                    rules={{ pattern: /^[0-9]{9}$/ }}
                    render={({ field: { onChange, value } }) => (
                        <TextInput style={styles.input} onChangeText={onChange} value={value} keyboardType="phone-pad" maxLength={9} />
                    )}
                    name="phoneNumber"
                />
                {errors.phoneNumber && <TextError text="Teléfono inválido (9 dígitos)" />}

                <View style={styles.switchContainer}>
                    <ThemedText>Acceso a Áreas Restringidas</ThemedText>
                    <Controller
                        control={control}
                        render={({ field: { onChange, value } }) => (
                            <Switch
                                value={value}
                                onValueChange={onChange}
                                trackColor={{ false: "#767577", true: "#0a7ea4" }}
                            />
                        )}
                        name="hasRestrictedAreaAccess"
                    />
                </View>

                <View style={styles.footer}>
                    {isSubmitting ? (
                        <ActivityIndicator size="large" color="#0a7ea4" />
                    ) : (
                        <Button title="Guardar Cambios" onPress={handleSubmit(onSubmit)} color="#0a7ea4" />
                    )}
                    <View style={{ marginTop: 10 }}>
                        <Button title="Cancelar" onPress={() => router.back()} color="#666" />
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const TextLabel = ({ label }: { label: string }) => (
    <ThemedText style={{ marginBottom: 5, marginTop: 15, fontWeight: '600' }}>{label}</ThemedText>
);

const TextError = ({ text = "Campo requerido" }) => (
    <ThemedText style={{ color: 'red', fontSize: 12 }}>{text}</ThemedText>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { marginBottom: 20, marginTop: 10 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 25,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 8
    },
    footer: { marginTop: 20, marginBottom: 50 }
});