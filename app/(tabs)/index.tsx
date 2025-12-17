import React, { useEffect, useState, useRef } from 'react';
import { 
  TextInput, 
  Pressable, 
  FlatList, 
  Keyboard, 
  View, 
  StyleSheet, 
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // or use the vector-icons from package.json
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

// Database & Migrations
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from "@/drizzle/client";
import migrations from "@/drizzle/migrations";
import { desc } from 'drizzle-orm';

// Components (Using the existing theme components to handle Dark/Light mode nicely)
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { wins } from '@/drizzle/schema';

export default function HomeScreen() {
  const { success, error } = useMigrations(db, migrations);
  
  // App State
  const [text, setText] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const explosionRef = useRef<ConfettiCannon>(null);

  // 1. Load Data
  const loadWins = async () => {
    try {
      const data = await db.select().from(wins).orderBy(desc(wins.createdAt));
      setItems(data);
    } catch (e) {
      console.log('Error loading wins:', e);
    }
  };

  useEffect(() => {
    if (success) {
      loadWins();
    }
  }, [success]);

  // 2. The Logic: Add Win + Trigger Dopamine
  const handleAddWin = async () => {
    if (!text.trim()) return;

    // A. Trigger Physical Rewards
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    explosionRef.current?.start();

    // B. Optimistic Update (Instant feedback in UI)
    const tempId = Math.random();
    const newWin = {
      id: tempId,
      title: text,
      createdAt: new Date().toISOString(),
      category: 'general'
    };
    
    // Add to top of list instantly
    setItems(prev => [newWin, ...prev]);
    const winText = text; // cache for DB call
    setText('');
    
    // C. Database Persist
    try {
      await db.insert(wins).values({ 
        title: winText, 
        category: 'general' 
      });
      // Optionally reload to get real ID, or trust optimistic
      // loadWins(); 
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  // ------------------------------------------------------------
  // Render: Loading / Error States
  // ------------------------------------------------------------
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText type="subtitle" style={{color: 'red'}}>Migration Error</ThemedText>
        <ThemedText>{error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!success) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Setting up database...</ThemedText>
      </ThemedView>
    );
  }

  // ------------------------------------------------------------
  // Render: Main App (The "Win Stream")
  // ------------------------------------------------------------
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Confetti sits on top layer */}
        <ConfettiCannon 
          count={100} 
          origin={{x: -10, y: 0}} 
          autoStart={false} 
          ref={explosionRef}
          fadeOut={true} 
          fallSpeed={3000}
        />

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">My Wins</ThemedText>
          <ThemedText style={{ opacity: 0.6 }}>What did you do today?</ThemedText>
        </View>

        {/* The Feed */}
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInUp.delay(index * 50)} 
              layout={Layout.springify()} 
              style={styles.cardWrapper}
            >
              {/* Checkbox Visual */}
              <View style={styles.checkbox}>
                 <Ionicons name="checkmark-sharp" size={16} color="white" />
              </View>

              {/* Text Content */}
              <View style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
             <View style={{ marginTop: 50, alignItems: 'center', opacity: 0.5 }}>
                <ThemedText>No wins recorded today.</ThemedText>
                <ThemedText>Do something small to start!</ThemedText>
             </View>
          }
        />

        {/* Input Bar */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="I just..."
              placeholderTextColor="#888"
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleAddWin}
              returnKeyType="done"
            />
            <Pressable onPress={handleAddWin} style={({pressed}) => [styles.sendButton, pressed && { opacity: 0.8 }]}>
              <Ionicons name="arrow-up" size={20} color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for input area
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ade80', // Green success color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ade80',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  inputContainer: {
    padding: 16,
    // Background gradient or simple fill works nicely here
    // But since ThemedView handles bg, we just add borders if needed
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)', // Subtle transaprent bg
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#888', // This needs to adapt to theme in a real app, assuming default contrast for now
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6', // Brand Blue or Theme Color
    justifyContent: 'center',
    alignItems: 'center',
  }
});