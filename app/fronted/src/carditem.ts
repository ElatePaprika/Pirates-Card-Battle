import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { Card } from '../stores/gameStore';

interface CardItemProps {
  card: Card;
  onPress?: () => void;
  selected?: boolean;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return Colors.legendary;
    case 'epic': return Colors.epic;
    case 'rare': return Colors.rare;
    default: return Colors.common;
  }
};

const getCharacterIcon = (id: string): keyof typeof Ionicons.glyphMap => {
  const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    luffy: 'flame',
    zoro: 'cut',
    nami: 'thunderstorm',
    sanji: 'flame',
    chopper: 'medkit',
    robin: 'hand-left',
    franky: 'hardware-chip',
    brook: 'musical-notes',
    jinbe: 'water',
    usopp: 'locate',
    ace: 'bonfire',
    law: 'medical',
    marine_soldier: 'shield',
    pirate_mob: 'people',
    kaido: 'planet',
    shanks: 'flash',
  };
  return icons[id] || 'person';
};

export const CardItem: React.FC<CardItemProps> = ({ 
  card, 
  onPress, 
  selected = false,
  showStats = true,
  size = 'medium'
}) => {
  const rarityColor = getRarityColor(card.rarity);
  const sizeStyles = {
    small: { width: 70, height: 90 },
    medium: { width: 100, height: 130 },
    large: { width: 140, height: 180 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles[size],
        { borderColor: rarityColor },
        selected && styles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.costBadge, { backgroundColor: Colors.energy }]}>
        <Text style={styles.costText}>{card.cost}</Text>
      </View>
      
      <View style={[styles.iconContainer, { backgroundColor: rarityColor + '30' }]}>
        <Ionicons name={getCharacterIcon(card.id)} size={size === 'small' ? 24 : size === 'medium' ? 32 : 44} color={rarityColor} />
      </View>
      
      <Text style={[styles.name, size === 'small' && styles.nameSmall]} numberOfLines={1}>
        {card.character_name}
      </Text>
      
      {showStats && size !== 'small' && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="flash" size={12} color={Colors.danger} />
            <Text style={styles.statText}>{card.damage}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart" size={12} color={Colors.healthBar} />
            <Text style={styles.statText}>{card.health}</Text>
          </View>
        </View>
      )}
      
      {card.level && (
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Nv.{card.level}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 4,
  },
  selected: {
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  costBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  costText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  iconContainer: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  nameSmall: {
    fontSize: 9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 4,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
