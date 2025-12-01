import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text, ScrollView } from 'react-native';
import { ReportService } from '@/src/api/reportService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ReportType = 'ATTENDANCE' | 'ACCESS' | 'SECURITY';
type FilterType = 'ALL' | 'LATE' | 'DENIED' | 'CRITICAL';

export default function ReportsScreen() {
    const [type, setType] = useState<ReportType>('ATTENDANCE');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setData([]);
        const today = new Date().toISOString().split('T')[0];
        const end = new Date().toISOString();
        const start = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(); // 24h

        try {
            if (type === 'ATTENDANCE') {
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
                    const res = await ReportService.getRecentAccessLogs(start, end);
                    setData(res);
                }
            } else { // SECURITY
                if (filter === 'CRITICAL') {
                    const res = await ReportService.getCriticalSecurityEvents();
                    setData(res);
                } else {
                    const res = await ReportService.getSecurityLogs(start, end);
                    setData(res);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [type, filter]);

    // Renderizado de ítems igual que antes, ajustado por tipo...
    // (Usa el mismo renderItem del ejemplo anterior)
    const renderItem = ({ item }: { item: any }) => {
        // ... Copia el renderItem del paso anterior, es compatible
        if (type === 'ATTENDANCE') {
            return (
                <View style={[styles.card, {borderLeftColor: item.isLate ? 'orange':'green', borderLeftWidth:4}]}>
                    <ThemedText type="defaultSemiBold">{item.workerFullName}</ThemedText>
                    <ThemedText>Entrada: {item.checkInTime?.split('T')[1]?.split('.')[0]}</ThemedText>
                    <ThemedText style={{color: item.isLate ? 'red' : 'green'}}>
                        {item.isLate ? `Tarde (+${item.latenessDuration})` : 'Puntual'}
                    </ThemedText>
                </View>
            );
        } else if (type === 'ACCESS') {
            return (
                <View style={[styles.card, { borderLeftColor: item.status === 'GRANTED' ? 'green' : 'red', borderLeftWidth: 4 }]}>
                    <ThemedText type="defaultSemiBold">{item.workerFullName || 'Desconocido'}</ThemedText>
                    <ThemedText>Estado: {item.status}</ThemedText>
                    {item.denialReason && <ThemedText style={{color:'red'}}>{item.denialReason}</ThemedText>}
                    <ThemedText style={{fontSize:12, color:'#666'}}>{item.accessTime?.replace('T',' ')}</ThemedText>
                </View>
            );
        } else {
            return (
                <View style={[styles.card, { backgroundColor: item.severity === 'CRITICAL' ? '#ffebeb' : 'white' }]}>
                    <ThemedText type="defaultSemiBold" style={{color: item.severity==='CRITICAL'?'red':'black'}}>
                        [{item.severity}] {item.eventType}
                    </ThemedText>
                    <ThemedText>{item.description}</ThemedText>
                    <ThemedText style={{fontSize: 12, color: '#666'}}>{item.eventTime?.replace('T',' ')}</ThemedText>
                </View>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            {/* Tabs Principales */}
            <View style={styles.tabs}>
                {(['ATTENDANCE', 'ACCESS', 'SECURITY'] as ReportType[]).map((t) => (
                    <TouchableOpacity key={t} style={[styles.tab, type === t && styles.activeTab]}
                                      onPress={() => { setType(t); setFilter('ALL'); }}>
                        <Text style={[styles.tabText, type === t && styles.activeTabText]}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Sub-Filtros */}
            <View style={styles.filters}>
                <TouchableOpacity onPress={() => setFilter('ALL')} style={[styles.chip, filter === 'ALL' && styles.activeChip]}>
                    <Text style={{color: filter==='ALL'?'white':'black'}}>Todos</Text>
                </TouchableOpacity>

                {type === 'ATTENDANCE' && (
                    <TouchableOpacity onPress={() => setFilter('LATE')} style={[styles.chip, filter === 'LATE' && styles.activeChip]}>
                        <Text style={{color: filter==='LATE'?'white':'black'}}>Solo Tardanzas</Text>
                    </TouchableOpacity>
                )}
                {type === 'ACCESS' && (
                    <TouchableOpacity onPress={() => setFilter('DENIED')} style={[styles.chip, filter === 'DENIED' && styles.activeChip]}>
                        <Text style={{color: filter==='DENIED'?'white':'black'}}>Denegados</Text>
                    </TouchableOpacity>
                )}
                {type === 'SECURITY' && (
                    <TouchableOpacity onPress={() => setFilter('CRITICAL')} style={[styles.chip, filter === 'CRITICAL' && styles.activeChip]}>
                        <Text style={{color: filter==='CRITICAL'?'white':'black'}}>Críticos</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? <ActivityIndicator style={{marginTop: 20}} /> : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={<ThemedText style={{textAlign:'center', marginTop: 20}}>Sin datos.</ThemedText>}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    tabs: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#eee', borderRadius: 8, padding: 2 },
    tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontWeight: '600', color: '#666', fontSize:12 },
    activeTabText: { color: '#0a7ea4' },
    filters: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#ddd' },
    activeChip: { backgroundColor: '#0a7ea4' },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' }
});