import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WorkerService } from '@/src/api/workerService';
import { CreateWorkerRequest } from '@/src/types/worker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, TextInput, TouchableOpacity, View } from 'react-native';

// Regex patterns
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,50}$/;
const DNI_REGEX = /^[0-9]{8}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// Helpers de validación
const sanitizeText = (text: string | undefined) => {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
};

const validateName = (value: string | undefined) => {
    if (!value) return 'Campo requerido';
    const sanitized = sanitizeText(value);
    if (sanitized.length < 2) return 'Mínimo 2 caracteres';
    if (sanitized.length > 50) return 'Máximo 50 caracteres';
    if (!NAME_REGEX.test(sanitized)) return 'Solo letras y espacios';
    if (value !== sanitized) return 'No usar espacios al inicio/final';
    return true;
};

const validateDNI = (value: string | undefined) => {
    if (!value) return 'Campo requerido';
    if (value.includes(' ')) return 'No se permiten espacios';
    if (!DNI_REGEX.test(value)) return 'Debe tener exactamente 8 dígitos';
    return true;
};

const validateEmail = (value: string | undefined) => {
    if (!value) return 'Campo requerido';
    if (value.includes(' ')) return 'No se permiten espacios';
    if (value.length > 100) return 'Máximo 100 caracteres';
    if (!EMAIL_REGEX.test(value)) return 'Email inválido';
    return true;
};

export default function CreateWorkerScreen() {
    const { control, handleSubmit, formState: { errors, isValid }, watch } = useForm<CreateWorkerRequest>({
        mode: 'onChange', // Validación en tiempo real
        defaultValues: {
            firstName: '',
            lastName: '',
            documentNumber: '',
            email: '',
            hasRestrictedAreaAccess: false,
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const onSubmit = async (data: CreateWorkerRequest) => {
        // Sanitizar datos antes de enviar
        const sanitizedData = {
            ...data,
            firstName: sanitizeText(data.firstName),
            lastName: sanitizeText(data.lastName),
            email: data.email?.toLowerCase().trim() || '',
            documentNumber: data.documentNumber.trim(),
        };

        setIsSubmitting(true);
        
        if (sanitizedData.hasRestrictedAreaAccess) {
            Alert.alert(
                "Modo Registro Activado",
                "El sensor de huella está activo. Por favor, indique al trabajador que coloque su dedo en el sensor AHORA. (Timeout: 40s)"
            );
        }

        try {
            await WorkerService.create(sanitizedData);
            Alert.alert("Éxito", "Trabajador creado correctamente.");
            router.back();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Error al crear trabajador.";
            Alert.alert("Error", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getErrorMessage = (field: keyof typeof errors) => {
        const error = errors[field];
        if (!error) return null;
        return typeof error.message === 'string' ? error.message : 'Campo inválido';
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formSection}>
                    <ThemedText style={styles.label}>Nombre *</ThemedText>
                    <Controller
                        control={control}
                        rules={{ validate: validateName }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[
                                    styles.input, 
                                    { backgroundColor: colors.inputBg, borderColor: errors.firstName ? '#ef4444' : colors.inputBorder, color: colors.text }
                                ]}
                                onChangeText={onChange}
                                value={value}
                                placeholder="Ej: Juan"
                                placeholderTextColor="#888"
                                maxLength={50}
                                autoCapitalize="words"
                            />
                        )}
                        name="firstName"
                    />
                    {errors.firstName && <ThemedText style={styles.errorText}>{getErrorMessage('firstName')}</ThemedText>}

                    <ThemedText style={styles.label}>Apellido *</ThemedText>
                    <Controller
                        control={control}
                        rules={{ validate: validateName }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[
                                    styles.input, 
                                    { backgroundColor: colors.inputBg, borderColor: errors.lastName ? '#ef4444' : colors.inputBorder, color: colors.text }
                                ]}
                                onChangeText={onChange}
                                value={value}
                                placeholder="Ej: Pérez"
                                placeholderTextColor="#888"
                                maxLength={50}
                                autoCapitalize="words"
                            />
                        )}
                        name="lastName"
                    />
                    {errors.lastName && <ThemedText style={styles.errorText}>{getErrorMessage('lastName')}</ThemedText>}

                    <ThemedText style={styles.label}>DNI *</ThemedText>
                    <Controller
                        control={control}
                        rules={{ validate: validateDNI }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[
                                    styles.input, 
                                    { backgroundColor: colors.inputBg, borderColor: errors.documentNumber ? '#ef4444' : colors.inputBorder, color: colors.text }
                                ]}
                                onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ''))}
                                value={value}
                                placeholder="8 dígitos"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                                maxLength={8}
                            />
                        )}
                        name="documentNumber"
                    />
                    {errors.documentNumber && <ThemedText style={styles.errorText}>{getErrorMessage('documentNumber')}</ThemedText>}

                    <ThemedText style={styles.label}>Email *</ThemedText>
                    <Controller
                        control={control}
                        rules={{ validate: validateEmail }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[
                                    styles.input, 
                                    { backgroundColor: colors.inputBg, borderColor: errors.email ? '#ef4444' : colors.inputBorder, color: colors.text }
                                ]}
                                onChangeText={(text) => onChange(text.toLowerCase())}
                                value={value}
                                placeholder="juan@empresa.com"
                                placeholderTextColor="#888"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={100}
                            />
                        )}
                        name="email"
                    />
                    {errors.email && <ThemedText style={styles.errorText}>{getErrorMessage('email')}</ThemedText>}

                    <View style={[styles.switchContainer, { backgroundColor: colors.card }]}>
                        <ThemedText style={styles.switchLabel}>Habilitar Registro Biométrico</ThemedText>
                        <Controller
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Switch
                                    value={value}
                                    onValueChange={onChange}
                                    trackColor={{ false: '#3a3a3a', true: '#0a7ea4' }}
                                    thumbColor={value ? '#fff' : '#888'}
                                />
                            )}
                            name="hasRestrictedAreaAccess"
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#0a7ea4" />
                            <ThemedText style={styles.loadingText}>
                                {watch('hasRestrictedAreaAccess') 
                                    ? 'Esperando huella en el dispositivo...' 
                                    : 'Registrando trabajador...'}
                            </ThemedText>
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.submitButton, !isValid && styles.submitButtonDisabled]} 
                            onPress={handleSubmit(onSubmit)}
                            disabled={!isValid}
                        >
                            <ThemedText style={styles.submitButtonText}>REGISTRAR TRABAJADOR</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    formSection: {
        gap: 2,
        marginTop: 16,
    },
    label: {
        fontSize: 13,
        color: '#888',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        padding: 14,
        borderRadius: 12,
    },
    switchLabel: {
        fontSize: 15,
    },
    footer: {
        marginTop: 24,
        marginBottom: 30,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        textAlign: 'center',
        color: '#888',
    },
    submitButton: {
        backgroundColor: '#0a7ea4',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#4a5568',
        opacity: 0.6,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});