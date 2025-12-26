import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { cartAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ItemImage from "../components/ItemImage";
import { colors, spacing, typography, radius, shadow } from "../theme";

export default function CartScreen() {
    const [cart, setCart] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            loadCart();
        }
    }, [isAuthenticated]);

    // Refresh cart when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            if (isAuthenticated) {
                loadCart();
            }
        }, [isAuthenticated])
    );

    const loadCart = async () => {
        try {
            setIsLoading(true);
            const response = await cartAPI.getCart();
            if (response.data.success) {
                setCart(response.data.data);
            } else {
                // If cart fetch fails, set empty cart
                setCart({ items: [], total: 0, itemCount: 0 });
            }
        } catch (error) {
            console.error("Error loading cart:", error);
            // Set empty cart on error instead of showing alert repeatedly
            setCart({ items: [], total: 0, itemCount: 0 });
        } finally {
            setIsLoading(false);
        }
    };

    const updateItemQuantity = async (itemId, newQuantity) => {
        try {
            const response = await cartAPI.updateCartItem(itemId, {
                quantity: newQuantity,
            });
            console.log("Update item response:", response);
            if (response.data.success) {
                setCart(response.data.data);
            }
        } catch (error) {
            console.error("Error updating item:", error);
            Alert.alert("Error", "Failed to update item");
        }
    };

    const removeItem = async (itemId) => {
        Alert.alert(
            "Remove Item",
            "Are you sure you want to remove this item from cart?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await cartAPI.removeFromCart(
                                itemId
                            );
                            if (response.data.success) {
                                setCart(response.data.data);
                            }
                        } catch (error) {
                            console.error("Error removing item:", error);
                            Alert.alert("Error", "Failed to remove item");
                        }
                    },
                },
            ]
        );
    };

    const clearCart = async () => {
        Alert.alert(
            "Clear Cart",
            "Are you sure you want to clear all items from cart?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await cartAPI.clearCart();
                            if (response.data.success) {
                                setCart(response.data.data);
                            }
                        } catch (error) {
                            console.error("Error clearing cart:", error);
                            Alert.alert("Error", "Failed to clear cart");
                        }
                    },
                },
            ]
        );
    };

    const handleCheckout = () => {
        if (!cart || !cart.items || cart.items.length === 0) {
            Alert.alert("Empty Cart", "Add items to cart before checkout");
            return;
        }
        navigation.navigate("Checkout");
    };

    const renderCartItem = ({ item }) => {
        if (!item) {
            return null; // Skip rendering if item is undefined/null
        }

        return (
            <View style={styles.cartItem}>
                <ItemImage item={item} size={50} style={styles.itemImage} />

                <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {item?.name || "Unknown Item"}
                    </Text>
                    <Text style={styles.itemPrice}>₹{item?.price || 0}</Text>
                    <Text style={styles.itemUnit}>{item?.unit || "unit"}</Text>
                </View>

                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                            updateItemQuantity(
                                item?.id,
                                (item?.quantity || 1) - 1
                            )
                        }
                    >
                        <Ionicons name="remove" size={16} color="#007AFF" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>
                        {item?.quantity || 0}
                    </Text>

                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() =>
                            updateItemQuantity(
                                item?.id,
                                (item?.quantity || 1) + 1
                            )
                        }
                    >
                        <Ionicons name="add" size={16} color="#007AFF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item?.id)}
                >
                    <Ionicons name="trash" size={20} color="#ff4444" />
                </TouchableOpacity>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name="basket-outline"
                    size={80}
                    color={colors.border}
                />
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <Text style={styles.emptySubtext}>
                    Add some items to get started
                </Text>
                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => navigation.navigate("Home")}
                >
                    <Text style={styles.shopButtonText}>Browse items</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={cart?.items?.filter((item) => item != null) || []}
                renderItem={renderCartItem}
                keyExtractor={(item) =>
                    item?.id?.toString() || Math.random().toString()
                }
                contentContainerStyle={styles.cartList}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.summaryShell}>
                <View style={styles.summaryRow}>
                    <View>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summarySub}>
                            Items {cart?.itemCount || 0}
                        </Text>
                    </View>
                    <Text style={styles.summaryValue}>₹{cart?.total || 0}</Text>
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={clearCart}
                >
                    <Ionicons name="trash" size={16} color={colors.danger} />
                    <Text style={styles.clearButtonText}>Clear cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={handleCheckout}
                >
                    <Text style={styles.checkoutButtonText}>
                        Checkout • ₹{cart.total}
                    </Text>
                    <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={colors.card}
                    />
                </TouchableOpacity>
            </View>
        </View>
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
        padding: 20,
    },
    emptyText: {
        fontSize: typography.h2,
        fontWeight: "800",
        color: colors.text,
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: typography.body,
        color: colors.textMuted,
        marginBottom: spacing.lg,
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
    cartList: {
        padding: spacing.md,
    },
    cartItem: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        ...shadow.soft,
    },
    itemImage: {
        marginRight: spacing.md,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: typography.body,
        fontWeight: "700",
        color: colors.text,
        marginBottom: spacing.xs,
    },
    itemPrice: {
        fontSize: typography.h3,
        fontWeight: "800",
        color: colors.primary,
        marginBottom: 2,
    },
    itemUnit: {
        fontSize: typography.small,
        color: colors.textMuted,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: spacing.sm,
    },
    quantityButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.card,
        ...shadow.soft,
    },
    quantityText: {
        fontSize: typography.h3,
        fontWeight: "800",
        marginHorizontal: spacing.md,
        minWidth: 30,
        textAlign: "center",
        color: colors.text,
    },
    removeButton: {
        padding: spacing.xs,
    },
    summaryContainer: {
        backgroundColor: "#fff",
    },
    summaryShell: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        ...shadow.soft,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    summaryLabel: {
        fontSize: typography.body,
        color: colors.text,
        fontWeight: "700",
    },
    summarySub: {
        fontSize: typography.small,
        color: colors.textMuted,
    },
    summaryValue: {
        fontSize: typography.h2,
        fontWeight: "800",
        color: colors.text,
    },
    clearButton: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.xs,
    },
    clearButtonText: {
        color: colors.danger,
        fontSize: typography.body,
        fontWeight: "700",
    },
    checkoutButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        ...shadow.card,
    },
    checkoutButtonText: {
        color: colors.card,
        fontSize: typography.body,
        fontWeight: "800",
    },
});
