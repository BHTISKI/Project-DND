import React, { useState } from 'react';
import { useGameStore } from '../state/store';

interface NameInputProps {
  onNameSubmit: () => void;
}

const NameInput: React.FC<NameInputProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setPlayerName = useGameStore(state => state.setPlayerName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Lütfen bir isim girin.');
      return;
    }

    if (name.trim().length < 2) {
      setError('İsim en az 2 karakter olmalıdır.');
      return;
    }

    if (name.trim().length > 20) {
      setError('İsim en fazla 20 karakter olabilir.');
      return;
    }

    setIsSubmitting(true);
    setPlayerName(name.trim());

    onNameSubmit();
  };

  return (
    <div className="name-input-container">
      <div className="name-input-box">
        <div className="name-input-header">
          <h2>Karakterinizin İsmini Belirleyin</h2>
          <p className="name-input-flavor">
            Bu ad, macera boyunca karakterini temsil edecek.
          </p>
        </div>

        {error && (
          <div className="name-input-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="name-input-form">
          <div className="name-input-field">
            <label htmlFor="playerName" className="input-label">
              Karakter İsmi
            </label>
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ejderha Öldürücü, Gün ışığı Avcısı..."
              maxLength={20}
              disabled={isSubmitting}
              className={`name-input ${isSubmitting ? 'submitting' : ''}`}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="name-input-button"
          >
            {isSubmitting ? 'İsim Belirleniyor...' : 'Maceraya Başla'}
          </button>
        </form>

        <div className="name-input-footer">
          <p className="name-input-tip">
            2–20 karakter kullanabilirsin. Kelimeler arasında boşluk bırakabilirsin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NameInput;
