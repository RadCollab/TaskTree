import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, shadows, spacing, typeColorsList, typography } from '@/constants/theme';
import { IconShape, TaskList } from '@/data/types';
import { DragHandleIcon, PlusIcon } from '@/components/icons';
import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';
import { DraggableListRows } from '@/components/planning/DraggableListRows';

export interface ListDraft {
  name: string;
  color: string;
  icon: IconShape;
  behavior: 'task' | 'event';
  defaultRepeats: boolean;
  defaultNotificationEnabled: boolean;
}

interface ManageListsFlowProps {
  lists: TaskList[];
  visible: boolean;
  onClose: () => void;
  onCreateList: (draft: ListDraft) => void;
  onUpdateList: (listId: string, draft: ListDraft) => void;
  onReorderLists: (orderedIds: string[]) => void;
}

type FlowStep = 'overview' | 'style' | 'behavior' | 'defaults';

const ICON_OPTIONS: IconShape[] = [
  'diamond',
  'circle',
  'traingle',
  'square',
  'pentagon',
  'hexagon',
  'heart',
  'bookmark',
  'star',
  'burst',
  'blob',
];

const EMPTY_DRAFT: ListDraft = {
  name: '',
  color: colors.content,
  icon: 'heart',
  behavior: 'task',
  defaultRepeats: false,
  defaultNotificationEnabled: false,
};

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 4.6, height: 9.2 },
  shadowOpacity: 0.1,
  shadowRadius: 13.8,
  elevation: 4,
} as const;

const SHEET_ANIMATION_MS = 260;

