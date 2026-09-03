// Audit-only browser function. Run through browser evaluate on the local Vite dev server.
// Uses controlled state and restores store, timers, RNG, and the two meta storage keys.
export default async () => {
const {useGameStore:S}=await import('/src/state/store.ts');
const {sampleCardDefs}=await import('/src/types/game.ts');
const {SeededRNG}=await import('/src/utils/rng.ts');
const initial=S.getInitialState(), saved=S.getState(), random=Math.random, timeout=window.setTimeout;
const metaKeys=['metaGold','metaVictories'], meta=metaKeys.map(k=>localStorage.getItem(k));
const results=[];
const card=(name,id=name)=>({...sampleCardDefs.find(c=>c.isim===name),id});
const reset=(patch={})=>S.setState({...initial,initialized:true,playerName:'İnceleme',starterDraftComplete:true,gamePhase:'combat',player:{...initial.player,mevcutCan:100,maksimumCan:100},enemy:{...initial.enemy,mevcutCan:100,maksimumCan:100},enemyBehavior:'standard',hand:[],deck:[],discardPile:[],battleLogs:[],...patch},true);
try {
Math.random=()=>0.5; window.setTimeout=()=>0;
reset({gamePhase:'deckBuild',draftBudget:6,draftPicks:0,draftOptions:[card('Kaderin Çekilişi'),card('Buhar Nefesi'),card('Hızlı Saldırı'),card('Kalkan Sihri'),card('Ateş Topu')]});
S.getState().chooseDraftCard('Kaderin Çekilişi');S.getState().chooseDraftCard('Buhar Nefesi');
results.push({case:'draft_softlock_legendary_uncommon',phase:S.getState().gamePhase,picks:S.getState().draftPicks,budget:S.getState().draftBudget,remaining:S.getState().draftOptions.map(c=>c.rarity)});
reset({playerBlock:5,hand:[{...card('Kalkan Sihri'),effects:[{kind:'block',amount:4}]}]});S.getState().playCard('Kalkan Sihri');
results.push({case:'block_accumulation',before:5,cardAmount:4,after:S.getState().playerBlock});
reset({enemyBlock:10,hand:[card('Hızlı Saldırı')]});S.getState().playCard('Hızlı Saldırı');
results.push({case:'enemy_block_remainder',before:10,damageBeforeBlock:5,after:S.getState().enemyBlock,enemyHP:S.getState().enemy.mevcutCan});
reset({hand:[card('Kaderin Çekilişi')],discardPile:[card('Hızlı Saldırı')]});S.getState().playCard('Kaderin Çekilişi');
results.push({case:'draw_empty_pile',hand:S.getState().hand.length,discard:S.getState().discardPile.length,log:S.getState().battleLogs.at(-1)});
reset({player:{...initial.player,mevcutCan:1},enemySkipNextTurn:true,playerStatuses:[{id:'poisoned',duration:2,stacks:1,value:2}]});S.getState().endTurn();
results.push({case:'poison_lethal',hp:S.getState().player.mevcutCan,phase:S.getState().gamePhase});
reset({player:{...initial.player,mevcutCan:1},enemySkipNextTurn:true,hand:[card('Körlük Mührü')]});S.getState().endTurn();
results.push({case:'curse_lethal_skip_enemy',hp:S.getState().player.mevcutCan,phase:S.getState().gamePhase});
reset({gamePhase:'gameOver',maxEnergy:1,currentEnergy:0,isPlayerTurn:false});S.getState().restartGame();
results.push({case:'restart_resets',maxEnergy:S.getState().maxEnergy,currentEnergy:S.getState().currentEnergy,isPlayerTurn:S.getState().isPlayerTurn});
reset({enemy:{...initial.enemy,mevcutCan:1,maksimumCan:100},enemyStatuses:[{id:'poisoned',duration:2,stacks:1,value:2}],gold:50});S.getState().endTurn();
results.push({case:'poison_win_gold',gold:S.getState().gold,phase:S.getState().gamePhase,victories:S.getState().victoryCount});
reset({enemy:{...initial.enemy,mevcutCan:1,maksimumCan:100},hand:[card('Hızlı Saldırı')],gold:50,nodeType:'boss'});S.getState().playCard('Hızlı Saldırı');
results.push({case:'boss_kill_reward',gold:S.getState().gold,rewardCount:S.getState().rewardOptions.length});
reset({gamePhase:'event',runFloor:1,starterDraftComplete:true});S.getState().resolveEvent(2);
const afterEvent=S.getState().enemyStatuses;S.getState().selectNode(S.getState().availableNodes.find(n=>n.type==='combat').id);
results.push({case:'event_debuff_carries_to_next_enemy',afterEvent,afterSelect:S.getState().enemyStatuses});
reset({gamePhase:'event',gold:200,player:{...initial.player,mevcutCan:5}});S.getState().resolveEvent(0);
results.push({case:'event_cost',display:10,actual:200-S.getState().gold});
reset({hand:[card('Yıldırımın Çarpması')]});S.getState().playCard('Yıldırımın Çarpması');
results.push({case:'four_energy_card',phase:S.getState().gamePhase,energy:S.getState().currentEnergy,played:S.getState().discardPile.length,log:S.getState().battleLogs.at(-1)});
let hits=[];
for(const patch of [{},{playerStatuses:[{id:'weakened',duration:2,stacks:3,value:50}]},{player:{...initial.player,advantageCounter:5}},{enemy:{...initial.enemy,mevcutCan:100,maksimumCan:100,zirhSinifi:1000}}]){
reset({...patch,hand:[card('Hızlı Saldırı')]});S.getState().playCard('Hızlı Saldırı');hits.push(100-S.getState().enemy.mevcutCan);}
results.push({case:'damage_normal_weakened_advantage_ac1000',damage:hits});
reset({playerStatuses:[{id:'fortified',duration:3,stacks:1,value:10}]});S.getState().endTurn();
results.push({case:'fortified_effect',playerHP:S.getState().player.mevcutCan,block:S.getState().playerBlock});
const rng=new SeededRNG(123);const samples=Array.from({length:10000},()=>rng.random());const zero=new SeededRNG(0);
results.push({case:'seeded_rng',min:Math.min(...samples),max:Math.max(...samples),zeroSeed:[zero.random(),zero.random(),zero.random()]});
return results;
}finally{Math.random=random;window.setTimeout=timeout;S.setState(saved,true);metaKeys.forEach((k,i)=>meta[i]===null?localStorage.removeItem(k):localStorage.setItem(k,meta[i]));}
};
