// Bu dosya src/components/ShopPanel.test.tsx için ilgili kodları içerir.
// ShopPanel bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopPanel } from './ShopPanel';
import { useGameStore } from '../state/store';
import { setupMockRandom, resetMockRandom } from '../testUtils';
import { cleanup } from '@testing-library/react';
import type { Card } from '../types/game';
import { initialPosture } from '../mechanics/posture';

describe('ShopPanel', () => {
  const baseCardCommon: Card = {
    id: 'card-common',
    isim: 'Kart Sıradan',
    tip: 'saldırı',
    manaBedeli: 1,
    baseHasar: 2,
    effects: [{ kind: 'attack', amount: 3 }],
    isUpgraded: false,
    rarity: 'common',
    tags: ['attack'],
  };

  const baseCardUncommon: Card = {
    id: 'card-uncommon',
    isim: 'Kart Seçkin',
    tip: 'savunma',
    manaBedeli: 2,
    baseHasar: 0,
    effects: [{ kind: 'block', amount: 2 }],
    isUpgraded: false,
    rarity: 'uncommon',
    tags: ['defense'],
  };

  const baseCardRare: Card = {
    id: 'card-rare',
    isim: 'Kart Nadir',
    tip: 'yetenek',
    manaBedeli: 0,
    baseHasar: 0,
    effects: [{ kind: 'energy', amount: 2 }],
    isUpgraded: false,
    rarity: 'rare',
    tags: ['skill'],
  };

  const baseCardLegendary: Card = {
    id: 'card-legendary',
    isim: 'Kart Efsanevi',
    tip: 'saldırı',
    manaBedeli: 3,
    baseHasar: 5,
    effects: [{ kind: 'attack', amount: 4 }],
    isUpgraded: false,
    rarity: 'legendary',
    tags: ['attack'],
  };

  const upgradedCard: Card = {
    id: 'card-common-upgraded',
    isim: 'Kart Sıradan',
    tip: 'saldırı',
    manaBedeli: 1,
    baseHasar: 2,
    effects: [{ kind: 'attack', amount: 3 }],
    isUpgraded: true,
    rarity: 'common',
    tags: ['attack'],
  };

  beforeEach(() => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'shop',
      isPlayerTurn: true,
      player: { id: 'player', isim: 'Ero', mevcutCan: 6, maksimumCan: 10, hasarBonusu: 2, ...initialPosture() },
      enemy: { id: 'enemy', isim: 'Goblin', mevcutCan: 10, maksimumCan: 10, hasarBonusu: 1, ...initialPosture('goblin') },
      maxEnergy: 3,
      currentEnergy: 3,
      deck: [baseCardCommon, baseCardUncommon, baseCardRare, baseCardLegendary, upgradedCard],
      hand: [],
      discardPile: [],
      drawCount: 5,
      gold: 100, // enough for all actions initially
      battleLogs: [],
      rewardOptions: [],
      playerBlock: 0,
      enemyBlock: 0,
      enemySkipNextTurn: false,
      victoryCount: 1, // to test upgrade cost scaling
      enemyIntent: { type: 'attack', estimatedDamage: 0 },
      enemyIntentValue: 0,
      enemyArchetype: 'goblin',
      playerStatuses: [],
      enemyStatuses: [],
      comboChain: [],
      comboCount: 0,
      nextDamageBonus: 0,
    });
    setupMockRandom([0]);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    resetMockRandom();
    vi.restoreAllMocks();
  });

  it('displays heal action with correct cost and status', () => {
    render(<ShopPanel />);
    expect(screen.getByText(/Şifa/i)).toBeInTheDocument();
    expect(screen.getByText(/Canını toparla/i)).toBeInTheDocument();
    expect(screen.getByText("+4 can · 25 altın")).toBeInTheDocument();
    const healButton = screen.getByRole('button', { name: /Satın al/i });
    expect(healButton).toHaveAccessibleName(/Satın al/);
    expect(healButton).not.toBeDisabled(); // gold 100 >= 25
  });

  it('heal button calls healPlayer when clicked and sufficient gold', async () => {
    const healPlayerSpy = vi.spyOn(useGameStore.getState(), 'healPlayer');
    render(<ShopPanel />);

    const healButton = screen.getByRole('button', { name: /Satın al/i });
    await userEvent.click(healButton);
    expect(healPlayerSpy).toHaveBeenCalledTimes(1);
  });

  it('heal button is disabled when insufficient gold', async () => {
    useGameStore.setState({ ...useGameStore.getState(), gold: 20 }); // less than 25
    render(<ShopPanel />);
    const healButton = screen.getByRole('button', { name: /Satın al/i });
    expect(healButton).toBeDisabled();
    expect(healButton).toHaveAccessibleName(/Satın al/);
  });

  it('displays upgrade action for each card in deck', () => {
    render(<ShopPanel />);
    // header
    expect(screen.getByText(/Demirci masası/i)).toBeInTheDocument();
    expect(screen.getByText(/Kart yükselt/i)).toBeInTheDocument();
    // each card should have a row in the upgrade list
    const upgradeList = screen.getByLabelText(/Yükseltilebilir kartlar/);
    // get all card names in the upgrade list
    const cardNames = upgradeList.querySelectorAll('h4');
    expect(cardNames).toHaveLength(5);
    // check that each card name is present
    const expectedNames = ['Kart Sıradan', 'Kart Seçkin', 'Kart Nadir', 'Kart Efsanevi', 'Kart Sıradan']; // note: two Kart Sıradan (one upgraded, one not)
    expect(Array.from(cardNames).map(el => el.textContent)).toEqual(expect.arrayContaining(expectedNames));
  });

  it('upgrade button is enabled when card not upgraded and sufficient gold', async () => {
    const upgradeCardSpy = vi.spyOn(useGameStore.getState(), 'upgradeCard');
    render(<ShopPanel />);
    // common card: baseCost 40, victoryCount=1 -> 44, gold=100 >= 44 -> enabled
    const commonUpgradeButton = screen.getByRole('button', { name: /Kart Sıradan kartını 44 altınla yükselt/ }); // first upgrade button
    expect(commonUpgradeButton).not.toBeDisabled();
    await userEvent.click(commonUpgradeButton);
    expect(upgradeCardSpy).toHaveBeenCalledTimes(1);
    expect(upgradeCardSpy).toHaveBeenCalledWith('card-common');
  });

  it('upgrade button shows correct cost and is disabled when insufficient gold', async () => {
    // set gold to 20, which is less than the cost for common card (44)
    useGameStore.setState({ ...useGameStore.getState(), gold: 20 });
    render(<ShopPanel />);
    const commonUpgradeButton = screen.getAllByRole('button', { name: /Kart Sıradan kartını 44 altınla yükselt/i })[0];
    expect(commonUpgradeButton).toBeDisabled();
    expect(commonUpgradeButton).toHaveAccessibleName(/Kart Sıradan kartını 44 altınla yükselt/);
  });

  it('upgrade button is disabled and shows zaten yükseltilmiş when card is already upgraded', () => {
    render(<ShopPanel />);
    // find the upgraded card button (should be the last one in the upgrade list, or we can find by text)
    const upgradeButtons = screen.getAllByRole('button', { name: /zaten yükseltilmiş/i });
    expect(upgradeButtons).toHaveLength(1);
    const upgradedButton = upgradeButtons[0];
    expect(upgradedButton).toBeDisabled();
    expect(upgradedButton).toHaveAccessibleName(/Kart Sıradan zaten yükseltilmiş/);
  });

  it('upgrade button calls upgradeCard with correct card id when clicked', async () => {
    render(<ShopPanel />);
    // click the uncommon card upgrade button (second card)
    const uncommonUpgradeButton = screen.getByRole('button', { name: /Kart Seçkin kartını 66 altınla yükselt/ });
    expect(uncommonUpgradeButton).not.toBeDisabled();
    await userEvent.click(uncommonUpgradeButton);
    // check that the card is now upgraded in the store
    const { deck } = useGameStore.getState();
    const uncommonCard = deck.find(c => c.id === 'card-uncommon')!;
    expect(uncommonCard.isUpgraded).toBe(true);
  });

  it('displays remove action for each card in deck', () => {
    render(<ShopPanel />);
    // eyebrow
    expect(screen.getByText(/Deste yönetimi/i)).toBeInTheDocument();
    // heading
    expect(screen.getByText(/Desten/i)).toBeInTheDocument();
    expect(screen.getByText(/5 kart/i)).toBeInTheDocument(); // deck length
    const removeButtons = screen.getAllByRole('button', { name: /50 altın karşılığında sil/ });
    expect(removeButtons).toHaveLength(5); // one per card in deck
  });

  it('remove button is enabled when sufficient gold (>=50)', async () => {
    const removeCardSpy = vi.spyOn(useGameStore.getState(), 'removeCardFromDeck');
    render(<ShopPanel />);
    const removeButton = screen.getAllByRole('button', { name: /50 altın karşılığında sil/ })[0];
    expect(removeButton).not.toBeDisabled();
    await userEvent.click(removeButton);
    expect(removeCardSpy).toHaveBeenCalledTimes(1);
    expect(removeCardSpy).toHaveBeenCalledWith('card-common'); // first card in deck
  });

  it('remove button is disabled when insufficient gold (<50)', async () => {
    useGameStore.setState({ ...useGameStore.getState(), gold: 40 });
    render(<ShopPanel />);
    const removeButton = screen.getAllByRole('button', { name: /50 altın karşılığında sil/ })[0];
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAccessibleName(/Kart Sıradan kartını 50 altın karşılığında sil/);
  });

  it('start next combat button calls startNextCombat when clicked', async () => {
    const startNextCombatSpy = vi.spyOn(useGameStore.getState(), 'startNextCombat');
    render(<ShopPanel />);
    const startButton = screen.getByRole('button', { name: /Savaşa geç/i });
    await userEvent.click(startButton);
    expect(startNextCombatSpy).toHaveBeenCalledTimes(1);
  });

  it('upgrade cost scales with victoryCount correctly', () => {
    // test the upgradeCost function indirectly by checking the displayed cost for different victoryCounts
    // We'll set victoryCount to 0, 1, 2 and check the cost for a common card (base 40)
    // victoryCount=0: 40 + 0 = 40
    // victoryCount=1: 40 + floor(40*1*0.1)=40+4=44
    // victoryCount=2: 40 + floor(40*2*0.1)=40+8=48
    // victoryCount=10: 40 + floor(40*10*0.1)=40+40=80
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 0, gold: 1000 });
    const { rerender } = render(<ShopPanel />);
    // victoryCount=0
    const upgradeButtonV0 = screen.getByRole('button', {
      name: /Kart Sıradan kartını 40 altınla yükselt/
    });
    const upgradeRowV0 = upgradeButtonV0.closest('.shop-card-row--upgrade')! as HTMLElement;
    const costSpanV0 = upgradeRowV0.querySelectorAll('span')[1];
    expect(costSpanV0).toHaveTextContent(/40 altın/);

    // victoryCount=1
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 1 });
    rerender(<ShopPanel />);
    const upgradeButtonV1 = screen.getByRole('button', {
      name: /Kart Sıradan kartını 44 altınla yükselt/
    });
    const upgradeRowV1 = upgradeButtonV1.closest('.shop-card-row--upgrade')! as HTMLElement;
    const costSpanV1 = upgradeRowV1.querySelectorAll('span')[1];
    expect(costSpanV1).toHaveTextContent(/44 altın/);

    // victoryCount=2
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 2 });
    rerender(<ShopPanel />);
    const upgradeButtonV2 = screen.getByRole('button', {
      name: /Kart Sıradan kartını 48 altınla yükselt/
    });
    const upgradeRowV2 = upgradeButtonV2.closest('.shop-card-row--upgrade')! as HTMLElement;
    const costSpanV2 = upgradeRowV2.querySelectorAll('span')[1];
    expect(costSpanV2).toHaveTextContent(/48 altın/);

    // victoryCount=10
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 10 });
    rerender(<ShopPanel />);
    const upgradeButtonV10 = screen.getByRole('button', {
      name: /Kart Sıradan kartını 80 altınla yükselt/
    });
    const upgradeRowV10 = upgradeButtonV10.closest('.shop-card-row--upgrade')! as HTMLElement;
    const costSpanV10 = upgradeRowV10.querySelectorAll('span')[1];
    expect(costSpanV10).toHaveTextContent(/80 altın/);
  });

  it('legendary card upgrade cost is calculated correctly', () => {
    // legendary base cost 120
    // victoryCount=0: 120
    // victoryCount=1: 120 + floor(120*1*0.1)=120+12=132
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 0, gold: 1000 });
    const { rerender } = render(<ShopPanel />);
    // Check for victoryCount=0
    const allLegendaryTexts = screen.getAllByText(/Kart Efsanevi/);
    const upgradeList = screen.getByLabelText(/Yükseltilebilir kartlar/);
    const legendaryTextEl = allLegendaryTexts.find(el => upgradeList.contains(el))!;
    const legendaryRow = legendaryTextEl.closest('.shop-card-row--upgrade')! as HTMLElement;
    const costSpan = legendaryRow.querySelectorAll('span')[1];
    const costText = costSpan?.textContent;
    expect(costText).toMatch(/120 altın/);

    // Now update victoryCount to 1
    useGameStore.setState({ ...useGameStore.getState(), victoryCount: 1 });
    rerender(<ShopPanel />);
    // The component should re-render automatically
    const allLegendaryTextsV1 = screen.getAllByText(/Kart Efsanevi/);
    const upgradeListV1 = screen.getByLabelText(/Yükseltilebilir kartlar/);
    const legendaryTextElV1 = allLegendaryTextsV1.find(el => upgradeListV1.contains(el));
    const legendaryRowV1 = legendaryTextElV1?.closest('.shop-card-row--upgrade');
    const costSpanV1 = legendaryRowV1?.querySelectorAll('span')[1];
    const costTextV1 = costSpanV1?.textContent;
    expect(costTextV1).toMatch(/132 altın/);
  });
});
