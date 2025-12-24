import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create axios instance
const api = axios.create({
    baseURL: `http://172.20.10.5:3000/api/customer`,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Log detailed error information for debugging
        console.log("API Error:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });

        if (error.response?.status === 401) {
            // Token expired or invalid
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            // You might want to navigate to login screen here
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post("/auth/login", data),
    register: (data) => api.post("/auth/register", data),
    logout: () => api.post("/auth/logout"),
    getProfile: () => api.get("/auth/profile"),
    updateProfile: (data) => api.put("/auth/profile", data),
    changePassword: (data) => api.put("/auth/change-password", data),
};

// Items API
export const itemsAPI = {
    getItems: (params) => api.get("/items", { params }),
    getItemById: (id) => api.get(`/items/${id}`),
    getCategories: () => api.get("/items/categories"),
    getFeaturedItems: () => api.get("/items/featured"),
    searchItems: (query) => api.get("/items/search", { params: { q: query } }),
    getItemsByCategory: (category, params) =>
        api.get(`/items/category/${category}`, { params }),
    getSuggestions: () => api.get("/items/suggestions"),
    getItemImage: (itemId) => api.get(`/items/${itemId}/image`),
    uploadItemImage: (itemId, imageData) => {
        const formData = new FormData();
        formData.append("image", {
            uri: imageData.uri,
            type: imageData.type || "image/jpeg",
            name: imageData.name || "image.jpg",
        });
        return api.post(`/items/${itemId}/image`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
};

// Cart API
export const cartAPI = {
    getCart: () => api.get("/cart"),
    addToCart: (data) => api.post("/cart/add", data),
    updateCartItem: (itemId, data) => api.put(`/cart/item/${itemId}`, data),
    removeFromCart: (itemId) => api.delete(`/cart/item/${itemId}`),
    clearCart: () => api.delete("/cart"),
    getCartSummary: () => api.get("/cart/summary"),
};

// Orders API
export const ordersAPI = {
    createOrder: (data) => api.post("/orders", data),
    getOrders: (params) => api.get("/orders", { params }),
    getOrderById: (orderId) => api.get(`/orders/${orderId}`),
    cancelOrder: (orderId) => api.put(`/orders/${orderId}/cancel`),
    getOrderStats: () => api.get("/orders/stats"),
};

// Addresses API
export const addressesAPI = {
    getAddresses: () => api.get("/addresses"),
    getAddressById: (addressId) => api.get(`/addresses/${addressId}`),
    getDefaultAddress: () => api.get("/addresses/default"),
    addAddress: (data) => api.post("/addresses", data),
    updateAddress: (addressId, data) =>
        api.put(`/addresses/${addressId}`, data),
    deleteAddress: (addressId) => api.delete(`/addresses/${addressId}`),
    setDefaultAddress: (addressId) =>
        api.put(`/addresses/${addressId}/default`),
    validateAddress: (params) => api.get("/addresses/validate", { params }),
    // checkAddressZone: (params) => api.get("/addresses/zones/check", { params }),
};

export default api;
