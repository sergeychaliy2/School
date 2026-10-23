import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_BELLS, isValidTime, type Bell } from '@/domain/bells';
import { newId, type Homework } from '@/domain/homework';
import { hasGrade } from '@/domain/schedule';
import type { TeacherPins } from '@/domain/teachers';

const STORAGE_KEY = 'novoselicy.state.v1';

export type ThemePref = 'system' | 'light' | 'dark';
export type Profile = { name: string; grade: string };

type Persisted = {
  profile: Profile | null;
  /** Grade chosen by someone browsing without a profile. */
  browseGrade: string | null;
  bells: Bell[];
  themePref: ThemePref;
  bellsTouched: boolean;
  homework: Homework[];
  /** grade::subject -> teacher name, chosen by the student. */
  teacherPins: TeacherPins;
  /** room number -> floor, filled in by whoever knows the building. */
  roomFloors: Record<string, string>;
};

type AppState = Persisted & { hydrated: boolean };

type AppContextValue = AppState & {
  /** Grade the screens should render: the profile's, else the browsed one. */
  activeGrade: string | null;
  signIn: (profile: Profile) => void;
  signOut: () => void;
  setGrade: (grade: string) => void;
  setBrowseGrade: (grade: string) => void;
  setBells: (bells: Bell[]) => void;
  resetBells: () => void;
  addHomework: (task: Omit<Homework, 'id' | 'createdAt' | 'done'>) => void;
  editHomework: (id: string, text: string) => void;
  setHomeworkPhotos: (id: string, photos: string[]) => void;
  clearHomework: (filter: { date?: string; from?: string; to?: string }) => void;
  toggleHomework: (id: string) => void;
  removeHomework: (id: string) => void;
  setTeacherPin: (key: string, name: string | null) => void;
  setRoomFloor: (room: string, floor: string | null) => void;
  setThemePref: (pref: ThemePref) => void;
};

const INITIAL: AppState = {
  hydrated: false,
  profile: null,
  browseGrade: null,
  bells: DEFAULT_BELLS,
  themePref: 'system',
  bellsTouched: false,
  homework: [],
  teacherPins: {},
  roomFloors: {},
};

const AppContext = createContext<AppContextValue | null>(null);

/** Storage can hold anything an older build wrote — validate before trusting it. */
function reviveBells(value: unknown): Bell[] {
  if (!Array.isArray(value)) return DEFAULT_BELLS;
  const revived = value
    .filter(
      (item): item is Bell =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as Bell).n === 'number' &&
        typeof (item as Bell).start === 'string' &&
        typeof (item as Bell).end === 'string' &&
        isValidTime((item as Bell).start) &&
        isValidTime((item as Bell).end),
    )
    .sort((a, b) => a.n - b.n);
  return revived.length === DEFAULT_BELLS.length ? revived : DEFAULT_BELLS;
}

/** Anything could be in storage from an older build — keep only sane tasks. */
function reviveHomework(value: unknown): Homework[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Homework => {
    if (!item || typeof item !== 'object') return false;
    const t = item as Partial<Homework>;
    return (
      typeof t.id === 'string' &&
      typeof t.text === 'string' &&
      typeof t.subject === 'string' &&
      typeof t.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
      typeof t.grade === 'string' &&
      typeof t.done === 'boolean' &&
      typeof t.createdAt === 'number'
    );
  });
}

/** Keeps only string->string entries; storage may hold anything. */
function reviveStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'string' && entry.trim()) out[key] = entry;
  }
  return out;
}

