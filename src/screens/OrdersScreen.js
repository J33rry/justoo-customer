import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { ordersAPI } from "../services/api";

export default function OrdersScreen() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        loadOrders();
        loadStats();
    }, []);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const response = await ordersAPI.getOrders({ limit: 20 });
            if (response.data.success) {
                setOrders(response.data.data.orders);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
            Alert.alert("Error", "Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await ordersAPI.getOrderStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "placed":
                return "#ffa500";
            case "confirmed":
                return "#007AFF";
            case "preparing":
                return "#28a745";
            case "out_for_delivery":
                return "#17a2b8";
            case "delivered":
                return "#28a745";
            case "cancelled":
                return "#dc3545";
            default:
                return "#6c757d";
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() =>
                navigation.navigate("OrderDetail", { orderId: item?.id })
            }
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>
                    Order #{item?.id || "N/A"}
                </Text>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item?.status) },
                    ]}
                >
                    <Text style={styles.statusText}>
                        {item?.status
                            ? item.status.replace("_", " ").toUpperCase()
                            : "UNKNOWN"}
                    </Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.orderDate}>
                    {item?.orderPlacedAt
                        ? formatDate(item.orderPlacedAt)
                        : "Date not available"}
                </Text>
                <Text style={styles.itemCount}>
                    {item?.itemCount || 0} item
                    {(item?.itemCount || 0) > 1 ? "s" : ""}
                </Text>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>₹{item?.totalAmount || 0}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stats Cards */}
            {stats && (
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            {stats?.overview?.totalOrders || 0}
                        </Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            ₹{stats?.overview?.totalSpent || 0}
                        </Text>
                        <Text style={styles.statLabel}>Total Spent</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>
                            ₹
                            {stats?.overview?.avgOrderValue
                                ? Math.round(stats.overview.avgOrderValue)
                                : 0}
                        </Text>
                        <Text style={styles.statLabel}>Avg Order</Text>
                    </View>
                </View>
            )}

            {/* Orders List */}
            <View style={styles.ordersContainer}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>

                {orders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="receipt-outline"
                            size={80}
                            color="#ccc"
                        />
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <Text style={styles.emptySubtext}>
                            Your order history will appear here
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders?.filter((item) => item != null) || []}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) =>
                            item?.id?.toString() || Math.random().toString()
                        }
                        contentContainerStyle={styles.ordersList}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statsContainer: {
        flexDirection: "row",
        padding: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#007AFF",
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    ordersContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginHorizontal: 15,
        marginBottom: 10,
        marginTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    ordersList: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    orderDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    orderDate: {
        fontSize: 14,
        color: "#666",
    },
    itemCount: {
        fontSize: 14,
        color: "#666",
    },
    orderFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#007AFF",
    },
});