export function ManageListsFlow({
  lists,
  visible,
  onClose,
  onCreateList,
  onUpdateList,
  onReorderLists,
}: ManageListsFlowProps) {
  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.sortOrder - b.sortOrder),
    [lists]
  );
  const [step, setStep] = useState<FlowStep>('overview');
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<ListDraft>(EMPTY_DRAFT);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [pendingIcon, setPendingIcon] = useState<IconShape>('heart');
  const sheetTranslateY = useState(() => new Animated.Value(420))[0];
  const pickerTranslateY = useState(() => new Animated.Value(320))[0];
  const backdropOpacity = useState(() => new Animated.Value(0))[0];
  const pickerBackdropOpacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible) return;
    setStep('overview');
    setOrderedIds(sortedLists.map((list) => list.id));
    setDraft(EMPTY_DRAFT);
    setEditingListId(null);
    setIsIconPickerOpen(false);
    setPendingIcon('heart');
  }, [sortedLists, visible]);

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(420);
      backdropOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: SHEET_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: SHEET_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetTranslateY, visible]);

  useEffect(() => {
    if (!isIconPickerOpen) {
      pickerTranslateY.setValue(320);
      pickerBackdropOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(pickerTranslateY, {
        toValue: 0,
        duration: SHEET_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pickerBackdropOpacity, {
        toValue: 1,
        duration: SHEET_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isIconPickerOpen, pickerBackdropOpacity, pickerTranslateY]);

  const workingLists = useMemo(() => {
    const listMap = new Map(sortedLists.map((list) => [list.id, list]));
    return orderedIds
      .map((id) => listMap.get(id))
      .filter((list): list is TaskList => Boolean(list));
  }, [orderedIds, sortedLists]);

  const originalList = useMemo(
    () => (editingListId ? lists.find((list) => list.id === editingListId) ?? null : null),
    [editingListId, lists]
  );

  const isOrderDirty = useMemo(() => {
    const baseline = sortedLists.map((list) => list.id);
    return baseline.join('|') !== orderedIds.join('|');
  }, [orderedIds, sortedLists]);

  const isStepOneValid = draft.name.trim().length > 0 && Boolean(draft.color) && Boolean(draft.icon);

  const hasDraftChanges = useMemo(() => {
    if (!originalList) return isStepOneValid;
    return (
      originalList.name !== draft.name.trim() ||
      originalList.color !== draft.color ||
      originalList.icon !== draft.icon ||
      originalList.behavior !== draft.behavior ||
      originalList.defaultRepeats !== draft.defaultRepeats ||
      originalList.defaultNotificationEnabled !== draft.defaultNotificationEnabled
    );
  }, [draft, isStepOneValid, originalList]);

  const openCreateFlow = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setEditingListId(null);
    setPendingIcon(EMPTY_DRAFT.icon);
    setStep('style');
  }, []);

  const openEditFlow = useCallback((list: TaskList) => {
    const nextDraft: ListDraft = {
      name: list.name,
      color: list.color,
      icon: list.icon,
      behavior: list.behavior,
      defaultRepeats: list.defaultRepeats,
      defaultNotificationEnabled: list.defaultNotificationEnabled,
    };
    setDraft(nextDraft);
    setEditingListId(list.id);
    setPendingIcon(list.icon);
    setStep('style');
  }, []);

  const closeAll = useCallback(() => {
    setIsIconPickerOpen(false);
    onClose();
  }, [onClose]);

  const handleSaveList = useCallback(() => {
    const normalizedDraft = {
      ...draft,
      name: draft.name.trim(),
    };

    if (editingListId) {
      onUpdateList(editingListId, normalizedDraft);
    } else {
      onCreateList(normalizedDraft);
    }

    setStep('overview');
    setDraft(EMPTY_DRAFT);
    setEditingListId(null);
    closeAll();
  }, [closeAll, draft, editingListId, onCreateList, onUpdateList]);

  const currentStepIndex = step === 'style' ? '1/3' : step === 'behavior' ? '2/3' : '3/3';
  const saveDisabled = editingListId ? !hasDraftChanges : !isStepOneValid;

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={closeAll}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeAll} />
          </Animated.View>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.handle} />
            {step === 'overview' ? (
              <ManageListsOverview
                lists={workingLists}
                isSaveEnabled={isOrderDirty}
                onAddNew={openCreateFlow}
                onCancel={closeAll}
                onEdit={openEditFlow}
                onReorder={setOrderedIds}
                onSave={() => {
                  onReorderLists(orderedIds);
                  closeAll();
                }}
              />
            ) : (
              <ManageListWizard
                draft={draft}
                currentStep={step}
                editingList={originalList}
                saveDisabled={saveDisabled}
                stepLabel={currentStepIndex}
                onBack={() => {
                  if (step === 'style') {
                    setStep('overview');
                    return;
                  }
                  setStep(step === 'behavior' ? 'style' : 'behavior');
                }}
                onIconPress={() => {
                  setPendingIcon(draft.icon);
                  setIsIconPickerOpen(true);
                }}
                onNext={() => {
                  if (step === 'style') setStep('behavior');
                  if (step === 'behavior') setStep('defaults');
                }}
                onSave={handleSaveList}
                onSetDraft={setDraft}
              />
            )}
          </Animated.View>
          {isIconPickerOpen ? (
            <View style={styles.iconPickerOverlay}>
              <Animated.View style={[styles.iconPickerBackdrop, { opacity: pickerBackdropOpacity }]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsIconPickerOpen(false)} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.sheet,
                  styles.iconPickerSheet,
                  { transform: [{ translateY: pickerTranslateY }] },
                ]}
              >
                <IconPickerSheet
                  color={draft.color}
                  selectedIcon={pendingIcon}
                  onCancel={() => setIsIconPickerOpen(false)}
                  onSave={() => {
                    setDraft((prev) => ({ ...prev, icon: pendingIcon }));
                    setIsIconPickerOpen(false);
                  }}
                  onSelect={setPendingIcon}
                />
              </Animated.View>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

interface ManageListsOverviewProps {
  lists: TaskList[];
  isSaveEnabled: boolean;
  onAddNew: () => void;
  onCancel: () => void;
  onEdit: (list: TaskList) => void;
  onReorder: (orderedIds: string[]) => void;
  onSave: () => void;
}