function reviveProfile(value: unknown): Profile | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Profile>;
  if (typeof candidate.name !== 'string' || !hasGrade(candidate.grade)) return null;
  const name = candidate.name.trim().slice(0, 40);
  return name ? { name, grade: candidate.grade } : null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((serialized) => {
        if (cancelled) return;
        if (!serialized) {
          setState((prev) => ({ ...prev, hydrated: true }));
          return;
        }
        const parsed = JSON.parse(serialized) as Partial<Persisted>;
        setState({
          hydrated: true,
          profile: reviveProfile(parsed.profile),
          browseGrade: hasGrade(parsed.browseGrade) ? parsed.browseGrade : null,
          bells: reviveBells(parsed.bells),
          themePref:
            parsed.themePref === 'light' || parsed.themePref === 'dark' || parsed.themePref === 'system'
              ? parsed.themePref
              : 'system',
          bellsTouched: parsed.bellsTouched === true,
          homework: reviveHomework(parsed.homework),
          teacherPins: reviveStringMap(parsed.teacherPins),
          roomFloors: reviveStringMap(parsed.roomFloors),
        });
      })
      .catch(() => {
        if (!cancelled) setState((prev) => ({ ...prev, hydrated: true }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist off the interaction path; the UI never waits on storage.
  useEffect(() => {
    if (!state.hydrated) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      const payload: Persisted = {
        profile: state.profile,
        browseGrade: state.browseGrade,
        bells: state.bells,
        themePref: state.themePref,
        bellsTouched: state.bellsTouched,
        homework: state.homework,
        teacherPins: state.teacherPins,
        roomFloors: state.roomFloors,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => {
        /* a dropped write only costs the student a re-pick; never crash the app */
      });
    }, 250);

    return () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    };
  }, [state]);

  const signIn = useCallback((profile: Profile) => {
    setState((prev) => ({
      ...prev,
      profile: { name: profile.name.trim().slice(0, 40), grade: profile.grade },
    }));
  }, []);

  const signOut = useCallback(() => {
    setState((prev) => ({ ...prev, profile: null }));
  }, []);

  const setGrade = useCallback((grade: string) => {
    setState((prev) =>
      prev.profile
        ? { ...prev, profile: { ...prev.profile, grade } }
        : { ...prev, browseGrade: grade },
    );
  }, []);

  const setBrowseGrade = useCallback((grade: string) => {
    setState((prev) => ({ ...prev, browseGrade: grade }));
  }, []);

  const setBells = useCallback((bells: Bell[]) => {
    setState((prev) => ({ ...prev, bells, bellsTouched: true }));
  }, []);

  const resetBells = useCallback(() => {
    setState((prev) => ({ ...prev, bells: DEFAULT_BELLS, bellsTouched: false }));
  }, []);

  const addHomework = useCallback((task: Omit<Homework, 'id' | 'createdAt' | 'done'>) => {
    // An empty row is legitimate: "+" creates the line, the student fills it in.
    // Leaving it empty and confirming deletes it again via editHomework.
    const text = task.text.trim();
    setState((prev) => ({
      ...prev,
      homework: [
        ...prev.homework,
        { ...task, text, id: newId(), createdAt: Date.now(), done: false },
      ],
    }));
  }, []);

  const editHomework = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    setState((prev) => ({
      ...prev,
      // An emptied task with no photo is a deleted task; one with a photo stays,
      // because the picture may be the whole assignment.
      homework: prev.homework.flatMap((task) => {
        if (task.id !== id) return [task];
        if (!trimmed && (task.photos?.length ?? 0) === 0) return [];
        return [{ ...task, text: trimmed }];
      }),
    }));
  }, []);

  const setHomeworkPhotos = useCallback((id: string, photos: string[]) => {
    setState((prev) => ({
      ...prev,
      homework: prev.homework.map((task) => (task.id === id ? { ...task, photos } : task)),
    }));
  }, []);

  /**
   * Bulk delete. Deliberately returns nothing: counting inside the updater is
   * wrong, because React invokes it twice in development.
   */
  const clearHomework = useCallback((filter: { date?: string; from?: string; to?: string }) => {
    setState((prev) => ({
      ...prev,
      homework: prev.homework.filter((task) => {
        if (filter.date !== undefined) return task.date !== filter.date;
        if (filter.from !== undefined && filter.to !== undefined) {
          return !(task.date >= filter.from && task.date <= filter.to);
        }
        return false; // no filter means clear everything
      }),
    }));
  }, []);

  const toggleHomework = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      homework: prev.homework.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }));
  }, []);

  const removeHomework = useCallback((id: string) => {
    setState((prev) => ({ ...prev, homework: prev.homework.filter((task) => task.id !== id) }));
  }, []);

  const setTeacherPin = useCallback((key: string, name: string | null) => {
    setState((prev) => {
      const next = { ...prev.teacherPins };
      if (name) next[key] = name;
      else delete next[key];
      return { ...prev, teacherPins: next };
    });
  }, []);

  const setRoomFloor = useCallback((room: string, floor: string | null) => {
    setState((prev) => {
      const next = { ...prev.roomFloors };
      const trimmed = floor?.trim();
      if (trimmed) next[room] = trimmed;
      else delete next[room];
      return { ...prev, roomFloors: next };
    });
  }, []);

  const setThemePref = useCallback((themePref: ThemePref) => {
    setState((prev) => ({ ...prev, themePref }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      activeGrade: state.profile?.grade ?? state.browseGrade,
      signIn,
      signOut,
      setGrade,
      setBrowseGrade,
      setBells,
      resetBells,
      addHomework,
      editHomework,
      toggleHomework,
      removeHomework,
      setHomeworkPhotos,
      clearHomework,
      setTeacherPin,
      setRoomFloor,
      setThemePref,
    }),
    [
      state,
      signIn,
      signOut,
      setGrade,
      setBrowseGrade,
      setBells,
      resetBells,
      addHomework,
      editHomework,
      toggleHomework,
      removeHomework,
      setHomeworkPhotos,
      clearHomework,
      setTeacherPin,
      setRoomFloor,
      setThemePref,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
