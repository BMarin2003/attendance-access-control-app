import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { ReportService } from '@/src/api/reportService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

type ReportType = 'ATTENDANCE' | 'ACCESS' | 'SECURITY';
type FilterType = 'ALL' | 'LATE' | 'DENIED' | 'CRITICAL';

export default function ReportsScreen() {
    const [type, setType] = useState<ReportType>('ATTENDANCE');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Función para obtener la fecha local en formato YYYY-MM-DD
    const getLocalDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        setLoading(true);
        setData([]);

        // Usamos hora local para evitar problemas de UTC vs Tu Zona Horaria
        const today = getLocalDateString();

        const now = new Date();
        const endIso = now.toISOString(); // Para endpoints de Access/Security que usan ISO
        const start = new Date();
        start.setHours(start.getHours() - 24); // Últimas 24h
        const startIso = start.toISOString();

        try {
            if (type === 'ATTENDANCE') {
                // Trae asistencias de HOY (Hora local)
                if (filter === 'LATE') {
                    const res = await ReportService.getLateAttendanceByDate(today);
                    setData(res);
                } else {
                    const res = await ReportService.getAttendanceByDate(today);
                    setData(res);
                }
            } else if (type === 'ACCESS') {
                if (filter === 'DENIED') {
                    const res = await ReportService.getDeniedAccessLogs(24);
                    setData(res);
                } else {
                    const res = await ReportService.getRecentAccessLogs(startIso, endIso);
                    setData(res);
                }
            } else { // SECURITY
                if (filter === 'CRITICAL') {
                    const res = await ReportService.getCriticalSecurityEvents();
                    setData(res);
                } else {
                    const res = await ReportService.getSecurityLogs(startIso, endIso);
                    setData(res);
                }
            }
        } catch (e) {
            console.error("Error fetching reports:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [type, filter]);

    const renderItem = ({ item }: { item: any }) => {
        if (type === 'ATTENDANCE') {
            return (
                <View style={[styles.card, {borderLeftColor: item.isLate ? 'orange':'green', borderLeftWidth:4}]}>
                    <View style={styles.row}>
                        <ThemedText type="defaultSemiBold">{item.workerFullName}</ThemedText>
                        <ThemedText style={{fontSize:12, color:'#666'}}>{item.checkInTime?.split('T')[1]?.substring(0,5)}</ThemedText>
                    </View>
                    <ThemedText>RFID: <ThemedText style={{fontFamily:'monospace', fontSize:12}}>{item.rfidTag}</ThemedText></ThemedText>
                    <ThemedText style={{color: item.isLate ? 'red' : 'green', marginTop:4}}>
                        {item.isLate ? `⚠️ Tarde (+${item.latenessDuration})` : '✅ Puntual'}
                    </ThemedText>
                    {item.checkOutTime && (
                        <ThemedText style={{fontSize:12, color:'#666', marginTop:2}}>Salida: {item.checkOutTime?.split('T')[1]?.substring(0,5)}</ThemedText>
                    )}
                </View>
            );
        } else if (type === 'ACCESS') {
            return (
                <View style={[styles.card, { borderLeftColor: item.status === 'GRANTED' ? 'green' : 'red', borderLeftWidth: 4 }]}>
                    <ThemedText type="defaultSemiBold">{item.workerFullName || 'Desconocido'}</ThemedText>
                    <ThemedText>Estado: <ThemedText style={{fontWeight:'bold'}}>{item.status}</ThemedText></ThemedText>
                    {item.denialReason && <ThemedText style={{color:'red', fontSize:12}}>{item.denialReason}</ThemedText>}
                    <ThemedText style={{fontSize:12, color:'#666', marginTop:5}}>{item.accessTime?.replace('T',' ').substring(0,19)}</ThemedText>
                </View>
            );
        } else {
            return (
                <View style={[styles.card, { backgroundColor: item.severity === 'CRITICAL' ? '#ffebeb' : 'white' }]}>
                    <ThemedText type="defaultSemiBold" style={{color: item.severity==='CRITICAL'?'red':'black'}}>
                        [{item.severity}] {item.eventType}
                    </ThemedText>
                    <ThemedText>{item.description}</ThemedText>
                    <ThemedText style={{fontSize: 12, color: '#666', marginTop:5}}>{item.eventTime?.replace('T',' ').substring(0,19)}</ThemedText>
                </View>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>

            {/* Header con Botón de Recargar */}
            <View style={styles.header}>
                <ThemedText type="title">Reportes</ThemedText>
                <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
                    <IconSymbol name="paperplane.fill" size={20} color="white" />
                    {/* Si tienes un icono de 'refresh' o 'sync' úsalo, si no el paperplane sirve para probar */}
                </TouchableOpacity>
            </View>

            {/* Tabs Principales */}
            <View style={styles.tabs}>
                {(['ATTENDANCE', 'ACCESS', 'SECURITY'] as ReportType[]).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, type === t && styles.activeTab]}
                                      onPress={() => { setType(t); setFilter('ALL'); }}>
                        <Text style={[styles.tabText, type === t && styles.activeTabText]}>
                            {t === 'ATTENDANCE' ? 'Asistencia' : t === 'ACCESS' ? 'Accesos' : 'Alertas'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sub-Filtros */}
            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setFilter('ALL')} style={[styles.chip, filter === 'ALL' && styles.activeChip]}>
                    <Text style={{color: filter==='ALL'?'white':'black', fontSize:12}}>Todos</Text>
                </TouchableOpacity>

                {type === 'ATTENDANCE' && (
                    <TouchableOpacity onPress={() => setFilter('LATE')} style={[styles.chip, filter === 'LATE' && styles.activeChip]}>
                        <Text style={{color: filter==='LATE'?'white':'black', fontSize:12}}>Tardanzas</Text>
                    </TouchableOpacity>
                )}
                {type === 'ACCESS' && (
                    <TouchableOpacity onPress={() => setFilter('DENIED')} style={[styles.chip, filter === 'DENIED' && styles.activeChip]}>
                        <Text style={{color: filter==='DENIED'?'white':'black', fontSize:12}}>Denegados</Text>
                    </TouchableOpacity>
                )}
                {type === 'SECURITY' && (
                    <TouchableOpacity onPress={() => setFilter('CRITICAL')} style={[styles.chip, filter === 'CRITICAL' && styles.activeChip]}>
                        <Text style={{color: filter==='CRITICAL'?'white':'black', fontSize:12}}>Críticos</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista */}
            {loading ? <ActivityIndicator style={{marginTop: 50}} size="large" color="#0a7ea4" /> : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
                    ListEmptyComponent={
                        <View style={{marginTop: 50, alignItems:'center'}}>
                            <ThemedText style={{color:'#999'}}>No se encontraron registros para hoy.</ThemedText>
                            <ThemedText style={{fontSize:12, color:'#ccc'}}>(Fecha: {getLocalDateString()})</ThemedText>
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    refreshButton: { backgroundColor: '#0a7ea4', padding: 8, borderRadius: 20 },
    tabs: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#eee', borderRadius: 8, padding: 2 },
    tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontWeight: '600', color: '#666', fontSize:12 },
    activeTabText: { color: '#0a7ea4' },
    filters: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e0e0e0' },
    activeChip: { backgroundColor: '#0a7ea4' },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});