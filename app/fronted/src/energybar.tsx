import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface EnergyBarProps {
  energy: number;
  maxEnergy?: number;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ energy, maxEnergy = 10 }) => {
  const fullBars = Math.floor(energy);
  const partialFill = (energy - fullBars) * 100;

  return (
    <View style={styles.container}>
      <Ionicons name="flash" size={20} color={Colors.energy} />
      <View style={styles.barsContainer}>
        {[...Array(maxEnergy)].map((_, i) => (
          <View key={i} style={styles.barWrapper}>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.barFill,
                  { 
                    width: i < fullBars ? '100%' : 
                           i === fullBars ? `${partialFill}%` : '0%' 
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.energyText}>{Math.floor(energy)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  barsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  barWrapper: {
    width: 16,
    height: 20,
  },
  barBackground: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.energy,
  },
  energyText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    minWidth: 20,
    textAlign: 'center',
  },
});