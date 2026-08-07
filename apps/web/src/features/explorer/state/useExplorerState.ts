import { useEffect, useMemo, useReducer } from "react";
import type { ExplorerItem } from "@/features/explorer/types";
import type { ExplorerAction, ExplorerState } from "./types";

type ExplorerStateParams = {
  items: ExplorerItem[];
};

export function useExplorerState({ items }: ExplorerStateParams) {
  const [state, dispatch] = useReducer(
    (currentState: ExplorerState, action: ExplorerAction) =>
      explorerReducer(currentState, action, items),
    createInitialState(),
  );

  useEffect(() => {
    dispatch({ type: "items-changed", items });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => state.selectedKeys.has(item.key)),
    [items, state.selectedKeys],
  );

  const contextMenuItems = useMemo(() => {
    if (!state.contextMenu) return [];

    const contextMenuKeys = new Set(state.contextMenu.itemKeys);
    return items.filter((item) => contextMenuKeys.has(item.key));
  }, [items, state.contextMenu]);

  const focusedIndex =
    state.focusedIndex === null || items.length === 0
      ? null
      : Math.min(state.focusedIndex, items.length - 1);

  return {
    state: {
      ...state,
      focusedIndex,
    },
    selectedItems,
    selectedCount: selectedItems.length,
    contextMenuItems,
    dispatch,
  };
}

function createInitialState(): ExplorerState {
  return {
    selectedKeys: new Set(),
    anchorIndex: null,
    focusedIndex: null,
    isKeyboardActive: false,
    isDetailsOpen: false,
    contextMenu: null,
  };
}

function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
  items: ExplorerItem[],
): ExplorerState {
  switch (action.type) {
    case "items-changed":
      return reconcileItems(state, action.items);

    case "focus":
      return {
        ...state,
        focusedIndex: clampNullableIndex(action.index, items.length),
      };

    case "keyboard-active":
      return {
        ...state,
        isKeyboardActive: action.active,
      };

    case "select-one": {
      const item = items[action.index];
      if (!item) return state;

      return {
        ...state,
        selectedKeys: new Set([item.key]),
        anchorIndex: action.index,
        focusedIndex: action.index,
      };
    }

    case "toggle-select": {
      const item = items[action.index];
      if (!item) return state;

      const selectedKeys = new Set(state.selectedKeys);

      if (selectedKeys.has(item.key)) {
        selectedKeys.delete(item.key);
      } else {
        selectedKeys.add(item.key);
      }

      return {
        ...state,
        selectedKeys,
        anchorIndex: action.index,
        focusedIndex: action.index,
      };
    }

    case "select-range": {
      const item = items[action.index];
      if (!item) return state;

      const anchorIndex =
        state.anchorIndex ?? state.focusedIndex ?? action.index;

      return {
        ...state,
        selectedKeys: getRangeKeys(items, anchorIndex, action.index),
        focusedIndex: action.index,
      };
    }

    case "select-all":
      return {
        ...state,
        selectedKeys: new Set(items.map((item) => item.key)),
        anchorIndex: null,
      };

    case "clear-selection":
      return {
        ...state,
        selectedKeys: new Set(),
        anchorIndex: null,
      };

    case "open-details":
      return {
        ...state,
        isDetailsOpen: true,
      };

    case "close-details":
      return {
        ...state,
        isDetailsOpen: false,
      };

    case "toggle-details":
      return {
        ...state,
        isDetailsOpen: !state.isDetailsOpen,
      };

    case "open-context-menu":
      return {
        ...state,
        contextMenu: {
          x: action.x,
          y: action.y,
          itemKeys: action.itemKeys,
        },
        focusedIndex: action.focusIndex,
        selectedKeys: action.replaceSelection
          ? new Set(action.itemKeys)
          : state.selectedKeys,
        anchorIndex: action.replaceSelection
          ? action.focusIndex
          : state.anchorIndex,
      };

    case "close-context-menu":
      return {
        ...state,
        contextMenu: null,
      };

    default:
      return state;
  }
}

function reconcileItems(state: ExplorerState, items: ExplorerItem[]) {
  const availableKeys = new Set(items.map((item) => item.key));
  const selectedKeys = new Set(
    [...state.selectedKeys].filter((key) => availableKeys.has(key)),
  );

  const focusedIndex = clampNullableIndex(state.focusedIndex, items.length);
  const anchorIndex = clampNullableIndex(state.anchorIndex, items.length);

  return {
    ...state,
    selectedKeys,
    focusedIndex,
    anchorIndex,
  };
}

function getRangeKeys(items: ExplorerItem[], from: number, to: number) {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const selectedKeys = new Set<string>();

  for (let index = start; index <= end; index++) {
    const item = items[index];

    if (item) {
      selectedKeys.add(item.key);
    }
  }

  return selectedKeys;
}

function clampNullableIndex(index: number | null, itemsLength: number) {
  if (index === null || itemsLength === 0) {
    return null;
  }

  return Math.max(0, Math.min(index, itemsLength - 1));
}
