import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const MenuOption = ({ title, subtitle, icon, route, iconBgColor = '#0a7ea4' }: {
        title: string;
        subtitle?: string;
        icon: string;
        route: string;
        iconBgColor?: string;
    }) => (
        <TouchableOpacity
            style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(route as any)}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <IconSymbol name={icon as any} size={24} color="white" />
            </View>
            <View style={styles.textContainer}>
                <ThemedText style={styles.optionTitle}>{title}</ThemedText>
                {subtitle && <ThemedText style={styles.optionSubtitle}>{subtitle}</ThemedText>}
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.icon} />
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.headerTitle}>Administración</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Gestión y monitoreo del sistema.</ThemedText>
                </View>

                <View style={styles.menuContainer}>
                    <MenuOption
                        title="Reportes y Logs"
                        subtitle="Ver historial de asistencia y accesos"
                        icon="house.fill"
                        route="/admin/reports"
                        iconBgColor="#0a7ea4"
                    />

                    <MenuOption
                        title="Configuración del Sistema"
                        subtitle="Horarios, tolerancia y mantenimiento"
                        icon="gear"
                        route="/admin/settings"
                        iconBgColor="#6b7280"
                    />
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#888',
    },
    menuContainer: {
        gap: 16,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#888',
    },
});