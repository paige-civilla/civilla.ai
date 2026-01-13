import { createContext, useCallback, useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface TourModuleState {
  seen?: boolean;
  dismissedAt?: string;
  completedStepIds?: string[];
}

export interface TourState {
  globalDisable?: boolean;
  [moduleKey: string]: TourModuleState | boolean | undefined;
}

interface TourContextValue {
  tourState: TourState;
  isLoading: boolean;
  startTour: (moduleKey: string) => void;
  dismissStep: (moduleKey: string, stepId: string) => void;
  completeStep: (moduleKey: string, stepId: string) => void;
  markModuleSeen: (moduleKey: string) => void;
  isStepDone: (moduleKey: string, stepId: string) => boolean;
  isModuleDismissed: (moduleKey: string) => boolean;
  resetModule: (moduleKey: string) => void;
  setGlobalDisable: (disabled: boolean) => void;
}

export const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_KEY = "civilla_tour_state";

function getLocalTourState(): TourState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setLocalTourState(state: TourState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [tourState, setTourState] = useState<TourState>(() => getLocalTourState());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPatchRef = useRef<Record<string, unknown>>({});

  const { data, isLoading } = useQuery<{ tourState: TourState }>({
    queryKey: ["/api/user/tour-state"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data?.tourState) {
      const merged = { ...getLocalTourState(), ...data.tourState };
      setTourState(merged);
      setLocalTourState(merged);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      return apiRequest("/api/user/tour-state", {
        method: "PATCH",
        body: JSON.stringify({ patch }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/tour-state"] });
    },
  });

  const persistPatch = useCallback((patch: Record<string, unknown>) => {
    pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const patchToSend = { ...pendingPatchRef.current };
      pendingPatchRef.current = {};
      mutation.mutate(patchToSend);
    }, 500);
  }, [mutation]);

  const updateState = useCallback((updater: (prev: TourState) => TourState) => {
    setTourState((prev) => {
      const next = updater(prev);
      setLocalTourState(next);
      return next;
    });
  }, []);

  const getModuleState = useCallback((moduleKey: string): TourModuleState => {
    const state = tourState[moduleKey];
    if (typeof state === "object" && state !== null) {
      return state as TourModuleState;
    }
    return {};
  }, [tourState]);

  const startTour = useCallback((moduleKey: string) => {
    const patch = {
      [moduleKey]: {
        ...getModuleState(moduleKey),
        seen: true,
        dismissedAt: undefined,
        completedStepIds: [],
      },
    };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [getModuleState, updateState, persistPatch]);

  const dismissStep = useCallback((moduleKey: string, stepId: string) => {
    const patch = {
      [moduleKey]: {
        ...getModuleState(moduleKey),
        dismissedAt: new Date().toISOString(),
      },
    };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [getModuleState, updateState, persistPatch]);

  const completeStep = useCallback((moduleKey: string, stepId: string) => {
    const current = getModuleState(moduleKey);
    const completedStepIds = [...(current.completedStepIds || [])];
    if (!completedStepIds.includes(stepId)) {
      completedStepIds.push(stepId);
    }
    const patch = {
      [moduleKey]: {
        ...current,
        completedStepIds,
      },
    };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [getModuleState, updateState, persistPatch]);

  const markModuleSeen = useCallback((moduleKey: string) => {
    const current = getModuleState(moduleKey);
    if (current.seen) return;
    
    const patch = {
      [moduleKey]: {
        ...current,
        seen: true,
      },
    };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [getModuleState, updateState, persistPatch]);

  const isStepDone = useCallback((moduleKey: string, stepId: string): boolean => {
    const state = getModuleState(moduleKey);
    return state.completedStepIds?.includes(stepId) || false;
  }, [getModuleState]);

  const isModuleDismissed = useCallback((moduleKey: string): boolean => {
    const state = getModuleState(moduleKey);
    return !!state.dismissedAt;
  }, [getModuleState]);

  const resetModule = useCallback((moduleKey: string) => {
    const patch = {
      [moduleKey]: {
        seen: true,
        dismissedAt: undefined,
        completedStepIds: [],
      },
    };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [updateState, persistPatch]);

  const setGlobalDisable = useCallback((disabled: boolean) => {
    const patch = { globalDisable: disabled };
    updateState((prev) => ({ ...prev, ...patch }));
    persistPatch(patch);
  }, [updateState, persistPatch]);

  return (
    <TourContext.Provider
      value={{
        tourState,
        isLoading,
        startTour,
        dismissStep,
        completeStep,
        markModuleSeen,
        isStepDone,
        isModuleDismissed,
        resetModule,
        setGlobalDisable,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
