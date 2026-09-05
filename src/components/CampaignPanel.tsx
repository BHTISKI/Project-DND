import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../state/store';
import { acts, classes, endings } from '../content/campaign';
import { relics } from '../content/relics';
import { actNumber } from '../engine/campaignResolver';

export function CampaignPanel() {
  const supplies = useGameStore(s => `Can ${s.player.mevcutCan}/${s.player.maksimumCan} · ${s.gold} altın`);
  const { campaign: c, runFloor, metaVictories, gamePhase, configureCampaign, chooseCampaignOutcome, chooseRelic } = useGameStore(useShallow(s => ({
    campaign: s.campaign, runFloor: s.runFloor, metaVictories: s.metaVictories, gamePhase: s.gamePhase,
    configureCampaign: s.configureCampaign, chooseCampaignOutcome: s.chooseCampaignOutcome, chooseRelic: s.chooseRelic,
  })));
  const [ascension, setAscension] = useState(0);
  if (!c) return null;
  const act = acts[actNumber(runFloor) - 1];
  if (!c.configured) return <section className="campaign-panel" aria-label="Sefer hazırlığı">
    <span className="eyebrow">Üç perde · On sekiz durak</span><h2>Geride bıraktığın ses</h2>
    <p>Adını hatırlıyorsun; sesini değil. Kervan yolunun sonunda, dünyanın hatıralarını ören Makara bekliyor. Söyleyemediğin her cümle elinde bir karta dönüşüyor. Başkalarının isimlerini korumak da silmek de senin elinde.</p>
    <label className="campaign-difficulty">Zorluk <select value={ascension} onChange={e => setAscension(Number(e.target.value))}>
      {Array.from({ length: Math.min(5, Math.floor(metaVictories / 6)) + 1 }, (_, i) => <option value={i} key={i}>{i === 0 ? 'İlk yolculuk' : `Yükseliş ${i} · düşman canı +%${i * 8}`}</option>)}
    </select></label><p className="campaign-note">Her 6 toplam savaş zaferi bir Yükseliş açar. Her 2 Yükselişte düşman vuruşu +1 artar.</p>
    <div className="campaign-grid">{classes.map(hero => <button type="button" className="phase-choice" key={hero.id} disabled={metaVictories < hero.unlock} onClick={() => configureCampaign(hero.id, ascension)}>
      <strong>{hero.name}</strong><span>{hero.detail}</span><small>{metaVictories < hero.unlock ? `${hero.unlock} toplam zafer gerekir · şu an ${metaVictories}` : 'Bu yola çık →'}</small>
    </button>)}</div>
  </section>;
  if (c.ending) { const ending = endings[c.ending]; return <section className="campaign-panel campaign-ending" aria-label="Sefer sonu">
    <span className="eyebrow">Üçüncü perde tamamlandı</span><h2>{ending.title}</h2><p>{ending.text}</p><p>{ending.condition}</p>
    <p>Merhamet {c.mercy} · Yozlaşma {c.corruption} · Mühür {c.seals.length}/3</p><p>Yeni yolculuk için Menü → Yeni macera. Açılan sınıflar ve Yükseliş seviyeleri korunur.</p>
    <details><summary>Yolculuğun izleri</summary><ol>{c.journal.map((entry, i) => <li key={i}>{entry}</li>)}</ol></details>
  </section>; }
  return <section className="campaign-panel" aria-label="Sefer durumu">
    <div className="campaign-heading"><strong>{act.number}. perde · {act.name}</strong><span>Durak {runFloor % 6 + 1}/6 · Yükseliş {c.ascension}</span></div>
    {gamePhase !== 'combat' && <p>{act.environment}</p>}
    {gamePhase !== 'combat' && <p className="campaign-note">{supplies}</p>}
    <details><summary>Yolculuğun izleri · {c.relics.length} emanet</summary>
      <p>Merhamet {c.mercy} · Yozlaşma {c.corruption} · Mühür {c.seals.length}/3</p>
      {c.relics.map(id => { const relic = relics.find(r => r.id === id); return relic && <p key={id}><strong>{relic.name}:</strong> {relic.detail}</p>; })}
      <ol>{c.journal.slice(-8).map((entry, i) => <li key={i}>{entry}</li>)}</ol>
    </details>
    {c.choicePending && <><h3>Silahlar sustu</h3><p>Rakibinin hatırası elinde. Onu nasıl bırakacaksın?</p><div className="campaign-grid">
      <button className="phase-choice" type="button" onClick={() => chooseCampaignOutcome('mercy')}><strong>İsmini koru</strong><span>3 can yenile. Merhamet +1.</span></button>
      <button className="phase-choice" type="button" onClick={() => chooseCampaignOutcome('plunder')}><strong>Hatırasını al</strong><span>20 altın kazan. Yozlaşma +1.</span></button>
    </div></>}
    {c.relicOffers.length > 0 && <><h3>Yanında bir emanet taşı</h3><div className="campaign-grid">{c.relicOffers.map(id => { const relic = relics.find(r => r.id === id)!; return <button className="phase-choice" type="button" key={id} onClick={() => chooseRelic(id)}><strong>{relic.name}</strong><span>{relic.detail}</span></button>; })}</div></>}
  </section>;
}

export function CampaignEvent() {
  const gold = useGameStore(s => s.gold);
  const resolveEvent = useGameStore(s => s.resolveEvent);
  return <section className="campaign-panel" aria-label="Hatıra tezgâhı"><h3>Sahipsiz bir isim</h3>
    <p>“Bu mühür bana ait değil,” diyor tezgâhtar. “Sahibini bulacak birine on iki altına veririm. Ya da sen bana bir hatıranı satarsın. İkimiz de yolumuza devam ederiz; birimiz biraz daha eksik.”</p>
    <div className="campaign-grid">
      <button type="button" className="phase-choice" disabled={gold < 12} onClick={() => resolveEvent(0)}><strong>Mührü sahibine götür</strong><span>12 altın öde. Bu perdenin mührünü ve 1 merhamet kazan. Aynı perde ikinci mühür vermez.</span></button>
      <button type="button" className="phase-choice" onClick={() => resolveEvent(1)}><strong>Bir hatıranı sat</strong><span>35 altın, 1 yozlaşma. Destene tur sonunda 1 saf hasar veren Borç Senedi eklenir.</span></button>
      <button type="button" className="phase-choice" onClick={() => resolveEvent(2)}><strong>Sessizce geç</strong><span>Bir bedel ödemeden yola devam et.</span></button>
    </div></section>;
}