function ManageListsOverview({
  lists,
  isSaveEnabled,
  onAddNew,
  onCancel,
  onEdit,
  onReorder,
  onSave,
}: ManageListsOverviewProps) {
  return (
    <View style={styles.sheetContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage lists</Text>
      </View>

      <View style={styles.overviewContent}>
        <DraggableListRows
          lists={lists}
          onReorder={onReorder}
          renderRow={(list) => (
            <ManageListRow list={list} onEdit={() => onEdit(list)} />
          )}
          gap={16}
        />

        <Pressable style={styles.addNewButton} onPress={onAddNew}>
          <PlusIcon size={12} color={colors.content} />
          <Text style={styles.addNewText}>Add New</Text>
        </Pressable>

        <ActionButtons
          cancelLabel="Cancel"
          confirmLabel="Save"
          confirmDisabled={!isSaveEnabled}
          onCancel={onCancel}
          onConfirm={onSave}
        />
      </View>
    </View>
  );
}

function ManageListRow({ list, onEdit }: { list: TaskList; onEdit: () => void }) {
  const description = getManageSummary(list);

  return (
    <View style={styles.manageRow}>
      <View style={styles.dragHandleWrap}>
        <DragHandleIcon />
      </View>
      <TaskTypeIcon shape={list.icon} variant="complete" color={list.color} size={24} />
      <View style={styles.manageRowText}>
        <Text style={styles.manageRowTitle}>{list.name}</Text>
        <Text style={styles.manageRowDescription}>{description}</Text>
      </View>
      <Pressable hitSlop={10} onPress={onEdit}>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

interface ManageListWizardProps {
  currentStep: FlowStep;
  draft: ListDraft;
  editingList: TaskList | null;
  saveDisabled: boolean;
  stepLabel: string;
  onBack: () => void;
  onIconPress: () => void;
  onNext: () => void;
  onSave: () => void;
  onSetDraft: Dispatch<SetStateAction<ListDraft>>;
}

function ManageListWizard({
  currentStep,
  draft,
  editingList,
  saveDisabled,
  stepLabel,
  onBack,
  onIconPress,
  onNext,
  onSave,
  onSetDraft,
}: ManageListWizardProps) {
  const [isNameFocused, setIsNameFocused] = useState(false);

  if (currentStep === 'style') {
    return (
      <View style={styles.sheetContent}>
        <WizardHeader title="Style Tag" stepLabel={stepLabel} />
        <View style={styles.wizardContent}>
          <View style={styles.formRow}>
            <View style={styles.iconField}>
              <Text style={styles.fieldLabel}>Icon</Text>
              <Pressable style={styles.iconPreviewButton} onPress={onIconPress}>
                <TaskTypeIcon shape={draft.icon} variant="complete" color={draft.color} size={24} />
              </Pressable>
            </View>

            <View style={styles.nameField}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={[
                  styles.inputCard,
                  styles.nameInput,
                  isNameFocused && styles.inputCardFocused,
                  { outlineStyle: 'none' } as any,
                ]}
                value={draft.name}
                onBlur={() => setIsNameFocused(false)}
                onChangeText={(name) => onSetDraft((prev) => ({ ...prev, name }))}
                onFocus={() => setIsNameFocused(true)}
                placeholder="Stand up..."
                placeholderTextColor={colors.content}
              />
            </View>
          </View>

          <View style={styles.colorSection}>
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {[colors.content, ...typeColorsList].map((colorValue) => {
                const isSelected = draft.color === colorValue;
                return (
                  <Pressable
                    key={colorValue}
                    style={[styles.colorCell, isSelected && styles.colorCellSelected]}
                    onPress={() => onSetDraft((prev) => ({ ...prev, color: colorValue }))}
                  >
                    <View style={[styles.colorDot, { backgroundColor: colorValue }]} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <ActionButtons
            cancelLabel="Cancel"
            confirmLabel="Next"
            confirmDisabled={draft.name.trim().length === 0}
            onCancel={onBack}
            onConfirm={onNext}
          />
        </View>
      </View>
    );
  }

  if (currentStep === 'behavior') {
    return (
      <View style={styles.sheetContent}>
        <WizardHeader title="How does this Tag act?" stepLabel={stepLabel} />
        <View style={styles.wizardContent}>
          <BehaviorCard
            title="Task"
            color={colors.types.forest}
            selected={draft.behavior === 'task'}
            points={['Has start time & duration', 'Will move in auto-scheduling']}
            onPress={() => onSetDraft((prev) => ({ ...prev, behavior: 'task' }))}
          />
          <BehaviorCard
            title="Event"
            color={colors.types.indigo}
            selected={draft.behavior === 'event'}
            points={['Has start & end time, or "all day"', 'Will NOT move in auto-scheduling']}
            onPress={() => onSetDraft((prev) => ({ ...prev, behavior: 'event' }))}
          />

          <ActionButtons
            cancelLabel="Back"
            confirmLabel="Next"
            onCancel={onBack}
            onConfirm={onNext}
          />
        </View>
      </View>
    );
  }

  const subjectName = draft.name.trim() || editingList?.name || 'this list';
  const subjectLabel = draft.behavior === 'event' ? 'Events' : 'Tasks';

  return (
    <View style={styles.sheetContent}>
      <WizardHeader
        title="Set Defaults"
        stepLabel={stepLabel}
        subtitle={`Will be added to new ${subjectName} ${subjectLabel}`}
      />
      <View style={styles.wizardContent}>
        <View style={styles.defaultsCard}>
          <ToggleRow
            label="Repeats"
            value={draft.defaultRepeats}
            onToggle={() => onSetDraft((prev) => ({ ...prev, defaultRepeats: !prev.defaultRepeats }))}
          />
          <ToggleRow
            label="Notification"
            value={draft.defaultNotificationEnabled}
            onToggle={() =>
              onSetDraft((prev) => ({
                ...prev,
                defaultNotificationEnabled: !prev.defaultNotificationEnabled,
              }))
            }
          />
        </View>

        <ActionButtons
          cancelLabel="Back"
          confirmLabel="Save"
          confirmDisabled={saveDisabled}
          onCancel={onBack}
          onConfirm={onSave}
        />
      </View>
    </View>
  );
}

function WizardHeader({
  title,
  stepLabel,
  subtitle,
}: {
  title: string;
  stepLabel: string;
  subtitle?: string;
}) {
  return (
    <View style={[styles.header, subtitle && styles.headerWithSubtitle]}>
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function BehaviorCard({
  color,
  onPress,
  points,
  selected,
  title,
}: {
  color: string;
  onPress: () => void;
  points: string[];
  selected: boolean;
  title: string;
}) {
  const textColor = selected ? colors.surface.bg : colors.content;
  const iconColor = selected ? colors.surface.bg : color;

  return (
    <Pressable
      style={[
        styles.behaviorCard,
        selected && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <View style={styles.behaviorHeader}>
        <TaskTypeIcon shape={title === 'Task' ? 'circle' : 'square'} variant="small" color={iconColor} size={16} />
            <Text style={[styles.behaviorTitle, { color: selected ? colors.surface.bg : color }]}>{title}</Text>
          </View>
      <View style={styles.behaviorPoints}>
        {points.map((point) => (
          <View key={point} style={styles.behaviorPointRow}>
            <Text style={[styles.behaviorBullet, { color: textColor }]}>•</Text>
            <Text style={[styles.behaviorPointText, { color: textColor }]}>{point}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function ToggleRow({
  label,
  onToggle,
  value,
}: {
  label: string;
  onToggle: () => void;
  value: boolean;
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function IconPickerSheet({
  color,
  onCancel,
  onSave,
  onSelect,
  selectedIcon,
}: {
  color: string;
  onCancel: () => void;
  onSave: () => void;
  onSelect: (icon: IconShape) => void;
  selectedIcon: IconShape;
}) {
  return (
    <View style={styles.sheetContent}>
      <View style={styles.headerCompact}>
        <Text style={styles.title}>Select Icon</Text>
      </View>
      <View style={styles.iconPickerContent}>
        <View style={styles.iconGrid}>
          {ICON_OPTIONS.map((icon) => {
            const isSelected = selectedIcon === icon;
            return (
              <Pressable
                key={icon}
                style={[styles.iconCell, isSelected && styles.iconCellSelected]}
                onPress={() => onSelect(icon)}
              >
                <TaskTypeIcon
                  shape={icon}
                  variant={isSelected ? 'complete' : 'incomplete'}
                  color={color}
                  size={24}
                />
              </Pressable>
            );
          })}
        </View>

        <ActionButtons
          cancelLabel="Cancel"
          confirmLabel="Save"
          onCancel={onCancel}
          onConfirm={onSave}
        />
      </View>
    </View>
  );
}

function ActionButtons({
  cancelLabel,
  confirmLabel,
  confirmDisabled,
  onCancel,
  onConfirm,
}: {
  cancelLabel: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Pressable style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
      </Pressable>

      <Pressable
        style={[styles.confirmButton, confirmDisabled && styles.confirmButtonDisabled]}
        disabled={confirmDisabled}
        onPress={onConfirm}
      >
        <Text style={[styles.confirmButtonText, confirmDisabled && styles.confirmButtonTextDisabled]}>
          {confirmLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function getManageSummary(list: TaskList) {
  if (list.isSystem) {
    return list.behavior === 'event'
      ? 'Can have start+end time'
      : 'Can have start time & length';
  }

  return list.behavior === 'event' ? 'Acts like an Event' : 'Acts like a Task';
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface.sheet,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 21,
    overflow: 'hidden',
    ...shadows.nav,
  },
  handle: {
    width: 22,
    height: 3,
    borderRadius: 100,
    backgroundColor: colors.content,
    opacity: 0.2,
    alignSelf: 'center',
  },
  sheetContent: {
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 8,
  },
  headerWithSubtitle: {
    gap: 8,
  },
  headerCompact: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 59,
  },
  title: {
    ...typography.headlineMedium,
    color: colors.content,
    textAlign: 'center',
  },
  stepLabel: {
    ...typography.titleSmall,
    color: colors.content,
    width: 59,
    textAlign: 'right',
  },
  subtitle: {
    ...typography.titleSmall,
    color: colors.content,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 257,
  },
  overviewContent: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 16,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 24,
    paddingVertical: 16,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    ...CARD_SHADOW,
  },
  dragHandleWrap: {
    width: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageRowText: {
    flex: 1,
    gap: 2,
  },
  manageRowTitle: {
    ...typography.titleMedium,
    color: colors.content,
  },
  manageRowDescription: {
    ...typography.bodyLarge,
    color: colors.content,
  },
  editText: {
    ...typography.bodySmall,
    color: colors.content,
    textDecorationLine: 'underline',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.borderDk,
    borderRadius: 10,
    paddingVertical: 16,
  },
  addNewText: {
    ...typography.bodySmall,
    color: colors.content,
  },
  wizardContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
    gap: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconField: {
    width: 54,
    gap: 6,
  },
  nameField: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    ...typography.titleSmall,
    color: colors.content,
  },
  iconPreviewButton: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  inputCard: {
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 18,
    ...CARD_SHADOW,
  },
  inputCardFocused: {
    borderColor: colors.borderDk,
  },
  nameInput: {
    ...typography.bodySmall,
    fontSize: 16,
    color: colors.content,
    paddingVertical: 0,
  },
  colorSection: {
    gap: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  colorCell: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCellSelected: {
    borderWidth: 2,
    borderColor: colors.content,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 999,
  },
  behaviorCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 24,
    paddingTop: 21,
    paddingBottom: 24,
    gap: 16,
    ...CARD_SHADOW,
  },
  behaviorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  behaviorTitle: {
    ...typography.headlineMedium,
  },
  behaviorPoints: {
    gap: 6,
    paddingLeft: 6,
  },
  behaviorPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  behaviorBullet: {
    ...typography.titleSmall,
    marginTop: 1,
  },
  behaviorPointText: {
    ...typography.titleSmall,
    flex: 1,
  },
  defaultsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  toggleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDk,
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 40,
    borderWidth: 1.7,
    borderColor: colors.content,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: colors.content,
  },
  toggleThumb: {
    width: 11,
    height: 11,
    borderRadius: 11,
    backgroundColor: colors.content,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface.bg,
  },
  toggleLabel: {
    ...typography.titleMedium,
    color: colors.content,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    minWidth: 86,
    height: 59,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.headlineMedium,
    color: colors.content,
  },
  confirmButton: {
    flex: 1,
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.content,
    borderRadius: 100,
  },
  confirmButtonDisabled: {
    opacity: 0.1,
  },
  confirmButtonText: {
    ...typography.headlineMedium,
    color: colors.surface.bg,
  },
  confirmButtonTextDisabled: {
    color: colors.surface.bg,
  },
  iconPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  iconPickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iconPickerSheet: {
    paddingTop: 24,
  },
  iconPickerContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 50,
    gap: 24,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconCellSelected: {
    backgroundColor: colors.surface.card,
    borderColor: colors.borderDk,
    borderWidth: 1,
    ...CARD_SHADOW,
  },
});
