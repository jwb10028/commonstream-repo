import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import HomeModal from './components/home_modal';
import Glow from './components/ui/glow';
import Transport from './components/ui/transport';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function HomeScreen() {
  const [queryText, setQueryText] = useState('');
  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  const backgroundColor = useThemeColor({}, 'background');

  const handleVoiceActivation = () => {
    console.log('Voice activation button pressed');
  };

  const handleLoopbackListening = () => {
    console.log('Loopback listening button pressed');
  };

  const handleAddMedia = () => {
    console.log('Add media button pressed');
  };

  const handleQuerySubmit = () => {
    console.log('Query submitted:', queryText);
    setQueryText(''); // Clear the text after submission
  };

  return (
    <ThemedView style={styles.container}>
      <Glow />
      <View style={styles.content}>
        {/* Audio Transport Controls */}
        <View style={styles.transportWrapper}>
          <Transport />
        </View>
        
        {/* LLM-style Query Box */}
        <View style={[styles.queryContainer, { borderColor, backgroundColor }]}>
          <TextInput
            style={[styles.queryInput, { color: borderColor }]}
            placeholder="Ask me anything..."
            placeholderTextColor={placeholderColor}
            value={queryText}
            onChangeText={setQueryText}
            onSubmitEditing={handleQuerySubmit}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleQuerySubmit}
          >
            <Ionicons name="paper-plane" size={20} color={borderColor} />
          </TouchableOpacity>
        </View>
        
        {/* Circular Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.circularButton, { backgroundColor: 'white' }]}
            onPress={handleVoiceActivation}
          >
            <Ionicons name="mic" size={24} color={borderColor} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.circularButton, { backgroundColor: 'white' }]}
            onPress={handleLoopbackListening}
          >
            <Ionicons name="repeat" size={24} color={borderColor} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.circularButton, { backgroundColor: 'white' }]}
            onPress={handleAddMedia}
          >
            <Ionicons name="add-circle" size={24} color={borderColor} />
          </TouchableOpacity>
        </View>
      </View>
      
      <HomeModal 
        visible={true} 
        onClose={() => {}} 
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 330, // Increased from 300 to make query box 10% wider
    width: '100%',
  },
  welcomeText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
  },
  transportWrapper: {
    marginTop: -120, // Increased from -80 to move further up towards top border
    width: '100%', // Ensure full width to match query box
  },
  queryContainer: {
    width: '100%',
    marginTop: 60, // Add top margin to push query box down
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    minHeight: 64, // Reduced from 80 to make it 20% shorter
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8, // For Android shadow
  },
  queryInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 40, // Reduced from 50 to match the shorter container
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  circularButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
