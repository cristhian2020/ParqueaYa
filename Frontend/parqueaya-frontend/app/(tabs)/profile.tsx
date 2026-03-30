// app/(tabs)/profile.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="white" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={[styles.roleBadge, user.role === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeUser]}>
          <Text style={[styles.roleText, user.role === 'owner' ? styles.roleTextOwner : styles.roleTextUser]}>
            {user.role === 'owner' ? 'Dueño de Parqueo' : 'Usuario'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la cuenta</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        {user.phone && (
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Teléfono</Text>
            </View>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Tipo de cuenta</Text>
          </View>
          <Text style={styles.infoValue}>
            {user.role === 'owner' ? 'Dueño de Parqueo' : 'Usuario normal'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reservas</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reservations' as any)}>
          <Ionicons name="calendar-outline" size={20} color="#2196F3" />
          <Text style={styles.menuItemText}>Mis reservas</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {user.role === 'owner' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones de dueño</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/owner?tab=list' as any)}>
            <Ionicons name="business-outline" size={20} color="#2196F3" />
            <Text style={styles.menuItemText}>Mis parqueos registrados</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/owner?tab=register' as any)}>
            <Ionicons name="add-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.menuItemText}>Registrar nuevo parqueo</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color="#666" />
          <Text style={styles.menuItemText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <Text style={styles.menuItemText}>Privacidad</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Text style={styles.menuItemText}>Ayuda y soporte</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#f44336" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Parqueo Bolivia v1.0.0</Text>
        <Text style={styles.footerSubtext}>© 2024 Todos los derechos reservados</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 32,
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleBadgeUser: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  roleBadgeOwner: {
    backgroundColor: '#FF9800',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  roleTextUser: {
    color: 'white',
  },
  roleTextOwner: {
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#ccc',
    marginTop: 4,
  },
});
