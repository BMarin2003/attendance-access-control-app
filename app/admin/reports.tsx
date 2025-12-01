import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ReportService } from '@/src/api/reportService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

type ReportType = 'ATTENDANCE' | 'ACCESS' | 'SECURITY';
type FilterType = 'ALL' | 'LATE' | 'DENIED' | 'CRITICAL';

export default function ReportsScreen() {
    const [type, setType] = useState<ReportType>('ATTENDANCE');
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'dark'];

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

        const today = getLocalDateString();
        const now = new Date();
        const endIso = now.toISOString();
        const start = new Date();
        start.setHours(start.getHours() - 24);
        const startIso = start.toISOString();

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
                    const res = await ReportService.getRecentAccessLogs(startIso, endIso);
                    setData(res);
                }
            } else {
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

    const formatTime = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const renderItem = ({ item }: { item: any }) => {
        if (type === 'ATTENDANCE') {
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: '#0a7ea4' }]}>
                            <ThemedText style={styles.cardIconText}>A</ThemedText>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardType}>Asistencia</ThemedText>
                            <ThemedText style={styles.cardTitle}>{item.workerFullName}</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.cardDate}>{formatTime(item.checkInTime)}</ThemedText>
                    <View style={[styles.statusBadge, item.isLate ? styles.lateBadge : styles.onTimeBadge]}>
                        <ThemedText style={styles.statusBadgeText}>
                            {item.isLate ? `⏱ Tardanza (${item.latenessDuration || 'N/A'})` : '✓ Puntual'}
                        </ThemedText>
                    </View>
                </View>
            );
        } else if (type === 'ACCESS') {
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: '#8b5cf6' }]}>
                            <ThemedText style={styles.cardIconText}>🚪</ThemedText>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardType}>Acceso</ThemedText>
                            <ThemedText style={styles.cardTitle}>{item.workerFullName || 'Desconocido'}</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.cardDate}>{formatTime(item.accessTime)}</ThemedText>
                    <View style={[styles.statusBadge, item.status === 'GRANTED' ? styles.grantedBadge : styles.deniedBadge]}>
                        <ThemedText style={styles.statusBadgeText}>
                            {item.status === 'GRANTED' ? '✓ Entrada - Puerta Principal' : `✗ ${item.denialReason || 'Denegado'}`}
                        </ThemedText>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardIcon, { backgroundColor: item.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }]}>
                            <ThemedText style={styles.cardIconText}>⚠</ThemedText>
                        </View>
                        <View style={styles.cardHeaderText}>
                            <ThemedText style={styles.cardType}>Alerta</ThemedText>
                            <ThemedText style={styles.cardTitle}>{item.eventType || 'Sistema IoT'}</ThemedText>
                        </View>
                    </View>
                    <ThemedText style={styles.cardDate}>{formatTime(item.eventTime)}</ThemedText>
                    <View style={[styles.statusBadge, styles.alertBadge]}>
                        <ThemedText style={styles.statusBadgeText}>
                            ⚠ {item.description}
                        </ThemedText>
                    </View>
                </View>
            );
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.tabs, { backgroundColor: colors.card }]}>
                {(['ATTENDANCE', 'ACCESS', 'SECURITY'] as ReportType[]).map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, type === t && styles.activeTab]}
                        onPress={() => { setType(t); setFilter('ALL'); }}
                    >
                        <ThemedText style={[styles.tabText, type === t && styles.activeTabText]}>
                            {t === 'ATTENDANCE' ? 'Asistencia' : t === 'ACCESS' ? 'Accesos' : 'Alertas'}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.filters}>
                <TouchableOpacity
                    onPress={() => setFilter('ALL')}
                    style={[styles.chip, filter === 'ALL' && styles.activeChip, { borderColor: colors.border }]}
                >
                    <ThemedText style={[styles.chipText, filter === 'ALL' && styles.activeChipText]}>Todos</ThemedText>
                </TouchableOpacity>

                {type === 'ATTENDANCE' && (
                    <TouchableOpacity
                        onPress={() => setFilter('LATE')}
                        style={[styles.chip, filter === 'LATE' && styles.activeChip, { borderColor: colors.border }]}
                    >
                        <ThemedText style={[styles.chipText, filter === 'LATE' && styles.activeChipText]}>Tardanzas</ThemedText>
                    </TouchableOpacity>
                )}
                {type === 'ACCESS' && (
                    <TouchableOpacity
                        onPress={() => setFilter('DENIED')}
                        style={[styles.chip, filter === 'DENIED' && styles.activeChip, { borderColor: colors.border }]}
                    >
                        <ThemedText style={[styles.chipText, filter === 'DENIED' && styles.activeChipText]}>Denegados</ThemedText>
                    </TouchableOpacity>
                )}
                {type === 'SECURITY' && (
                    <TouchableOpacity
                        onPress={() => setFilter('CRITICAL')}
                        style={[styles.chip, filter === 'CRITICAL' && styles.activeChip, { borderColor: colors.border }]}
                    >
                        <ThemedText style={[styles.chipText, filter === 'CRITICAL' && styles.activeChipText]}>Críticos</ThemedText>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#0a7ea4" />
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.text} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <ThemedText style={styles.emptyText}>No se encontraron registros para hoy.</ThemedText>
                            <ThemedText style={styles.emptyDate}>(Fecha: {getLocalDateString()})</ThemedText>
                        </View>
                    }
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    tabs: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#0a7ea4',
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#888',
    },
    activeTabText: {
        color: 'white',
    },
    filters: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    activeChip: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    chipText: {
        fontSize: 14,
        color: '#888',
    },
    activeChipText: {
        color: 'white',
    },
    loader: {
        marginTop: 50,
    },
    listContent: {
        paddingBottom: 30,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardIconText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardHeaderText: {
        flex: 1,
    },
    cardType: {
        fontSize: 12,
        color: '#888',
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    cardDate: {
        fontSize: 13,
        color: '#888',
        marginBottom: 10,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    onTimeBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
    },
    lateBadge: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
    },
    grantedBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
    },
    deniedBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    alertBadge: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
    },
    statusBadgeText: {
        fontSize: 13,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
    },
    emptyDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});