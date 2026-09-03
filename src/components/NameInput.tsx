import React, { useState } from 'react';
import { useGameStore } from '../state/store';

interface NameInputProps {
  onNameSubmit: () => void;
}

const NameInput: React.FC<NameInputProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');
  const setPlayerName = useGameStore(state => state.setPlayerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayerName(name.trim());
      onNameSubmit();
    }
  };

  return (
    <div className="name-input-container">
      <div className="name-input-box">
        <h2>Oyuncu İsmini Gir</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsminizi girin..."
            maxLength={20}
          />
          <button type="submit" disabled={!name.trim()}>Oyuna Başla</button>
        </form>
      </div>
    </div>
  );
};

export default NameInput;