import { createContext, useContext, useEffect, useReducer } from 'react';

const STORE_KEY = 'teamup_state';

const initialState = {
  token: null,
  user: null,
  tournaments: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'auth/login':
      return { ...state, token: action.token, user: action.user };
    case 'auth/logout':
      return { ...state, token: null, user: null };
    case 'user/update':
      return { ...state, user: { ...state.user, ...action.patch } };
    case 'tournament/create':
      return { ...state, tournaments: [action.tournament, ...state.tournaments] };
    case 'tournament/update':
      return {
        ...state,
        tournaments: state.tournaments.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    case 'tournament/delete':
      return { ...state, tournaments: state.tournaments.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

function init() {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORE_KEY)) };
  } catch {
    return initialState;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
