// app/(tabs)/explore.tsx
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminScreen() {
    const router = useRouter();

    const MenuOption = ({ title, icon, route, color = '#0a7ea4' }: any) => (
        <TouchableOpacity style={styles.option} onPress={() => router.push(route)}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <IconSymbol name={icon} size={28} color={color} />
            </View>
            <View style={styles.textContainer}>
                <ThemedText type="defaultSemiBold">{title}</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080"
                    name="chevron.left.forwardslash.chevron.right"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Administración</ThemedText>
            </ThemedView>

            <ThemedText style={{marginBottom: 20}}>Gestión y monitoreo del sistema.</ThemedText>

            <MenuOption
                title="Reportes y Logs"
                icon="paperplane.fill" // Ojo: asegúrate de mapear iconos útiles en icon-symbol
                route="/admin/reports"
            />

            <MenuOption
                title="Configuración del Sistema"
                icon="gear" // Mapear 'gear' a 'settings' en icon-symbol
                route="/admin/settings"
                color="#f5a623"
            />

        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: { color: '#808080', bottom: -90, left: -35, position: 'absolute' },
    titleContainer: { flexDirection: 'row', gap: 8 },
    option: {
        flexDirection: 'row', alignItems: 'center', padding: 15,
        backgroundColor: '#fff', borderRadius: 12, marginBottom: 15,
        borderWidth: 1, borderColor: '#eee',
        shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, elevation: 1
    },
    iconContainer: { padding: 10, borderRadius: 10, marginRight: 15 },
    textContainer: { flex: 1 }
});