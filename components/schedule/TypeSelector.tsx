import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { TaskList } from '@/data/types';
import { EllipsisIcon } from '@/components/icons';
import { TaskTypeIcon } from '@/components/icons/TaskTypeIcon';

interface TypeSelectorProps {
  lists: TaskList[];
  currentListId: string;
  onSelect: (listId: string) => void;
  onManage: () => void;
}

export function TypeSelector({ lists, currentListId, onSelect, onManage }: TypeSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.selectorTrack}>
          {lists.map((list) => {
            const isSelected = list.id === currentListId;
            return (
              <Pressable
                key={list.id}
                style={[
                  styles.typeOption,
                  isSelected && { backgroundColor: list.color },
                ]}
                onPress={() => onSelect(list.id)}
              >
                <TaskTypeIcon
                  shape={list.icon}
                  variant="small"
                  color={isSelected ? colors.surface.bg : list.color}
                  size={16}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    isSelected
                      ? { color: colors.surface.bg }
                      : { color: list.color, ...typography.bodySmall, fontSize: 13 },
                  ]}
                >
                  {list.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.manageButton} onPress={onManage}>
          <EllipsisIcon size={16} color={colors.content} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDk,
    overflow: 'hidden',
  },
  inner: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.borderDk,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    gap: 8,
  },
  selectorTrack: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  typeLabel: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 13,
  },
  manageButton: {
    width: 24,
    height: 24,
    borderRadius: 100,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
