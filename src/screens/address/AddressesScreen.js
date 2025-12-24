import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { addressesAPI } from "../../services/api";

export default function AddressesScreen() {
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        loadAddresses();
    }, []);

    // Refresh addresses when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadAddresses();
        }, [])
    );

    const loadAddresses = async () => {
        try {
            setIsLoading(true);
            const response = await addressesAPI.getAddresses();
            if (response.data.success) {
                setAddresses(response.data.data);
            }
        } catch (error) {
            console.error("Error loading addresses:", error);
            Alert.alert("Error", "Failed to load addresses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await addressesAPI.deleteAddress(
                                addressId
                            );
                            if (response.data.success) {
                                setAddresses((prev) =>
                                    prev.filter((addr) => addr.id !== addressId)
                                );
                                Alert.alert(
                                    "Success",
                                    "Address deleted successfully"
                                );
                            } else {
                                Alert.alert("Error", response.data.message);
                            }
                        } catch (error) {
                            console.error("Error deleting address:", error);
                            Alert.alert("Error", "Failed to delete address");
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (addressId) => {
        try {
            const response = await addressesAPI.setDefaultAddress(addressId);
            if (response.data.success) {
                setAddresses((prev) =>
                    prev.map((addr) => ({
                        ...addr,
                        isDefault: addr.id === addressId ? 1 : 0,
                    }))
                );
                Alert.alert("Success", "Default address updated");
            } else {
                Alert.alert("Error", response.data.message);
            }
        } catch (error) {
            console.error("Error setting default address:", error);
            Alert.alert("Error", "Failed to set default address");
        }
    };

    const renderAddressItem = ({ item }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <View style={styles.addressTypeContainer}>
                    <Text style={styles.addressType}>
                        {item?.label
                            ? item.label
                            : item.type.charAt(0).toUpperCase() +
                              item.type.slice(1)}
                    </Text>
                    {item?.isDefault ? (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.addressActions}>
                    {!item?.isDefault && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleSetDefault(item?.id)}
                        >
                            <Ionicons
                                name="star-outline"
                                size={20}
                                color="#007AFF"
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                            navigation.navigate("EditAddress", {
                                addressId: item?.id,
                            })
                        }
                    >
                        <Ionicons
                            name="pencil-outline"
                            size={20}
                            color="#007AFF"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteAddress(item?.id)}
                    >
                        <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#dc3545"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.addressDetails}>
                <Text style={styles.fullAddress}>
                    {item?.fullAddress || "Address not available"}
                </Text>
                {item?.landmark && (
                    <Text style={styles.landmark}>
                        Landmark: {item.landmark}
                    </Text>
                )}
                <Text style={styles.cityState}>
                    {item?.city || "City"}, {item?.state || "State"}{" "}
                    {item?.pincode || "Pincode"}
                </Text>
                <Text style={styles.country}>{item?.country || "Country"}</Text>
            </View>
        </View>
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("AddAddress")}
                >
                    <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Addresses List */}
            {addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No addresses found</Text>
                    <Text style={styles.emptySubtext}>
                        Add your delivery addresses to place orders
                    </Text>
                    <TouchableOpacity
                        style={styles.addFirstAddressButton}
                        onPress={() => navigation.navigate("AddAddress")}
                    >
                        <Text style={styles.addFirstAddressText}>
                            Add Address
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={addresses?.filter((item) => item != null) || []}
                    renderItem={renderAddressItem}
                    keyExtractor={(item) =>
                        item?.id?.toString() || Math.random().toString()
                    }
                    contentContainerStyle={styles.addressesList}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: 15,
        paddingTop: 50,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    addButton: {
        padding: 5,
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
        marginBottom: 30,
    },
    addFirstAddressButton: {
        backgroundColor: "#007AFF",
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstAddressText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    addressesList: {
        padding: 15,
    },
    addressCard: {
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
    addressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    addressTypeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    addressType: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginRight: 10,
    },
    defaultBadge: {
        backgroundColor: "#28a745",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    defaultText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    addressActions: {
        flexDirection: "row",
    },
    actionButton: {
        padding: 5,
        marginLeft: 10,
    },
    addressDetails: {
        marginTop: 10,
    },
    fullAddress: {
        fontSize: 14,
        color: "#333",
        marginBottom: 5,
        lineHeight: 20,
    },
    landmark: {
        fontSize: 12,
        color: "#666",
        marginBottom: 5,
    },
    cityState: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    country: {
        fontSize: 12,
        color: "#666",
    },
});
