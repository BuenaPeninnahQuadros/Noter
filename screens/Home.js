import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

export default function Home({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleMenuOption = (option) => {
    setMenuVisible(false); // Close menu
    if (option === 'view') navigation.navigate('ListNotes');
    else if (option === 'create') navigation.navigate('CreateNote');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleMenu}>
            <Icon name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>All Notes</Text>
          <TouchableOpacity onPress={() => console.log('Search pressed')}>
            <Icon name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('view')}>
              <Text style={styles.menuText}>View Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuOption('create')}>
              <Text style={styles.menuText}>Create Notes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
          <Image
            source={require('../assets/image2.png')}
            style={styles.illustration}
            resizeMode="contain"
          />

          <Text style={styles.mainTitle}>Create Your First Note</Text>
          <Text style={styles.description}>
            Add a note about anything (your thoughts on climate change, or your history essay)
            and share it with the world.
          </Text>

          <TouchableOpacity
            style={styles.createNoteButton}
            onPress={() => navigation.navigate("CreateNote")}
          >
            <Text style={styles.createNoteButtonText}>Create A Note</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fcedceff' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 25,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  
  /* Dropdown Menu Styles */
  menu: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 5,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
  menuText: { fontSize: 16, color: '#333' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  illustration: { width: '100%', height: 250, marginBottom: 40 },
  mainTitle: { fontSize: 24, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 10 },
  description: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 40, maxWidth: 300 },
  createNoteButton: {
    backgroundColor: '#E76B5A',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createNoteButtonText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});
