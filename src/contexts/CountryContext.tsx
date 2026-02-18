import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Country = 'kosovo' | 'albania' | '';

interface CountryContextValue {
  country: Country;
  setCountry: (c: Country) => void;
}

const CountryContext = createContext<CountryContextValue>({
  country: '',
  setCountry: () => {},
});

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(() => {
    return (localStorage.getItem('selected_country') as Country) || '';
  });

  const setCountry = (c: Country) => {
    setCountryState(c);
    if (c) localStorage.setItem('selected_country', c);
    else localStorage.removeItem('selected_country');
  };

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export const useCountry = () => useContext(CountryContext);
