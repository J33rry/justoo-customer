import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const userData = await AsyncStorage.getItem("user");

            if (token && userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
                // Set token in API headers
                api.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (phone, password) => {
        try {
            const response = await api.post("/auth/login", { phone, password });
            console.log(response.data);
            if (response.data.success) {
                const { customer, token } = response.data.data || {};

                // Guard missing token from backend to avoid writing undefined
                if (!token) {
                    console.warn(
                        "Login succeeded but token is missing in response payload"
                    );
                    return {
                        success: false,
                        message: "Login failed: missing token from server",
                    };
                }

                await AsyncStorage.setItem("token", token);
                await AsyncStorage.setItem(
                    "user",
                    JSON.stringify(customer || {})
                );

                setUser(customer || null);
                setIsAuthenticated(true);
                api.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${token}`;

                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Login failed",
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post("/auth/register", userData);

            if (response.data.success) {
                const { customer, token } = response.data.data || {};

                if (!token) {
                    console.warn(
                        "Register succeeded but token is missing in response payload"
                    );
                    return {
                        success: false,
                        message:
                            "Registration failed: missing token from server",
                    };
                }

                await AsyncStorage.setItem("token", token);
                await AsyncStorage.setItem(
                    "user",
                    JSON.stringify(customer || {})
                );

                setUser(customer || null);
                setIsAuthenticated(true);
                api.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${token}`;

                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error("Register error:", error);
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Registration failed",
            };
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            setUser(null);
            setIsAuthenticated(false);
            delete api.defaults.headers.common["Authorization"];
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await api.put("/auth/profile", profileData);

            if (response.data.success) {
                const updatedUser = response.data.data;
                setUser(updatedUser);
                await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error("Update profile error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Update failed",
            };
        }
    };

    const value = {
        isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
