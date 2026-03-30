import React, { useState, useRef, useEffect, useCallback } from 'react';

// All towns in Regions I, II & CAR — " City" suffix stripped for display.
// The backend LIKE search still matches the full DB value (e.g. "Tuguegarao City").
const ALL_TOWNS = [
  // Region I – Ilocos Norte
  'Adams','Bacarra','Badoc','Bangui','Banna','Batac City','Burgos','Carasi',
  'Currimao','Dingras','Dumalneg','Laoag City','Marcos','Nueva Era','Pagudpud',
  'Paoay','Pasuquin','Piddig','Pinili','San Nicolas','Sarrat','Solsona','Vintar',
  // Ilocos Sur
  'Alilem','Banayoyo','Bantay','Cabugao','Candon City','Caoayan','Cervantes',
  'Galimuyod','Gregorio del Pilar','Lidlidda','Magsingal','Nagbukel','Narvacan',
  'Quirino','Salcedo','San Emilio','San Esteban','San Ildefonso','San Juan',
  'San Vicente','Santa','Santa Catalina','Santa Cruz','Santa Lucia','Santa Maria',
  'Santiago','Santo Domingo','Sigay','Sinait','Sugpon','Suyo','Tagudin','Vigan City',
  // La Union
  'Agoo','Aringay','Bacnotan','Bagulin','Balaoan','Bangar','Bauang','Caba','Luna',
  'Naguilian','Pugo','Rosario','San Fernando City','San Gabriel','San Juan',
  'Santo Tomas','Santol','Sudipen','Tubao',
  // Pangasinan
  'Aguilar','Alcala','Anda','Asingan','Balungao','Bani','Basista','Bautista',
  'Bayambang','Binalonan','Binmaley','Bugallon','Calasiao','Dagupan City','Dasol',
  'Infanta','Labrador','Laoac','Lingayen','Mabini','Malasiqui','Manaoag',
  'Mangaldan','Mangatarem','Mapandan','Natividad','Pozorrubio','Rosales',
  'San Carlos City','San Fabian','San Jacinto','San Manuel','San Nicolas',
  'San Quintin','Santa Barbara','Sison','Sual','Tayug','Umingan','Urbiztondo',
  'Urdaneta City','Villasis',
  // Region II – Batanes
  'Basco','Itbayat','Ivana','Mahatao','Sabtang','Uyugan',
  // Cagayan
  'Abulug','Alcala','Allacapan','Amulung','Aparri','Baggao','Ballesteros',
  'Buguey','Calayan','Claveria','Enrile','Gattaran','Gonzaga','Iguig','Lal-lo',
  'Lasam','Lupi','Pamplona','Peñablanca','Piat','Rizal','Sanchez-Mira',
  'Santa Ana','Santa Praxedes','Santa Teresita','Santo Niño','Solana','Tuao',
  'Tuguegarao City',
  // Isabela
  'Alicia','Angadanan','Aurora','Benito Soliven','Cabagan','Cabatuan',
  'Cauayan City','Cordon','Delfin Albano','Dinapigue','Divilacan','Echague',
  'Gamu','Jones','Maconacon','Mallig','Palanan','Quezon','Ramon',
  'Reina Mercedes','Roxas','San Agustin','San Guillermo','San Isidro',
  'San Manuel','San Mariano','San Mateo','San Pablo','Santo Tomas',
  'Tumauini','Ilagan City',
  // Nueva Vizcaya
  'Alfonso Castañeda','Ambaguio','Aritao','Bagabag','Bambang','Bayombong',
  'Diadi','Dupax del Norte','Dupax del Sur','Kayapa','Kasibu','Lamut',
  'Nagtipunan','Santa Fe','Solano','Villaverde',
  // Quirino
  'Aglipay','Cabarroguis','Diffun','Maddela','Saguday',
  // CAR – Abra
  'Bangued','Boliney','Bucay','Bucloc','Daguioman','Danglas','Dolores',
  'La Paz','Lacub','Lagangilang','Lagayan','Langiden','Licuan-Baay','Luba',
  'Malibcong','Manabo','Peñarrubia','Pidigan','Pilar','Sallapadan',
  'San Isidro','San Juan','San Quintin','Tayum','Tineg','Tubo','Villaviciosa',
  // Apayao
  'Calanasan','Conner','Flora','Kabugao','Luna','Pudtol','Santa Marcela',
  // Benguet
  'Atok','Baguio City','Bakun','Bokod','Buguias','Itogon','Kabayan',
  'Kapangan','Kibungan','La Trinidad','Mankayan','Sablan','Tuba','Tublay',
  // Ifugao
  'Aguinaldo','Alfonso Lista','Asipulo','Banaue','Hingyon','Hungduan',
  'Kiangan','Lagawe','Mayoyao','Tinoc',
  // Kalinga
  'Balbalan','Lubuagan','Pasil','Pinukpuk','Tabuk City','Tanudan','Tinglayan',
  // Mountain Province
  'Bauko','Besao','Bontoc','Natonin','Paracelis','Sabangan','Sadanga','Sagada','Tadian',
].sort();

export const TOWNS = [...new Set(ALL_TOWNS.map((t) => t.replace(/ City$/i, '').trim()))].sort();

/**
 * Props:
 *   value       – controlled input value
 *   onChange    – called with new string as user types
 *   onSearch    – called with final string when user selects or presses Enter
 *   inputRef    – optional ref forwarded to <input>
 *   placeholder – optional placeholder text
 */
export default function CityAutocomplete({
  value,
  onChange,
  onSearch,
  inputRef,
  placeholder = 'Enter town or city…',
}) {
  const [open, setOpen]             = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef                  = useRef(null);

  const suggestions = value.trim().length > 0
    ? TOWNS.filter((t) => t.toLowerCase().startsWith(value.trim().toLowerCase())).slice(0, 10)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectSuggestion = useCallback((town) => {
    onChange(town);
    setOpen(false);
    setHighlighted(-1);
    onSearch(town);
  }, [onChange, onSearch]);

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        setHighlighted(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted((h) => Math.max(h - 1, -1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <span style={{
        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '1rem', pointerEvents: 'none', color: 'var(--color-text-muted)', zIndex: 1,
      }}>📍</span>

      <input
        ref={inputRef}
        type="text"
        className="form-control"
        style={{ paddingLeft: '38px', fontSize: '1rem' }}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
      />

      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', margin: 0, padding: '4px 0',
          listStyle: 'none', maxHeight: '300px', overflowY: 'auto',
        }}>
          {suggestions.map((town, i) => {
            const matchLen = value.trim().length;
            const isActive = i === highlighted;
            return (
              <li
                key={town}
                onMouseDown={() => selectSuggestion(town)}
                onMouseEnter={() => setHighlighted(i)}
                style={{
                  padding: '9px 16px', cursor: 'pointer', fontSize: '0.9rem',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1e40af' : 'var(--color-text)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '0.78rem', minWidth: '14px' }}>📍</span>
                <span>
                  <strong>{town.slice(0, matchLen)}</strong>{town.slice(matchLen)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
