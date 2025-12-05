import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ReportService } from '@/src/api/reportService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

type ReportType = 'ATTENDANCE' | 'ACCESS' | 'SECURITY';
type SortOrder = 'ASC' | 'DESC';

export default function ReportsScreen() {
    const [type, setType] = useState<ReportType>('ATTENDANCE');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const [sort, setSort] = useState<SortOrder>('DESC');
    const [accessFilter, setAccessFilter] = useState<string>('ALL');
    const [securityFilter, setSecurityFilter] = useState<string>('ALL');
    const [attendanceFilter, setAttendanceFilter] = useState<string>('ALL');

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

    const getFormattedDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        setLoading(true);
        setData([]);

        const now = new Date();
        const endIso = now.toISOString();
        const endDateStr = getFormattedDate(now);

        const start = new Date();
        start.setDate(start.getDate() - 7);
        const startIso = start.toISOString();
        const startDateStr = getFormattedDate(start);

        try {
            if (type === 'ATTENDANCE') {
                const res = await ReportService.getAttendanceHistory(startDateStr, endDateStr, attendanceFilter, sort);
                setData(res);
            } else if (type === 'ACCESS') {
                const res = await ReportService.getRecentAccessLogs(startIso, endIso, accessFilter, sort);
                setData(res);
            } else {
                // SECURITY: Usamos securityFilter que ahora mapea a severity (ACCESS/ATTENDANCE)
                const res = await ReportService.getSecurityLogs(startIso, endIso, securityFilter, sort);
                setData(res);
            }
        } catch (e) {
            console.error("Error fetching reports:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [type, sort, accessFilter, securityFilter, attendanceFilter]);

    const formatTime = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });
    };

    const toggleSort = () => { setSort(prev => prev === 'DESC' ? 'ASC' : 'DESC'); };

    const FilterChip = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.chip,
                { borderColor: active ? '#0a7ea4' : colors.border, backgroundColor: active ? '#0a7ea4' : 'transparent' }
            ]}
        >
            <ThemedText style={[styles.chipText, { color: active ? 'white' : '#888' }]}>{label}</ThemedText>
        </TouchableOpacity>
    );

    const renderHeaderControls = () => (
        <View style={styles.controlsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingRight: 20}}>
                {type === 'ATTENDANCE' && (
                    <>
                        <FilterChip label="Todos" active={attendanceFilter === 'ALL'} onPress={() => setAttendanceFilter('ALL')} />
                        <FilterChip label="Tardanzas" active={attendanceFilter === 'LATE'} onPress={() => setAttendanceFilter('LATE')} />
                        <FilterChip label="Puntuales" active={attendanceFilter === 'ON_TIME'} onPress={() => setAttendanceFilter('ON_TIME')} />
                    </>
                )}
                {type === 'ACCESS' && (
                    <>
                        <FilterChip label="Todos" active={accessFilter === 'ALL'} onPress={() => setAccessFilter('ALL')} />
                        <FilterChip label="Permitidos" active={accessFilter === 'GRANTED'} onPress={() => setAccessFilter('GRANTED')} />
                        <FilterChip label="Denegados" active={accessFilter === 'DENIED'} onPress={() => setAccessFilter('DENIED')} />
                    </>
                )}
                {type === 'SECURITY' && (
                    <>
                        <FilterChip label="Todas" active={securityFilter === 'ALL'} onPress={() => setSecurityFilter('ALL')} />
                        <FilterChip label="Acceso" active={securityFilter === 'ACCESS'} onPress={() => setSecurityFilter('ACCESS')} />
                        <FilterChip label="Asistencia" active={securityFilter === 'ATTENDANCE'} onPress={() => setSecurityFilter('ATTENDANCE')} />
                    </>
                )}
            </ScrollView>

            <View style={styles.sortRow}>
                <ThemedText style={{fontSize: 12, color: '#888', fontStyle:'italic'}}>Últimos 7 días</ThemedText>
                <TouchableOpacity onPress={toggleSort} style={[styles.sortButton, { backgroundColor: colors.card }]}>
                    <ThemedText style={{fontSize: 12}}>{sort === 'DESC' ? '⬇ Recientes' : '⬆ Antiguos'}</ThemedText>
                    <IconSymbol name="chevron.right" size={12} color={colors.text} style={{transform: [{rotate: '90deg'}]}} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const itemNumber = sort === 'DESC' ? data.length - index : index + 1;

        if (type === 'ATTENDANCE') {
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: '#0a7ea4' }]}>
                            <ThemedText style={styles.cardIconText}>A</ThemedText>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardTitle}>{item.workerFullName}</ThemedText>
                            <ThemedText style={styles.cardSub}>{item.rfidTag || 'Sin Tag'}</ThemedText>
                        </View>
                        <ThemedText style={styles.timeText}>{formatTime(item.checkInTime)}</ThemedText>
                    </View>
                    <View style={styles.footerRow}>
                        <ThemedText style={{fontSize: 12, color: '#888'}}>#{itemNumber}</ThemedText>
                        <View style={[styles.statusBadge, item.isLate ? styles.lateBadge : styles.onTimeBadge]}>
                            <ThemedText style={styles.statusBadgeText}>{item.isLate ? `⏱ Tardanza (${item.latenessDuration})` : '✓ Puntual'}</ThemedText>
                        </View>
                    </View>
                </View>
            );
        } else if (type === 'ACCESS') {
            const isGranted = item.status === 'GRANTED';
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: isGranted ? '#22c55e' : '#ef4444' }]}>
                            <IconSymbol name={isGranted ? 'plus.circle.fill' : 'trash.fill'} size={20} color="white" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardTitle}>{item.workerFullName || 'Desconocido'}</ThemedText>
                            <ThemedText style={styles.cardSub}>ID Huella: {item.fingerprintId}</ThemedText>
                        </View>
                        <ThemedText style={styles.timeText}>{formatTime(item.accessTime)}</ThemedText>
                    </View>
                    <View style={styles.footerRow}>
                        <ThemedText style={{fontSize: 12, color: '#888'}}>#{itemNumber}</ThemedText>
                        <View style={[styles.statusBadge, isGranted ? styles.grantedBadge : styles.deniedBadge]}>
                            <ThemedText style={styles.statusBadgeText}>{isGranted ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}</ThemedText>
                        </View>
                    </View>
                </View>
            );
        } else {
            // SECURITY - Ahora leemos severity que trae "ACCESS" o "ATTENDANCE"
            const isAccess = item.severity === 'ACCESS';
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: isAccess ? '#ef4444' : '#f59e0b' }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardType}>{item.eventType}</ThemedText>
                            <ThemedText style={styles.cardTitle}>{item.description}</ThemedText>
                        </View>
                        <ThemedText style={styles.timeText}>{formatTime(item.eventTime)}</ThemedText>
                    </View>
                    <View style={styles.footerRow}>
                        <ThemedText style={{fontSize: 12, color: '#888'}}>#{itemNumber}</ThemedText>
                        <View style={[styles.statusBadge, {backgroundColor: isAccess ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}]}>
                            <ThemedText style={[styles.statusBadgeText, {color: isAccess ? '#ef4444' : '#f59e0b'}]}>
                                {item.severity === 'ACCESS' ? '🚨 ALERTA DE ACCESO' : '⚠ ALERTA DE ASISTENCIA'}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.tabs, { backgroundColor: colors.card }]}>
                {(['ATTENDANCE', 'ACCESS', 'SECURITY'] as ReportType[]).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, type === t && styles.activeTab]} onPress={() => { setType(t); }}>
                        <ThemedText style={[styles.tabText, type === t && styles.activeTabText]}>{t === 'ATTENDANCE' ? 'Asistencia' : t === 'ACCESS' ? 'Accesos' : 'Alertas'}</ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            {renderHeaderControls()}
            <View style={styles.countContainer}><ThemedText style={styles.countText}>Registros encontrados: {data.length}</ThemedText></View>
            {loading ? <ActivityIndicator style={styles.loader} size="large" color="#0a7ea4" /> : <FlatList data={data} keyExtractor={(item) => item.id.toString()} renderItem={renderItem} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.text} />} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.emptyContainer}><ThemedText style={styles.emptyText}>No hay registros.</ThemedText></View>} />}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#0a7ea4' },
    tabText: { fontWeight: '600', fontSize: 13, color: '#888' },
    activeTabText: { color: 'white' },
    controlsContainer: { marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 12, fontWeight: '500' },
    sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    sortButton: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 6, gap: 4 },
    countContainer: { marginBottom: 8, alignItems: 'flex-end' },
    countText: { fontSize: 11, color: '#888' },
    listContent: { paddingBottom: 30 },
    loader: { marginTop: 50 },
    card: { padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    cardIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    cardIconText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    cardHeaderText: { flex: 1 },
    cardType: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 2 },
    cardTitle: { fontSize: 15, fontWeight: '600', lineHeight: 18 },
    cardSub: { fontSize: 12, color: '#888' },
    timeText: { fontSize: 11, color: '#888', marginLeft: 4 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },
    onTimeBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    lateBadge: { backgroundColor: 'rgba(249, 115, 22, 0.15)' },
    grantedBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
    deniedBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
    emptyContainer: { marginTop: 60, alignItems: 'center' },
    emptyText: { color: '#888', fontSize: 14 },
});