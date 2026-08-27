import type { Character, Card } from '../types/game';
import React from 'react';

interface BattleStatsProps {
  player: Character;
  enemy: Character;
  currentEnergy: number;
  maxEnergy: number;
  gold: number;
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
}

export const BattleStats: React.FC<BattleStatsProps> = ({
  player,
  enemy,
  currentEnergy,
  maxEnergy,
  gold,
  deck,
  hand,
  discardPile,
}) => {
  return (
    <>
      <div>
        <h2>Oyuncu</h2>
        <p>Can: {player.mevcutCan} / {player.maksimumCan}</p>
        <p>Zırh Sınıfı (AC): {player.zirhSinifi}</p>
        <p>Güç Çarpanı: {player.gucCarpani}</p>
        <p>Enerji: {currentEnergy} / {maxEnergy}</p>
        <p>Altın: {gold}</p>
        <p>Destek: {deck.length} | El: {hand.length} | Mezarlık: {discardPile.length}</p>
      </div>

      <div>
        <h2>Düşman</h2>
        <p>Can: {enemy.mevcutCan} / {enemy.maksimumCan}</p>
        <p>Zırh Sınıfı (AC): {enemy.zirhSinifi}</p>
        <p>Güç Çarpanı: {enemy.gucCarpani}</p>
      </div>
    </>
  );
};