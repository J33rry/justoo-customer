import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { cartAPI, addressesAPI, ordersAPI } from "../../services/api";
import { colors, spacing, typography, radius, shadow } from "../../theme";

export default function CheckoutScreen() {
    const [cartSummary, setCartSummary] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        loadCheckoutData();
    }, []);

    useEffect(() => {
        if (selectedAddress) {
            loadCartSummary(selectedAddress.id);
        }
    }, [selectedAddress]);

    const loadCartSummary = async (addressId) => {
        try {
            const cartResponse = await cartAPI.getCartSummary({ addressId });
            if (cartResponse.data.success) {
                setCartSummary(cartResponse.data.data);
                console.log(cartSummary);
            }
        } catch (error) {
            console.error("Error loading cart summary:", error);
        }
    };

    const loadCheckoutData = async () => {
        try {
            setIsLoading(true);
            const [cartResponse, addressesResponse] = await Promise.all([
                cartAPI.getCartSummary(),
                addressesAPI.getAddresses(),
            ]);

            if (cartResponse.data.success) {
                setCartSummary(cartResponse.data.data);
            }

            if (addressesResponse.data.success) {
                setAddresses(addressesResponse.data.data);

                // Auto-select default address
                const defaultAddress = addressesResponse.data.data.find(
                    (addr) => addr.isDefault
                );
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress);
                    // Reload cart summary with selected address
                    loadCartSummary(defaultAddress.id);
                }
            }
            // if (selectedAddress) {
            //     const zoneResponse = await addressesAPI.getAddressZones(
            //         selectedAddress.id
            //     );
            //     console.log("Address Zone Response:", zoneResponse);
            // }
        } catch (error) {
            console.error("Error loading checkout data:", error);
            Alert.alert("Error", "Failed to load checkout data");
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };
    // console.log(addresses);
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert("Error", "Please select a delivery address");
            return;
        }

        if (
            !cartSummary ||
            !cartSummary.items ||
            cartSummary.items.length === 0
        ) {
            Alert.alert("Error", "Your cart is empty");
            navigation.goBack();
            return;
        }

        try {
            setIsPlacingOrder(true);
            console.log("Placing order with:", {
                deliveryAddressId: selectedAddress.id,
                paymentMethod,
            });

            const response = await ordersAPI.createOrder({
                deliveryAddressId: selectedAddress.id,
                paymentMethod,
            });

            console.log("Order response:", response.data);

            if (response.data.success) {
                Alert.alert(
                    "Order Placed!",
                    `Your order has been placed successfully. Order #${
                        response.data.data.orderNumber ||
                        response.data.data.order?.id ||
                        "N/A"
                    }`,
                    [
                        {
                            text: "View Order",
                            onPress: () => {
                                navigation.navigate("Orders");
                            },
                        },
                        {
                            text: "Continue Shopping",
                            onPress: () => navigation.navigate("Home"),
                        },
                    ]
                );
            } else {
                Alert.alert(
                    "Error",
                    response.data.message || "Failed to place order"
                );
            }
        } catch (error) {
            console.error("Error placing order:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });

            let errorMessage = "Failed to place order. ";
            if (error.response?.data?.message) {
                errorMessage += error.response.data.message;
            } else if (error.response?.status === 500) {
                errorMessage +=
                    "Server error occurred. Please try again later.";
            } else if (error.message === "Network Error") {
                errorMessage +=
                    "Network connection failed. Please check your internet connection.";
            } else if (error.code === "ECONNABORTED") {
                errorMessage += "Request timed out. Please try again.";
            } else {
                errorMessage += error.message || "Unknown error occurred.";
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
    };
    const [zoneInfo, setZoneInfo] = useState(null);
    const loadAddressZone = async () => {
        if (!selectedAddress?.zoneId) return;
        try {
            const res = await addressesAPI.getAddressZone(
                selectedAddress.zoneId
            );
            if (res.data.success) {
                setZoneInfo(res.data.data.zone);
                // console.log(res.data.data.zone);
            }
        } catch (error) {
            console.error("Error loading address zone:", error);
        }
    };

    useEffect(() => {
        loadAddressZone();
    }, [selectedAddress]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!cartSummary || cartSummary.items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate("Home")}
                >
                    <Text style={styles.shopButtonText}>Start Shopping</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.topBar}>
                <View>
                    <Text style={styles.topLabel}>Estimated arrival</Text>
                    <Text style={styles.topValue}>
                        {zoneInfo?.estimatedDeliveryTime
                            ? zoneInfo.estimatedDeliveryTime + " mins"
                            : "N/A"}
                    </Text>
                </View>
                <View style={styles.topChip}>
                    <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color={colors.card}
                    />
                    <Text style={styles.topChipText}>Safe delivery</Text>
                </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons
                        name="location"
                        size={20}
                        color={colors.primary}
                    />
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>

                {addresses.length === 0 ? (
                    <View style={styles.emptyAddress}>
                        <Text style={styles.emptyAddressText}>
                            No addresses found
                        </Text>
                        <TouchableOpacity
                            style={styles.addAddressButton}
                            onPress={() => navigation.navigate("AddAddress")}
                        >
                            <Text style={styles.addAddressText}>
                                Add address
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        vertical
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                    >
                        {addresses
                            ?.filter((address) => address != null)
                            .map((address) => (
                                <TouchableOpacity
                                    key={address?.id || Math.random()}
                                    style={[
                                        styles.addressCard,
                                        selectedAddress?.id === address?.id &&
                                            styles.addressCardSelected,
                                    ]}
                                    onPress={() => selectAddress(address)}
                                >
                                    <Text style={styles.addressType}>
                                        {address?.label
                                            ? address.label
                                            : address.type
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              address.type.slice(1)}
                                        {/* {address?.isDefault && " (Default)"} */}
                                    </Text>
                                    <Text
                                        style={styles.addressText}
                                        numberOfLines={3}
                                    >
                                        {address?.fullAddress ||
                                            "Address not available"}
                                    </Text>
                                    {address?.landmark && (
                                        <Text style={styles.landmarkText}>
                                            {address.landmark}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                )}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="basket" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                </View>

                {cartSummary?.items
                    ?.filter((item) => item != null)
                    .map((item) => (
                        <View
                            key={item?.id || Math.random()}
                            style={styles.orderItem}
                        >
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item?.name || "Unknown Item"}
                                </Text>
                                <Text style={styles.itemQuantity}>
                                    Qty: {item?.quantity || 0}
                                </Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                ₹{item?.totalPrice || 0}
                            </Text>
                        </View>
                    ))}
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="card" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        paymentMethod === "cash" &&
                            styles.paymentOptionSelected,
                    ]}
                    onPress={() => setPaymentMethod("cash")}
                >
                    <Ionicons name="cash" size={20} color={colors.success} />
                    <Text style={styles.paymentText}>Cash on Delivery</Text>
                    {paymentMethod === "cash" && (
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.primary}
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        paymentMethod === "online" &&
                            styles.paymentOptionSelected,
                    ]}
                    onPress={() => setPaymentMethod("online")}
                >
                    <Ionicons name="card" size={20} color={colors.primary} />
                    <Text style={styles.paymentText}>Online Payment</Text>
                    {paymentMethod === "online" && (
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={colors.primary}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {/* Order Total */}
            <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                        ₹{cartSummary.subtotal}
                    </Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Delivery Fee</Text>
                    <Text style={styles.totalValue}>
                        ₹{cartSummary.deliveryFee}
                    </Text>
                </View>
                <View style={[styles.totalRow, styles.finalTotal]}>
                    <Text style={styles.finalTotalLabel}>Total</Text>
                    <Text style={styles.finalTotalValue}>
                        ₹{cartSummary.total}
                    </Text>
                </View>
            </View>

            {/* Place Order Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.placeOrderButton,
                        (!selectedAddress || isPlacingOrder) &&
                            styles.buttonDisabled,
                    ]}
                    onPress={handlePlaceOrder}
                    disabled={!selectedAddress || isPlacingOrder}
                >
                    {isPlacingOrder ? (
                        <ActivityIndicator color={colors.card} />
                    ) : (
                        <>
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.card}
                            />
                            <Text style={styles.placeOrderText}>
                                Place Order • ₹{cartSummary.total}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.page,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    emptyText: {
        fontSize: typography.h2,
        color: colors.text,
        marginBottom: spacing.md,
        fontWeight: "800",
    },
    shopButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        ...shadow.soft,
    },
    shopButtonText: {
        color: colors.card,
        fontSize: typography.body,
        fontWeight: "800",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingTop: 50,
        paddingBottom: spacing.md,
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        ...shadow.soft,
    },
    headerTitle: {
        fontSize: typography.h2,
        fontWeight: "800",
        color: colors.text,
    },
    topBar: {
        backgroundColor: colors.card,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        ...shadow.card,
    },
    topLabel: {
        color: colors.textMuted,
        fontSize: typography.small,
    },
    topValue: {
        color: colors.text,
        fontSize: typography.h3,
        fontWeight: "800",
        marginTop: spacing.xs,
    },
    topChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.lg,
        ...shadow.soft,
    },
    topChipText: {
        color: colors.card,
        fontWeight: "700",
        fontSize: typography.small,
    },
    section: {
        backgroundColor: colors.card,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...shadow.card,
    },
    sectionHeader: {
        marginBottom: spacing.sm,
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: typography.h3,
        fontWeight: "800",
        color: colors.text,
        marginLeft: spacing.sm,
    },
    emptyAddress: {
        alignItems: "center",
        padding: spacing.md,
    },
    emptyAddressText: {
        fontSize: typography.body,
        color: colors.textMuted,
        marginBottom: spacing.sm,
    },
    addAddressButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
    },
    addAddressText: {
        color: colors.card,
        fontWeight: "700",
    },
    addressCard: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginRight: spacing.sm,
        minWidth: 220,
    },
    addressCardSelected: {
        borderColor: colors.primary,
        backgroundColor: "#E8F7EF",
    },
    addressType: {
        fontSize: typography.body,
        fontWeight: "700",
        color: colors.text,
        marginBottom: spacing.xs,
    },
    addressText: {
        fontSize: typography.body,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    landmarkText: {
        fontSize: typography.small,
        color: colors.textMuted,
    },
    orderItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: typography.body,
        color: colors.text,
        marginBottom: spacing.xs,
        fontWeight: "700",
    },
    itemQuantity: {
        fontSize: typography.small,
        color: colors.textMuted,
    },
    itemPrice: {
        fontSize: typography.body,
        fontWeight: "800",
        color: colors.primary,
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
    },
    paymentOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: "#E8F7EF",
    },
    paymentText: {
        fontSize: typography.body,
        color: colors.text,
        marginLeft: spacing.sm,
        flex: 1,
        fontWeight: "700",
    },
    totalSection: {
        backgroundColor: colors.card,
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderRadius: radius.lg,
        padding: spacing.md,
        ...shadow.card,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    totalLabel: {
        fontSize: typography.body,
        color: colors.textMuted,
    },
    totalValue: {
        fontSize: typography.body,
        color: colors.text,
        fontWeight: "700",
    },
    finalTotal: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.sm,
        marginTop: spacing.sm,
    },
    finalTotalLabel: {
        fontSize: typography.h3,
        fontWeight: "800",
        color: colors.text,
    },
    finalTotalValue: {
        fontSize: typography.h2,
        fontWeight: "800",
        color: colors.primary,
    },
    buttonContainer: {
        padding: spacing.md,
    },
    placeOrderButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        ...shadow.card,
    },
    buttonDisabled: {
        backgroundColor: colors.border,
    },
    placeOrderText: {
        color: colors.card,
        fontSize: typography.body,
        fontWeight: "800",
        marginLeft: spacing.xs,
    },
});
