import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface TowerProps {
  health: number;
  maxHealth: number;
  isMain?: boolean;
  isEnemy?: boolean;
}

export const Tower: React.FC<TowerProps> = ({ health, maxHealth, isMain = false, isEnemy = false }) => {
  const healthPercent = (health / maxHealth) * 100;
  
  return (
    <View style={[styles.container, isMain && styles.mainTower]}>
      <View style={[styles.tower, isEnemy ? styles.enemyTower : styles.playerTower]}>
        <Ionicons 
          name={isMain ? 'business' : 'home'} 
          size={isMain ? 32 : 24} 
          color={isEnemy ? Colors.danger : Colors.primary} 
        />
      </View>
      <View style={styles.healthBarContainer}>
        <View 
          style={[
            styles.healthBar, 
            { width: `${healthPercent}%` },
            healthPercent < 30 && styles.healthBarLow
          ]} 
        />
      </View>
      <Text style={styles.healthText}>{Math.round(health)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 60,
  },
  mainTower: {
    width: 80,
  },
  tower: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  playerTower: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  enemyTower: {
    backgroundColor: Colors.danger + '30',
    borderColor: Colors.danger,
  },
  healthBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
    backgroundColor: Colors.healthBar,
    borderRadius: 3,
  },
  healthBarLow: {
    backgroundColor: Colors.danger,
  },
  healthText: {
    color: Colors.text,
    fontSize: 10,
    marginTop: 2,
  },
});
