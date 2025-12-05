import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ReportService } from '@/src/api/reportService';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

type ReportType = 'ATTENDANCE' | 'ACCESS' | 'ALERTS';
type SortOrder = 'ASC' | 'DESC';

export default function ReportsScreen() {
    const [type, setType] = useState<ReportType>('ATTENDANCE');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const [sort, setSort] = useState<SortOrder>('DESC');
    const [attendanceFilter, setAttendanceFilter] = useState<string>('ALL');
    const [accessFilter, setAccessFilter] = useState<string>('ALL');

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
                const res = await ReportService.getRecentAccessLogs(startIso, endIso, 'DENIED', sort);
                setData(res);
            }
        } catch (e) {
            console.error("Error fetching reports:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [type, sort, accessFilter, attendanceFilter]);

    // --- TRANSFORMACIÓN DE DATOS PARA ASISTENCIA ---
    // Desdoblamos las sesiones en eventos individuales (Entrada y Salida)
    const processedList = useMemo(() => {
        if (type !== 'ATTENDANCE') return data;

        const events: any[] = [];
        data.forEach(item => {
            // 1. Agregar Evento de ENTRADA (Siempre existe)
            events.push({
                ...item,
                virtualId: `${item.id}-IN`, // ID único virtual
                eventType: 'ENTRADA',
                displayTime: item.checkInTime,
                originalStatus: item.status
            });

            // 2. Agregar Evento de SALIDA (Solo si ya marcó salida)
            if (item.checkOutTime) {
                events.push({
                    ...item,
                    virtualId: `${item.id}-OUT`, // ID único virtual
                    eventType: 'SALIDA',
                    displayTime: item.checkOutTime,
                    originalStatus: item.status
                });
            }
        });

        // Reordenar la lista combinada por hora del evento
        return events.sort((a, b) => {
            const timeA = new Date(a.displayTime).getTime();
            const timeB = new Date(b.displayTime).getTime();
            return sort === 'DESC' ? timeB - timeA : timeA - timeB;
        });

    }, [data, type, sort]);

    const formatTime = (isoString: string) => {
        if (!isoString) return '--:--';
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
        // Calculamos el número de item basado en la lista procesada
        const listToUse = type === 'ATTENDANCE' ? processedList : data;
        const itemNumber = sort === 'DESC' ? listToUse.length - index : index + 1;

        if (type === 'ATTENDANCE') {
            const isExit = item.eventType === 'SALIDA';

            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        {/* Icono: Entrada (Azul/Flecha) vs Salida (Morado/Cuadro) */}
                        <View style={[styles.cardIcon, { backgroundColor: isExit ? '#8b5cf6' : '#0a7ea4' }]}>
                            <IconSymbol name={isExit ? 'arrow.right.square.fill' : 'arrow.right.to.line'} size={20} color="white" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardTitle}>{item.workerFullName}</ThemedText>
                            <ThemedText style={styles.cardSub}>{item.rfidTag || 'Sin Tag'}</ThemedText>
                        </View>
                        {/* Hora específica del evento (entrada o salida) */}
                        <ThemedText style={styles.timeText}>{formatTime(item.displayTime)}</ThemedText>
                    </View>

                    <View style={styles.footerRow}>
                        <ThemedText style={{fontSize: 12, color: '#888'}}>#{itemNumber}</ThemedText>

                        <View style={{flexDirection: 'row', gap: 6}}>
                            {/* Etiqueta de Tipo */}
                            <View style={[styles.statusBadge, { backgroundColor: isExit ? 'rgba(139, 92, 246, 0.15)' : 'rgba(10, 126, 164, 0.15)' }]}>
                                <ThemedText style={[styles.statusBadgeText, { color: isExit ? '#8b5cf6' : '#0a7ea4' }]}>
                                    {item.eventType}
                                </ThemedText>
                            </View>

                            {/* Etiqueta de Puntualidad (Solo relevante en la entrada, pero mostramos en ambos para contexto) */}
                            <View style={[styles.statusBadge, item.isLate ? styles.lateBadge : styles.onTimeBadge]}>
                                <ThemedText style={styles.statusBadgeText}>
                                    {item.isLate ? `⏱ Tardanza (${item.latenessDuration || '0m'})` : '✓ Puntual'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }

        // --- LOGICA ACCESS Y ALERTS ---
        const isGranted = item.status === 'GRANTED';
        const isAlertTab = type === 'ALERTS';
        const cardBorderColor = isAlertTab ? '#ef4444' : colors.border;
        const iconColor = isGranted ? '#22c55e' : '#ef4444';

        return (
            <View style={[styles.card, {
                backgroundColor: colors.card,
                borderColor: cardBorderColor,
                borderLeftWidth: isAlertTab ? 4 : 1,
                borderLeftColor: isAlertTab ? '#ef4444' : colors.border
            }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIcon, { backgroundColor: iconColor }]}>
                        <IconSymbol name={isGranted ? 'plus.circle.fill' : 'exclamationmark.triangle.fill'} size={20} color="white" />
                    </View>
                    <View style={styles.cardHeaderText}>
                        <ThemedText style={styles.cardTitle}>{item.workerFullName || 'Desconocido'}</ThemedText>
                        <ThemedText style={styles.cardSub}>ID Huella: {item.fingerprintId || 'N/A'}</ThemedText>
                    </View>
                    <ThemedText style={styles.timeText}>{formatTime(item.accessTime)}</ThemedText>
                </View>
                <View style={styles.footerRow}>
                    <ThemedText style={{fontSize: 12, color: '#888'}}>#{itemNumber}</ThemedText>
                    <View style={[styles.statusBadge, isGranted ? styles.grantedBadge : styles.deniedBadge]}>
                        <ThemedText style={[styles.statusBadgeText, { color: isAlertTab ? '#ef4444' : colors.text }]}>
                            {isGranted ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO (ALERTA)'}
                        </ThemedText>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.tabs, { backgroundColor: colors.card }]}>
                {(['ATTENDANCE', 'ACCESS', 'ALERTS'] as ReportType[]).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, type === t && styles.activeTab]} onPress={() => { setType(t); }}>
                        <ThemedText style={[styles.tabText, type === t && styles.activeTabText]}>
                            {t === 'ATTENDANCE' ? 'Asistencia' : t === 'ACCESS' ? 'Accesos' : 'Alertas'}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>
            {renderHeaderControls()}

            {/* Contador basado en la lista visual procesada */}
            <View style={styles.countContainer}>
                <ThemedText style={styles.countText}>
                    Registros encontrados: {type === 'ATTENDANCE' ? processedList.length : data.length}
                </ThemedText>
            </View>

            {loading ? <ActivityIndicator style={styles.loader} size="large" color="#0a7ea4" /> :
                <FlatList
                    data={type === 'ATTENDANCE' ? processedList : data}
                    // Usamos virtualId para asistencia (para que no se repita key) y id normal para otros
                    keyExtractor={(item) => type === 'ATTENDANCE' ? item.virtualId : item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.text} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<View style={styles.emptyContainer}><ThemedText style={styles.emptyText}>No hay registros.</ThemedText></View>}
                />}
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